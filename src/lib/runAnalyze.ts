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
    console.log('Calling analyze-reviews function with:', { place_id, name, address, dryRun });
    
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session?.access_token) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('analyze-reviews', {
      body: {
        place_id,
        name,
        address,
        dryRun
      },
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
      },
    });

    if (error) {
      console.error('Error calling analyze-reviews function:', error);
      throw error;
    }

    console.log('Function response:', data);
    return data as AnalyzeResponse;
  } catch (error) {
    console.error('Error in runAnalyze:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function pingAnalyzeFunction(): Promise<AnalyzeResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-reviews', {
      body: { ping: true },
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