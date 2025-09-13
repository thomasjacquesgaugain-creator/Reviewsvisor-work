import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const googlePlacesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const useYelp = Deno.env.get('USE_YELP') === 'true';

    console.log('Environment check:', {
      OPENAI_API_KEY: !!openAIApiKey,
      GOOGLE_PLACES_API_KEY: !!googlePlacesApiKey,
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
      USE_YELP: useYelp
    });

    // Handle env check requests
    if (req.url.includes('ping')) {
      return new Response(JSON.stringify({
        ok: true,
        env: {
          OPENAI_API_KEY: !!openAIApiKey,
          GOOGLE_PLACES_API_KEY: !!googlePlacesApiKey,
          SUPABASE_URL: !!supabaseUrl,
          SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
          USE_YELP: useYelp
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { place_id, name, address, dryRun, __debug } = await req.json();

    if (!place_id) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'place_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const logs = [];

    // Get user ID from auth header if present
    let user_id = null;
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && supabaseUrl) {
        const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAuth.auth.getUser(token);
        user_id = user?.id || null;
      }
    } catch (error) {
      console.log('Auth parsing failed (non-fatal):', error.message);
    }

    // Fetch Google Places reviews
    let reviews = [];
    let g_meta = { rating: 0, user_ratings_total: 0 };
    
    if (googlePlacesApiKey) {
      try {
        const placesResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=reviews,rating,user_ratings_total&key=${googlePlacesApiKey}`
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
        }
      } catch (error) {
        logs.push(`Google fetch failed: ${error.message}`);
      }
    } else {
      logs.push('No Google Places API key');
    }

    const counts = {
      collected: reviews.length,
      google: reviews.length,
      yelp: 0 // Always 0 since USE_YELP=false
    };

    if (dryRun) {
      return new Response(JSON.stringify({
        ok: false,
        counts,
        g_meta,
        dryRun: true,
        logs: __debug ? logs : undefined
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    if (openAIApiKey && reviews.length > 0) {
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
              'Authorization': `Bearer ${openAIApiKey}`,
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
            const analysis = JSON.parse(openAIData.choices[0].message.content);
            
            summary = {
              counts,
              top_issues: analysis.top_issues || [],
              top_strengths: analysis.top_strengths || [],
              recommendations: analysis.recommendations || [],
              overall_rating: analysis.overall_rating || g_meta.rating
            };
            
            logs.push('OpenAI analysis completed');
          }
        }
      } catch (error) {
        logs.push(`OpenAI analysis failed: ${error.message}`);
      }
    }

    // Upsert to review_insights
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
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
            details: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        logs.push('Successfully upserted to review_insights');
      } catch (error) {
        logs.push(`Supabase error: ${error.message}`);
        return new Response(JSON.stringify({
          ok: false,
          error: 'supabase_error',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      counts,
      g_meta,
      dryRun: false,
      logs: __debug ? logs : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-reviews function:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});