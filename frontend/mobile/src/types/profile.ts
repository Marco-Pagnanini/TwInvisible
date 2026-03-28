// ─── tipi relativi al profilo utente e all'API ────────────────────────────────

/** Dati normalizzati salvati nello store (chiavi in snake_case per coerenza con profilo.json) */
export interface ProfileData {
  ci: string;
  urg: string;
  hobby: string;
  hype: string;
  disp_e: string; // l'API restituisce "dispE", normalizziamo in ingresso
  no: string[];
}

/** Corpo della richiesta POST verso /api/userprofile */
export interface ApiProfileRequest {
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  answer5: string;
}

/** Risposta JSON dell'API */
export interface ApiProfileResponse {
  ci: string;
  urg: string;
  hobby: string;
  hype: string;
  dispE: string; // camelCase restituito dall'API
}
