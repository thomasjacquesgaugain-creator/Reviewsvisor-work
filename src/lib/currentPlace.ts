export type CurrentPlace = { place_id: string; name?: string; address?: string };

const KEY = 'current_place';

export function setCurrentPlace(p: CurrentPlace) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function getCurrentPlace(): CurrentPlace | null {
  if (typeof window === 'undefined') return null;
  try { 
    return JSON.parse(localStorage.getItem(KEY) || 'null'); 
  } catch { 
    return null; 
  }
}