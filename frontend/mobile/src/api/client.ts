// ─── client HTTP base ─────────────────────────────────────────────────────────

export const BASE_URL = "http://10.10.50.130:5063";

/**
 * POST con corpo JSON.
 * In caso di errore legge il body per loggare il dettaglio reale del server.
 */
export async function apiPost<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Legge il body dell'errore per debug reale
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<TResponse>;
}
