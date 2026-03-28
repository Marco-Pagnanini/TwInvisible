// ─── tipi relativi alla schermata graph ───────────────────────────────────────

/** Singola metrica del grafico radar */
export interface Metric {
  key: string;
  label: string;      // abbreviazione sull'asse
  fullLabel: string;  // nome esteso nelle card
}

/** Props del componente RadarChart */
export interface RadarChartProps {
  raw: Record<string, string>;
}

/** Props del componente InsightCard */
export interface InsightCardProps {
  accent: string;
  title: string;
  highlight: string;
  highlightColor: string;
  body: string;
}

/** Props del componente MetricRow */
export interface MetricRowProps {
  label: string;
  value: number; // valore normalizzato 0–1
}
