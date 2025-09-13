'use client';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCurrentPlace } from '@/lib/currentPlace';
import { runAnalyze } from '@/lib/runAnalyze';

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
          await runAnalyze({ place_id, name, address }); // analyse & enregistrement (pas dry-run)
          navigate(`/dashboard?place_id=${encodeURIComponent(place_id)}&ok=1`);
        } catch (e: any) {
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