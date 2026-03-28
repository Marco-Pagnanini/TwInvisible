import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Polygon,
  Stop,
  Text as SvgText,
  Line,
} from "react-native-svg";

import profiloData from "./profilo.json";
import { getProfile } from "../store";

// ─── helpers ──────────────────────────────────────────────────────────────────
const toNum = (v: string | number) => Math.min(100, Math.max(0, Number(v)));

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPolygonPoints(
  cx: number,
  cy: number,
  r: number,
  n: number,
  startAngle = 0
) {
  return Array.from({ length: n }, (_, i) => {
    const angle = startAngle + (360 / n) * i;
    const p = polarToXY(cx, cy, r, angle);
    return `${p.x},${p.y}`;
  }).join(" ");
}

// ─── config ───────────────────────────────────────────────────────────────────
const CHART_SIZE = 300;
const CX = CHART_SIZE / 2;
const CY = CHART_SIZE / 2;
const R = 96;
const RINGS = 5;
const N = 5; // assi = numero di metriche

const METRICS = [
  { key: "ci",     label: "C.I.",    fullLabel: "Consumo Impulsivo" },
  { key: "urg",    label: "Urgenza", fullLabel: "Urgenza" },
  { key: "hobby",  label: "Hobby",   fullLabel: "Hobby" },
  { key: "hype",   label: "Trend",   fullLabel: "Trend" },
  { key: "disp_e", label: "P.A.",    fullLabel: "Potere d'acquisto" },
] as const;

// ─── componente grafico ───────────────────────────────────────────────────────
function RadarChart({ raw }: { raw: Record<string, string> }) {
  const values = useMemo(
    () => METRICS.map((m) => toNum(raw[m.key]) / 100),
    [raw]
  );

  // poligono dati
  const dataPoints = useMemo(
    () =>
      METRICS.map((_, i) => {
        const angle = (360 / N) * i;
        const p = polarToXY(CX, CY, values[i] * R, angle);
        return `${p.x},${p.y}`;
      }).join(" "),
    [values]
  );

  // anelli di sfondo
  const gridRings = Array.from({ length: RINGS }, (_, i) => (i + 1) / RINGS);

  // assi
  const axes = METRICS.map((_, i) => {
    const angle = (360 / N) * i;
    const tip = polarToXY(CX, CY, R, angle);
    return { x1: CX, y1: CY, x2: tip.x, y2: tip.y };
  });

  // etichette
  const labelOffset = 28;
  const labels = METRICS.map((m, i) => {
    const angle = (360 / N) * i;
    const pos = polarToXY(CX, CY, R + labelOffset, angle);
    return { ...pos, text: m.label };
  });

  return (
    <View style={styles.chartWrap}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        <Defs>
          <LinearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#6366f1" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#a5b4fc" stopOpacity="0.3" />
          </LinearGradient>
          <LinearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#6366f1" stopOpacity="1" />
            <Stop offset="1" stopColor="#818cf8" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Anelli griglia */}
        {gridRings.map((ratio, i) => (
          <Polygon
            key={i}
            points={buildPolygonPoints(CX, CY, ratio * R, N)}
            fill="none"
            stroke="rgba(99,102,241,0.15)"
            strokeWidth={1}
          />
        ))}

        {/* Assi */}
        {axes.map((a, i) => (
          <Line
            key={i}
            x1={a.x1} y1={a.y1}
            x2={a.x2} y2={a.y2}
            stroke="rgba(99,102,241,0.2)"
            strokeWidth={1}
          />
        ))}

        {/* Area dati */}
        <Polygon
          points={dataPoints}
          fill="url(#radarFill)"
          stroke="url(#radarStroke)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Punti sui vertici */}
        {METRICS.map((_, i) => {
          const angle = (360 / N) * i;
          const p = polarToXY(CX, CY, values[i] * R, angle);
          return (
            <Circle
              key={i}
              cx={p.x} cy={p.y}
              r={4}
              fill="#6366f1"
              stroke="#fff"
              strokeWidth={2}
            />
          );
        })}

        {/* Etichette assi */}
        {labels.map((l, i) => (
          <SvgText
            key={i}
            x={l.x} y={l.y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={10}
            fontWeight="600"
            fill="rgba(26,26,46,0.6)"
            letterSpacing={0.5}
          >
            {l.text.toUpperCase()}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

// ─── scheda insight ────────────────────────────────────────────────────────────
function InsightCard({
  accent,
  title,
  highlight,
  highlightColor,
  body,
}: {
  accent: string;
  title: string;
  highlight: string;
  highlightColor: string;
  body: string;
}) {
  return (
    <View style={[styles.insightCard, { borderLeftColor: accent }]}>
      <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>
          {title}
          {"  "}
          <Text style={[styles.insightHighlight, { color: highlightColor }]}>
            {highlight}
          </Text>
        </Text>
        <Text style={styles.insightBody}>{body}</Text>
      </View>
    </View>
  );
}

// ─── riga metrica ─────────────────────────────────────────────────────────────
function MetricRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricBarTrack}>
        <View style={[styles.metricBarFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.metricValue}>{pct}%</Text>
    </View>
  );
}

// ─── pagina principale ────────────────────────────────────────────────────────
export default function Graph() {
  // Usa i dati dall'API (store) se disponibili, altrimenti usa profilo.json
  const stored = getProfile();
  const raw: Record<string, string> = stored
    ? { ci: stored.ci, urg: stored.urg, hobby: stored.hobby, hype: stored.hype, disp_e: stored.disp_e }
    : (profiloData.dati as Record<string, string>);
  const noList: string[] = stored ? stored.no : ((profiloData.dati as any).no ?? []);

  const values = METRICS.map((m) => toNum(raw[m.key]) / 100);
  const topMetric = METRICS[values.indexOf(Math.max(...values))];
  const bottomMetric = METRICS[values.indexOf(Math.min(...values))];

  return (
    <View style={styles.root}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />
      <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.headerInner}>
            <View style={styles.headerBrand}>
              <Image
                source={require("../../assets/images/logo/logo3.png")}
                style={styles.headerLogo3}
                resizeMode="contain"
              />
              <Image
                source={require("../../assets/images/logo/name.png")}
                style={styles.headerName}
                resizeMode="contain"
              />
            </View>
            <Pressable style={styles.settingsBtn} onPress={() => router.back()}>
              <Text style={styles.settingsIcon}>←</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Titolo */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Il tuo profilo</Text>
            <Text style={styles.pageSubtitle}>ANALISI PROFILO IN TEMPO REALE</Text>
          </View>

          {/* Grafico radar */}
          <View style={styles.chartCard}>
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <RadarChart raw={raw} />
          </View>

          {/* Barre metriche */}
          <View style={styles.metricsCard}>
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.metricsContent}>
              <Text style={styles.sectionTitle}>Dettaglio Metriche</Text>
              {METRICS.map((m, i) => (
                <MetricRow key={m.key} label={m.fullLabel} value={values[i]} />
              ))}
            </View>
          </View>

          {/* AI Insights */}
          <View style={styles.insightsSection}>
            <View style={styles.insightsTitleRow}>
              <Text style={styles.insightsSectionTitle}>AI Insights</Text>
            </View>

            <InsightCard
              accent="#6366f1"
              title="Punto di forza:"
              highlight={`${topMetric.fullLabel} (${Math.round(values[METRICS.indexOf(topMetric)] * 100)}%)`}
              highlightColor="#6366f1"
              body={`Il profilo mostra il picco su "${topMetric.fullLabel}". Questo indica un'alta coerenza nel parametro e buona stabilità nel contesto attuale.`}
            />

            <InsightCard
              accent="#f97316"
              title="Area di crescita:"
              highlight={`${bottomMetric.fullLabel} (${Math.round(values[METRICS.indexOf(bottomMetric)] * 100)}%)`}
              highlightColor="#f97316"
              body={`"${bottomMetric.fullLabel}" risulta il parametro con margine di miglioramento più elevato. Si consiglia di aumentare l'attività in quest'area.`}
            />

            {noList.length > 0 && (
              <View style={[styles.insightCard, { borderLeftColor: "#e11d48" }]}>
                <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>
                    Aree escluse:{" "}
                    <Text style={{ color: "#e11d48", fontWeight: "700" }}>
                      {noList.join(", ")}
                    </Text>
                  </Text>
                  <Text style={styles.insightBody}>
                    Questi ambiti non rientrano nel profilo attivo e sono stati
                    esclusi dall'analisi vettoriale.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Note info */}
          <View style={styles.noteCard}>
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.noteContent}>
              <View style={styles.noteRow}>
                <View style={[styles.noteIcon, { backgroundColor: "rgba(99,102,241,0.12)" }]}>
                  <Text style={{ fontSize: 12 }}>✓</Text>
                </View>
                <Text style={styles.noteText}>
                  Score calcolati su base normalizzata 0–100 da profilo.json
                </Text>
              </View>
              <View style={styles.noteRow}>
                <View style={[styles.noteIcon, { backgroundColor: "rgba(99,102,241,0.12)" }]}>
                  <Text style={{ fontSize: 12 }}>ℹ</Text>
                </View>
                <Text style={styles.noteText}>
                  I dati vengono aggiornati in tempo reale ad ogni modifica del profilo
                </Text>
              </View>
            </View>
          </View>

          {/* Bottoni azione */}
          <Pressable
            style={({ pressed }) => [styles.exportBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.exportBtnText}>📄  Esporta file JSON</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.btnPressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.shareBtnText}>Continua sull'app</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── stili ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f8fb" },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // blobs
  blob: { position: "absolute", borderRadius: 999 },
  blob1: { width: 360, height: 360, backgroundColor: "#bfdbfe", opacity: 0.55, top: -120, left: -100 },
  blob2: { width: 300, height: 300, backgroundColor: "#fbcfe8", opacity: 0.55, top: 280, right: -110 },
  blob3: { width: 240, height: 240, backgroundColor: "#d1d5db", opacity: 0.5, bottom: 140, left: 10 },

  // header
  header: {
    height: 64,
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  headerInner: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 },
  headerBrand: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo3: { width: 48, height: 48 },
  headerName:  { height: 28, width: 120 },
  settingsBtn: { padding: 8 },
  settingsIcon: { color: "#6366f1", fontSize: 20, fontWeight: "600" },

  // titolo pagina
  titleSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12, gap: 4 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#1a1a2e", letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 11, fontWeight: "600", color: "rgba(0,0,0,0.38)", letterSpacing: 1.2 },

  // grafico
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  chartWrap: { alignItems: "center", justifyContent: "center" },
  scoreRow: { marginTop: 4, alignItems: "center" },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  scorePillLabel: { fontSize: 10, fontWeight: "700", color: "rgba(0,0,0,0.45)", letterSpacing: 0.8 },
  scorePillValue: { fontSize: 16, fontWeight: "800", color: "#6366f1" },

  // barre metriche
  metricsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metricsContent: { padding: 18, gap: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 4 },
  metricRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metricLabel: { width: 90, fontSize: 13, color: "rgba(0,0,0,0.6)", fontWeight: "500" },
  metricBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(99,102,241,0.1)",
    overflow: "hidden",
  },
  metricBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#6366f1",
  },
  metricValue: { width: 36, fontSize: 13, fontWeight: "700", color: "#6366f1", textAlign: "right" },

  // insights
  insightsSection: { paddingHorizontal: 16, marginTop: 20, gap: 12 },
  insightsTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  insightsIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(99,102,241,0.12)", alignItems: "center", justifyContent: "center" },
  insightsIconText: { fontSize: 14 },
  insightsSectionTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },

  insightCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightContent: { padding: 16, gap: 6 },
  insightTitle: { fontSize: 14, color: "#1a1a2e", fontWeight: "600", lineHeight: 20 },
  insightHighlight: { fontWeight: "700" },
  insightBody: { fontSize: 13, color: "rgba(0,0,0,0.55)", lineHeight: 20 },

  // note
  noteCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
  },
  noteContent: { padding: 14, gap: 10 },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  noteIcon: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 1 },
  noteText: { flex: 1, fontSize: 12, color: "rgba(0,0,0,0.45)", lineHeight: 18 },

  // bottoni
  exportBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  exportBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

  shareBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(99,102,241,0.35)",
    backgroundColor: "rgba(99,102,241,0.06)",
  },
  shareBtnText: { color: "#6366f1", fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },

  btnPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
