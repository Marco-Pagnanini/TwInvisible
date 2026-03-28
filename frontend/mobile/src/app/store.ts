// ─── store globale in-memory ──────────────────────────────────────────────────
// Usato per passare i dati tra chat → loading → graph senza AsyncStorage.

export interface ProfileData {
  ci: string;
  urg: string;
  hobby: string;
  hype: string;
  disp_e: string; // l'API restituisce "dispE", normalizziamo qui
  no: string[];
}

let _profile: ProfileData | null = null;

export function setProfile(data: ProfileData): void {
  _profile = data;
}

export function getProfile(): ProfileData | null {
  return _profile;
}
