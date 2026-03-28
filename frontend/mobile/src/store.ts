// ─── store globale in-memory ──────────────────────────────────────────────────
// Usato per passare i dati tra chat → loading → graph senza AsyncStorage.

import type { ProfileData } from "./types";
export type { ProfileData };

let _profile: ProfileData | null = null;

export function setProfile(data: ProfileData): void {
  _profile = data;
}

export function getProfile(): ProfileData | null {
  return _profile;
}
