// ─── utility export JSON ──────────────────────────────────────────────────────
import { Share, Platform } from "react-native";
import type { ProfileData } from "../types";

/**
 * Costruisce il payload JSON da esportare partendo dai dati del profilo.
 */
function buildExportPayload(profile: ProfileData): object {
  return {
    digital_twin: {
      consumo_impulsivo: Number(profile.ci),
      urgenza:           Number(profile.urg),
      hobby:             Number(profile.hobby),
      hype_trend:        Number(profile.hype),
      potere_acquisto:   Number(profile.disp_e),
    },
    categorie_escluse: profile.no,
    generato_il: new Date().toISOString(),
  };
}

/**
 * Apre il dialog di condivisione nativo con il JSON del profilo.
 * Usa Share API built-in di React Native — zero dipendenze extra.
 * iOS  → share sheet (AirDrop, Files, Mail…)
 * Android → share intent (Drive, WhatsApp, Download…)
 */
export async function exportProfileAsJson(profile: ProfileData): Promise<void> {
  const payload = buildExportPayload(profile);
  const json    = JSON.stringify(payload, null, 2);

  await Share.share(
    {
      message: json,
      // Su iOS "title" appare come nome del testo condiviso
      title: `repay_profilo_${Date.now()}.json`,
    },
    {
      // Solo iOS: esclude opzioni non utili per un JSON
      excludedActivityTypes:
        Platform.OS === "ios"
          ? ["com.apple.UIKit.activity.PostToFacebook",
             "com.apple.UIKit.activity.PostToTwitter",
             "com.apple.UIKit.activity.AssignToContact"]
          : undefined,
      dialogTitle: "Esporta il tuo Digital Twin", // Android
    }
  );
}
