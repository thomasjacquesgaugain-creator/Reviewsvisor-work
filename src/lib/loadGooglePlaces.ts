let loading: Promise<void> | null = null;

export function loadGooglePlaces(): Promise<void> {
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (loading) return loading;

  // Support both new and legacy env var names
  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_BROWSER_KEY manquante'));
  }

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=fr&region=FR`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Échec chargement Google Maps JS'));
    document.head.appendChild(script);
  });

  return loading;
}
