'use client';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { setCurrentPlace } from '@/lib/currentPlace';
import { Button } from '@/components/ui/button';

export function AnalyzeEstablishmentButton({ place_id, name, address }: { place_id: string; name?: string; address?: string }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  return (
    <Button
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase.functions.invoke('analyze-reviews', {
            body: { place_id, name, address },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          navigate(`/dashboard?place_id=${encodeURIComponent(place_id)}`);
        } catch (e:any) {
          console.error(e);
          alert(`Échec de l'analyse: ${e?.message || 'erreur inconnue'}`);
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? 'Analyse en cours…' : 'Analyser cet établissement'}
    </Button>
  );
}