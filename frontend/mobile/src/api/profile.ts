// ─── chiamate relative al profilo utente ─────────────────────────────────────
import type { ApiProfileResponse } from "../types";
import { apiPost } from "./client";

const PROFILE_PATH = "/api/userprofile";

/**
 * Invia le prime 5 risposte dell'utente all'endpoint .NET e riceve il profilo.
 *
 * Il backend (UserProfileController) si aspetta:
 *   POST /api/userprofile
 *   Content-Type: application/json
 *   Body: { "Answer1": "...", "Answer2": "...", ... "Answer5": "..." }
 *   (binding case-insensitive, quindi answer1 o Answer1 vanno entrambi)
 *
 * Risposta OK:   { ci, urg, hobby, hype, dispE, success: true }
 * Risposta KO:   HTTP 400 + { success: false, error: "<messaggio Gemini>" }
 *
 * @param answers  Array di risposte (index 0–4 → Answer1–Answer5)
 */
export async function fetchUserProfile(
  answers: string[]
): Promise<ApiProfileResponse> {
  const body = {
    Answer1: answers[0] ?? "",
    Answer2: answers[1] ?? "",
    Answer3: answers[2] ?? "",
    Answer4: answers[3] ?? "",
    Answer5: answers[4] ?? "",
  };

  return apiPost<typeof body, ApiProfileResponse>(PROFILE_PATH, body);
}
