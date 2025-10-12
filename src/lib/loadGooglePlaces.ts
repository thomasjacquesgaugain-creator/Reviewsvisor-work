let loading: Promise<void> | null = null;

export function loadGooglePlaces(): Promise<void> {
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (loading) return loading;

  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
  if (!key) {
    return Promise.reject(new Error('Clé Google manquante : renseignez VITE_GOOGLE_MAPS_BROWSER_KEY.'));
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
