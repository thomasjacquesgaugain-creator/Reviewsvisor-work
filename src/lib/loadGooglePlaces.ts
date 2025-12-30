let loading: Promise<void> | null = null;

export function loadGooglePlaces(): Promise<void> {
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (loading) return loading;

  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.error('❌ Clé Google Maps manquante : ni VITE_GOOGLE_MAPS_BROWSER_KEY ni VITE_GOOGLE_MAPS_API_KEY définie');
    return Promise.reject(new Error('Clé Google Maps manquante. Vérifiez votre configuration (front).'));
  }

  console.log('🔑 Chargement Google Maps', { origin: window.location.origin, keyPrefix: key.substring(0, 10) + '...' });

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=fr&region=FR&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google Maps chargé avec succès');
      
      // Attendre que google.maps.places soit vraiment disponible
      const checkPlaces = () => {
        if ((window as any).google?.maps?.places) {
          console.log('✅ Google Places API disponible');
          resolve();
        } else {
          console.log('⏳ En attente de Google Places API...');
          setTimeout(checkPlaces, 50);
        }
      };
      checkPlaces();
    };
    script.onerror = (error) => {
      console.error('❌ Échec chargement Google Maps:', error);
      console.error('Origine:', window.location.origin);
      console.error('Vérifiez que votre domaine est autorisé dans Google Cloud Console');
      console.error('Domaines à ajouter: https://reviewsvisor.fr/*, https://www.reviewsvisor.fr/*, https://reviewsvisor.lovable.app/*, https://*.lovable.dev/*, https://*.lovable.app/*, https://lovable.dev/*');
      reject(new Error('Échec chargement Google Maps. Vérifiez les restrictions de votre clé API.'));
    };
    document.head.appendChild(script);
  });

  return loading;
}
