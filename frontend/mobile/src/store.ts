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

// ─── promise API ──────────────────────────────────────────────────────────────
// chat.tsx avvia la chiamata e salva qui la promise.
// loading.tsx la aspetta prima di navigare a graph.

let _apiPromise: Promise<void> | null = null;

export function setApiPromise(p: Promise<void>): void {
  _apiPromise = p;
}

export function waitForApi(): Promise<void> {
  return _apiPromise ?? Promise.resolve();
}
