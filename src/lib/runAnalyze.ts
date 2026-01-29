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

/**
 * Lancer l'analyse avec le nouveau format v2-auto-universal
 */
export async function runAnalyzeV2({ place_id, name, address, dryRun }: AnalyzeParams): Promise<AnalyzeResponse> {
  try {
    console.log('[runAnalyzeV2] Calling analyze-reviews-v2 function with:', { place_id, name, address, dryRun });
    
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session?.access_token) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('analyze-reviews-v2', {
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
      console.error('[runAnalyzeV2] Error calling analyze-reviews-v2 function:', error);
      throw error;
    }

    console.log('[runAnalyzeV2] Function response:', data);
    return data as AnalyzeResponse;
  } catch (error) {
    console.error('[runAnalyzeV2] Error:', error);
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

/**
 * Relance l'analyse en supprimant d'abord les anciens insights
 * @param place_id - L'ID de l'établissement
 * @param name - Le nom de l'établissement (optionnel)
 * @param address - L'adresse de l'établissement (optionnel)
 */
export async function relancerAnalyse({ place_id, name, address }: AnalyzeParams): Promise<AnalyzeResponse> {
  try {
    console.log('[relancerAnalyse] Suppression des anciens insights pour:', place_id);
    
    // 1. Supprimer les anciens insights
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error: deleteError } = await supabase
      .from('review_insights')
      .delete()
      .eq('place_id', place_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[relancerAnalyse] Erreur lors de la suppression des insights:', deleteError);
      // Ne pas bloquer si la suppression échoue (peut-être qu'il n'y avait pas d'insights)
    } else {
      console.log('[relancerAnalyse] ✅ Anciens insights supprimés');
    }

    // 2. Relancer l'analyse
    console.log('[relancerAnalyse] Relance de l\'analyse...');
    return await runAnalyze({ place_id, name, address, dryRun: false });
  } catch (error) {
    console.error('[relancerAnalyse] Erreur:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}