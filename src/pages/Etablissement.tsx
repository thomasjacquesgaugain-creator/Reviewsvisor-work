import { useEffect, useState } from "react";

type Etab = {
  place_id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  url?: string;
  website?: string;
  phone?: string;
  rating?: number | null;
};

const STORAGE_KEY = "mon-etablissement";

function MonEtablissement({ etab }: { etab: Etab | null }) {
  if (!etab) {
    return (
      <div className="text-muted-foreground">
        Aucun établissement sélectionné. Utilisez l'autocomplétion ci-dessus pour en choisir un.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div><strong>Nom :</strong> {etab.name}</div>
      <div><strong>Adresse :</strong> {etab.address}</div>
      <div><strong>Téléphone :</strong> {etab.phone || "—"}</div>
      <div><strong>Site web :</strong> {etab.website ? <a href={etab.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{etab.website}</a> : "—"}</div>
      <div><strong>Note Google :</strong> {etab.rating ?? "—"}</div>
      <div><strong>Google Maps :</strong> {etab.url ? <a href={etab.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Voir la fiche</a> : "—"}</div>
      <div className="text-xs text-muted-foreground"><strong>place_id :</strong> {etab.place_id}</div>
    </div>
  );
}

export default function EtablissementPage() {
  const [selected, setSelected] = useState<Etab | null>(null); // ce que l'utilisateur vient de choisir
  const [saved, setSaved] = useState<Etab | null>(null);       // ce qui est enregistré/persisté
  const [isSaving, setIsSaving] = useState(false);

  // 1) Hydrate depuis localStorage au chargement
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);

  // Initialize Google Places API
  useEffect(() => {
    const initPlaces = () => {
      const input = document.getElementById('places-input') as HTMLInputElement;
      if (!input || !window.google?.maps?.places) return;
      
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['establishment'],
        fields: [
          'place_id','name','formatted_address','geometry.location',
          'url','website','formatted_phone_number','rating'
        ],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place || !place.place_id) return;
        setSelected(serializePlace(place)); // <= rend le badge vert + active le bouton
      });
    };

    // Load Google Maps API if not already loaded
    if (!window.google?.maps?.places) {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDvTGpCZ9kmCFdF9k8h9h3kh9kh9kh9kh9&libraries=places';
      script.async = true;
      script.defer = true;
      script.onload = initPlaces;
      document.head.appendChild(script);
    } else {
      initPlaces();
    }
  }, []);

  function serializePlace(place: any): Etab {
    return {
      place_id: place.place_id,
      name: place.name ?? "",
      address: place.formatted_address ?? "",
      lat: place.geometry?.location?.lat() ?? null,
      lng: place.geometry?.location?.lng() ?? null,
      url: place.url ?? "",
      website: place.website ?? "",
      phone: place.formatted_phone_number ?? "",
      rating: place.rating ?? null,
    };
  }

  // 3) Bouton Enregistrer → persist + affiche dans Mon Établissement
  async function handleSave() {
    if (!selected) return;
    setIsSaving(true);
    try {
      // A) Persistance locale
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
      setSaved(selected);

      // Clear selection after saving
      setSelected(null);
      const input = document.getElementById('places-input') as HTMLInputElement;
      if (input) input.value = '';

    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Gestion des Établissements</h1>
      
      <div className="space-y-6">
        {/* --- Barre d'autocomplétion --- */}
        <div className="space-y-2">
          <input
            id="places-input"
            className="w-full border border-border rounded-md px-3 py-2"
            placeholder="Rechercher un établissement…"
          />
          {selected && (
            <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
              <span>✅ Sélectionné :</span>
              <strong>{selected.name}</strong>
            </div>
          )}
          <button
            className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 py-3 disabled:opacity-50"
            onClick={handleSave}
            disabled={!selected || isSaving}
            title="Enregistrer l'établissement"
          >
            💾 Enregistrer l'établissement
          </button>
        </div>

        {/* --- Section Mon Établissement --- */}
        <section className="border border-border rounded-md p-4">
          <h2 className="text-xl font-semibold mb-3">🏢 Mon Établissement</h2>
          <MonEtablissement etab={saved} />
        </section>
      </div>
    </div>
  );
}

// TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: any;
  }
}