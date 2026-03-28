// ─── utility export JSON ──────────────────────────────────────────────────────
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { ProfileData } from "../types";

/**
 * Costruisce il payload JSON da esportare partendo dai dati del profilo.
 */
function buildExportPayload(profile: ProfileData): object {
  return {
    digital_twin: {
      consumo_impulsivo:  Number(profile.ci),
      urgenza:            Number(profile.urg),
      hobby:              Number(profile.hobby),
      hype_trend:         Number(profile.hype),
      potere_acquisto:    Number(profile.disp_e),
    },
    categorie_escluse: profile.no,
    generato_il: new Date().toISOString(),
  };
}

/**
 * Salva il profilo come file JSON nella cache dell'app e apre
 * il dialog di condivisione nativo (AirDrop, Files, email…).
 */
export async function exportProfileAsJson(profile: ProfileData): Promise<void> {
  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (!isSharingAvailable) {
    throw new Error("La condivisione file non è disponibile su questo dispositivo.");
  }

  const payload  = buildExportPayload(profile);
  const json     = JSON.stringify(payload, null, 2);
  const fileName = `repay_profilo_${Date.now()}.json`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(filePath, {
    mimeType: "application/json",
    dialogTitle: "Esporta il tuo Digital Twin",
    UTI: "public.json",
  });
}
