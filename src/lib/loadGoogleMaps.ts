// Updated to work with script-based Google Maps loading
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

  // Démarrer le chargement
  loadingPromise = new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if ((window as any).google && (window as any).google.maps) {
      isLoaded = true;
      resolve((window as any).google);
      return;
    }

    // Check if script is already loading
    if ((window as any).googleMapsLoaded) {
      isLoaded = true;
      resolve((window as any).google);
      return;
    }

    // Listen for the custom event
    const handleLoad = () => {
      if ((window as any).google && (window as any).google.maps) {
        isLoaded = true;
        console.debug('Google Maps loaded successfully via script');
        resolve((window as any).google);
      } else {
        reject(new Error('Google Maps failed to load'));
      }
      window.removeEventListener('googleMapsLoaded', handleLoad);
    };

    window.addEventListener('googleMapsLoaded', handleLoad);

    // Set timeout as fallback
    setTimeout(() => {
      if ((window as any).google && (window as any).google.maps) {
        isLoaded = true;
        resolve((window as any).google);
      } else {
        loadingPromise = null;
        reject(new Error('Google Maps loading timeout'));
      }
      window.removeEventListener('googleMapsLoaded', handleLoad);
    }, 10000);
  });

  return loadingPromise;
}