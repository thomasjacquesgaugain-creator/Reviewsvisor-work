'use client';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { setCurrentPlace } from '@/lib/currentPlace';

export function AnalyzeEstablishmentButton({ place_id, name, address }: { place_id: string; name?: string; address?: string }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  return (
    <button
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          setCurrentPlace({ place_id, name, address });
          const { data, error } = await supabase.functions.invoke('analyze_reviews', {
            body: { place_id, name, address } // analyse & enregistrement (pas dry-run)
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          navigate(`/dashboard?place_id=${encodeURIComponent(place_id)}&ok=1`);
        } catch (e:any) {
          alert(`Échec de l'analyse: ${e?.message || 'erreur inconnue'}`);
        } finally {
          setLoading(false);
        }
      }}
      className="btn btn-primary"
    >
      {loading ? 'Analyse en cours…' : 'Analyser cet établissement'}
    </button>
  );
}