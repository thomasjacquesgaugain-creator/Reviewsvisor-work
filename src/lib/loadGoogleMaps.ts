import { Loader } from '@googlemaps/js-api-loader';

let loadingPromise: Promise<any> | null = null;
let isLoaded = false;

export async function loadGoogleMaps(): Promise<any> {
  // Si déjà chargé, retourner immédiatement
  if (isLoaded && (window as any).google) {
    return (window as any).google;
  }

  // Si déjà en cours de chargement, retourner la même Promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // Vérifier que la clé API est présente
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GOOGLE_MAPS_API_KEY is required');
  }

  // Démarrer le chargement
  loadingPromise = (async () => {
    try {
      const loader = new Loader({
        apiKey,
        libraries: ['places'],
        language: 'fr',
        region: 'FR'
      });

      const g = await loader.load();
      
      // S'assurer que window.google est bien défini
      if (!(window as any).google) {
        (window as any).google = g;
      }

      isLoaded = true;
      console.debug('Google Maps loaded successfully', typeof (window as any).google !== 'undefined');
      
      return g;
    } catch (error) {
      // Reset en cas d'erreur pour permettre une nouvelle tentative
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}