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
          // mémorise l'établissement courant
          setCurrentPlace({ place_id, name, address });
          // lance l'analyse (Google par place_id ; Yelp OFF par défaut)
          const { error } = await supabase.functions.invoke('analyze-reviews', {
            body: { place_id, name, address },
          });
          if (error) throw error;
          // redirige avec le place_id explicite
          navigate(`/dashboard?place_id=${encodeURIComponent(place_id)}`);
        } catch (e) {
          console.error(e);
          alert("Échec de l'analyse. Réessaie.");
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? 'Analyse en cours…' : 'Analyser cet établissement'}
    </Button>
  );
}