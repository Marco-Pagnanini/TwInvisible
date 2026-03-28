// ─── client HTTP base ─────────────────────────────────────────────────────────

export const BASE_URL = "http://10.10.50.130:5063";

/**
 * POST con corpo JSON.
 *
 * - Se il server risponde con 400 e il body è { success: false, error: "..." }
 *   (pattern del backend .NET) rilancia con il messaggio reale di Gemini.
 * - Per qualsiasi altro errore HTTP rilancia con status + body grezzo.
 */
export async function apiPost<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept":        "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    // Tenta di leggere il payload strutturato { success, error }
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) {
        throw new Error(`[${res.status}] ${parsed.error}`);
      }
    } catch (_) {
      // non era JSON strutturato, rilancia grezzo
    }

    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<TResponse>;
}
