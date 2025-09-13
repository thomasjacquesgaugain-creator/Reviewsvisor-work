import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests - always return 200
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: cors });
  }

  // Global try/catch - always return 200 with structured JSON
  try {
    const env = {
      OPENAI_API_KEY: !!Deno.env.get('OPENAI_API_KEY'),
      GOOGLE_PLACES_API_KEY: !!Deno.env.get('GOOGLE_PLACES_API_KEY'),
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      USE_YELP: (Deno.env.get('USE_YELP') || 'false') === 'true'
    };

    console.log('Environment check:', env);

    // Handle ping mode (GET requests or body with ping: true)
    if (req.method === 'GET') {
      return new Response(JSON.stringify({ 
        ok: true, 
        mode: 'ping', 
        env 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...cors } 
      });
    }

    // Parse request body safely
    let body = {};
    try {
      const text = await req.text();
      if (text.trim()) {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      console.log('JSON parse error (non-fatal):', parseError.message);
      // Continue with empty body instead of failing
    }

    const { place_id, name, address, dryRun, __debug, ping } = body as any;

    // Handle ping mode via body
    if (ping) {
      return new Response(JSON.stringify({ 
        ok: true, 
        mode: 'ping', 
        env 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...cors } 
      });
    }

    // Validate required parameters
    if (!place_id) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'missing_place_id',
        details: 'place_id is required for analysis'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const logs = [];

    // Get user ID from auth header if present (optional)
    let user_id = null;
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && env.SUPABASE_URL) {
        const supabaseAuth = createClient(env.SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || '');
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAuth.auth.getUser(token);
        user_id = user?.id || null;
        logs.push('Auth processed successfully');
      }
    } catch (error) {
      logs.push(`Auth parsing failed (non-fatal): ${error.message}`);
    }

    // Fetch Google Places reviews
    let reviews = [];
    let g_meta = { rating: 0, user_ratings_total: 0 };
    
    if (env.GOOGLE_PLACES_API_KEY) {
      try {
        const placesResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=reviews,rating,user_ratings_total&key=${Deno.env.get('GOOGLE_PLACES_API_KEY')}`
        );
        
        if (placesResponse.ok) {
          const placesData = await placesResponse.json();
          
          if (placesData.status === 'OK' && placesData.result) {
            reviews = placesData.result.reviews || [];
            g_meta = {
              rating: placesData.result.rating || 0,
              user_ratings_total: placesData.result.user_ratings_total || 0
            };
            logs.push(`Fetched ${reviews.length} Google reviews`);
          } else {
            logs.push(`Google Places API error: ${placesData.status}`);
          }
        } else {
          logs.push(`Google Places HTTP error: ${placesResponse.status}`);
        }
      } catch (error) {
        logs.push(`Google fetch failed: ${error.message}`);
      }
    } else {
      logs.push('No Google Places API key configured');
    }

    const counts = {
      collected: reviews.length,
      google: reviews.length,
      yelp: 0 // Always 0 since USE_YELP=false
    };

    if (dryRun) {
      return new Response(JSON.stringify({
        ok: true,
        counts,
        g_meta,
        dryRun: true,
        logs: __debug ? logs : undefined
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // Analyze reviews with OpenAI if we have reviews and API key
    let summary = {
      counts,
      top_issues: [],
      top_strengths: [],
      recommendations: [],
      overall_rating: g_meta.rating
    };

    if (env.OPENAI_API_KEY && reviews.length > 0) {
      try {
        const reviewTexts = reviews.map(r => r.text).filter(Boolean);
        
        if (reviewTexts.length > 0) {
          const prompt = `Analyze these restaurant reviews and provide a JSON response with:
- top_issues: max 3 issues with format {issue: string, severity: "Critique"|"Moyen", percentage: number}
- top_strengths: max 3 strengths with format {strength: string, percentage: number}
- recommendations: array of actionable recommendations
- overall_rating: calculated rating from sentiment (1-5)

Reviews:
${reviewTexts.slice(0, 20).join('\n---\n')}

Respond with valid JSON only.`;

          const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are a restaurant review analyst. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 1000
            }),
          });

          if (openAIResponse.ok) {
            const openAIData = await openAIResponse.json();
            try {
              const analysis = JSON.parse(openAIData.choices[0].message.content);
              
              summary = {
                counts,
                top_issues: analysis.top_issues || [],
                top_strengths: analysis.top_strengths || [],
                recommendations: analysis.recommendations || [],
                overall_rating: analysis.overall_rating || g_meta.rating
              };
              
              logs.push('OpenAI analysis completed');
            } catch (parseError) {
              logs.push(`OpenAI response parse failed: ${parseError.message}`);
            }
          } else {
            logs.push(`OpenAI HTTP error: ${openAIResponse.status}`);
          }
        }
      } catch (error) {
        logs.push(`OpenAI analysis failed: ${error.message}`);
      }
    } else if (!env.OPENAI_API_KEY) {
      logs.push('No OpenAI API key configured');
    }

    // Upsert to review_insights
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(env.SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
        
        const { error } = await supabase
          .from('review_insights')
          .upsert({
            place_id,
            user_id,
            last_analyzed_at: new Date().toISOString(),
            summary
          }, {
            onConflict: 'place_id'
          });

        if (error) {
          logs.push(`Upsert failed: ${error.message}`);
          return new Response(JSON.stringify({
            ok: false,
            error: 'upsert_failed',
            details: error.message,
            logs: __debug ? logs : undefined
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...cors },
          });
        }
        
        logs.push('Successfully upserted to review_insights');
      } catch (error) {
        logs.push(`Supabase error: ${error.message}`);
        return new Response(JSON.stringify({
          ok: false,
          error: 'supabase_error',
          details: error.message,
          logs: __debug ? logs : undefined
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
    } else {
      logs.push('Supabase credentials not configured');
    }

    // Success response
    return new Response(JSON.stringify({
      ok: true,
      counts,
      g_meta,
      dryRun: false,
      logs: __debug ? logs : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
    });

  } catch (error) {
    // Global error handler - always return 200 with structured error
    console.error('Error in analyze-reviews function:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: 'function_error',
      details: error.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
});