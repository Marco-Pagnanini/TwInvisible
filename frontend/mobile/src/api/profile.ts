// ─── chiamate relative al profilo utente ─────────────────────────────────────
import type { ApiProfileResponse } from "../types";
import { apiPost } from "./client";

const PROFILE_PATH = "/api/userprofile";

/**
 * Invia le prime 5 risposte dell'utente e riceve i valori del profilo.
 *
 * Strategia:
 *  1. Prova camelCase  { answer1, answer2, … }  (REST standard)
 *  2. Se il server risponde 400, prova PascalCase { Answer1, Answer2, … }
 *     (ASP.NET / .NET Aspire richiedono spesso PascalCase)
 *
 * @param answers  Array di risposte (index 0–4 → answer1–answer5)
 */
export async function fetchUserProfile(
  answers: string[]
): Promise<ApiProfileResponse> {
  const camel = {
    answer1: answers[0] ?? "",
    answer2: answers[1] ?? "",
    answer3: answers[2] ?? "",
    answer4: answers[3] ?? "",
    answer5: answers[4] ?? "",
  };

  const pascal = {
    Answer1: answers[0] ?? "",
    Answer2: answers[1] ?? "",
    Answer3: answers[2] ?? "",
    Answer4: answers[3] ?? "",
    Answer5: answers[4] ?? "",
  };

  // 1° tentativo: camelCase
  try {
    return await apiPost<typeof camel, ApiProfileResponse>(PROFILE_PATH, camel);
  } catch (err: any) {
    const msg: string = err?.message ?? "";
    console.warn(`[profile] camelCase fallito (${msg}), provo PascalCase…`);

    // Riprova solo se è un errore di formato/validazione (4xx), non di rete
    if (/4\d\d/.test(msg)) {
      return await apiPost<typeof pascal, ApiProfileResponse>(PROFILE_PATH, pascal);
    }
    throw err;
  }
}
