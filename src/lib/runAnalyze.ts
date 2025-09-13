import { supabase } from "@/integrations/supabase/client";

interface AnalyzeParams {
  place_id: string;
  name?: string;
  address?: string;
  dryRun?: boolean;
}

interface AnalyzeResponse {
  ok: boolean;
  counts?: {
    collected: number;
    google: number;
    yelp: number;
  };
  g_meta?: {
    rating: number;
    user_ratings_total: number;
  };
  dryRun?: boolean;
  logs?: string[];
  error?: string;
  details?: string;
}

export async function runAnalyze({ place_id, name, address, dryRun }: AnalyzeParams): Promise<AnalyzeResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if session exists
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const { data, error } = await supabase.functions.invoke('analyze-reviews', {
      body: {
        place_id,
        name,
        address,
        dryRun,
        __debug: true
      },
      headers
    });

    if (error) {
      console.error('Function invocation error:', error);
      return {
        ok: false,
        error: 'function_invocation_failed',
        details: error.message
      };
    }

    // Always expect JSON response
    if (typeof data === 'object' && data !== null) {
      return data as AnalyzeResponse;
    }

    return {
      ok: false,
      error: 'invalid_response_format',
      details: 'Expected JSON response from function'
    };

  } catch (error) {
    console.error('runAnalyze error:', error);
    return {
      ok: false,
      error: 'network_error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function pingAnalyzeFunction(): Promise<AnalyzeResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-reviews', {
      body: {},
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      return {
        ok: false,
        error: 'ping_failed',
        details: error.message
      };
    }

    return data as AnalyzeResponse;
  } catch (error) {
    return {
      ok: false,
      error: 'ping_error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}