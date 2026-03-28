import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";

// ─── config ───────────────────────────────────────────────────────────────────
const ORBIT_RX  = 75;
const ORBIT_RY  = 24;
const LOGO_SIZE = 120;

// Durate di movimento proporzionali alla distanza angolare
// Distanze: 0→π/2 = 1/4 giro | π/2→7π/6 = 1/3 | 7π/6→11π/6 = 1/3 | 11π/6→2π = 1/12
const MOVE_TOTAL  = 3000;
const SEG1 = Math.round((1 / 4)  * MOVE_TOTAL); // 750 ms
const SEG2 = Math.round((1 / 3)  * MOVE_TOTAL); // 1000 ms
const SEG3 = Math.round((1 / 3)  * MOVE_TOTAL); // 1000 ms
const SEG4 = Math.round((1 / 12) * MOVE_TOTAL); // 250 ms

const FRONT_PAUSE   = 1000; // ms di sosta in primo piano
const BURST_UP      = 320;  // ms per ingrandirsi
const BURST_DOWN    = 480;  // ms per tornare piccolo
const BURST_SCALE   = 1.55; // scala massima del burst

// Durata totale di un ciclo completo
const CYCLE = SEG1 + FRONT_PAUSE + SEG2 + FRONT_PAUSE + SEG3 + FRONT_PAUSE + SEG4; // 6000 ms

// Delay burst per ciascun logo (momento in cui arriva in primo piano)
// LOGOS[0]=pink  offset=0     → fronte a π/2      → delay = SEG1
// LOGOS[1]=blue  offset=2π/3  → fronte a 11π/6    → delay = SEG1 + PAUSE + SEG2 + PAUSE + SEG3
// LOGOS[2]=black offset=4π/3  → fronte a 7π/6     → delay = SEG1 + PAUSE + SEG2
const BURST_DELAYS = [
  SEG1,
  SEG1 + FRONT_PAUSE + SEG2 + FRONT_PAUSE + SEG3,
  SEG1 + FRONT_PAUSE + SEG2,
];

const LOGOS = [
  require("../../assets/images/logo/pink.png"),
  require("../../assets/images/logo/blue.png"),
  require("../../assets/images/logo/black.png"),
] as const;

// ─── OrbitLogo ────────────────────────────────────────────────────────────────
function OrbitLogo({
  source,
  angle,
  offsetRad,
  burstScale,
}: {
  source: any;
  angle: Animated.SharedValue<number>;
  offsetRad: number;
  burstScale: Animated.SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    "worklet";
    const a      = angle.value + offsetRad;
    const x      = Math.cos(a) * ORBIT_RX;
    const y      = Math.sin(a) * ORBIT_RY;
    const sinVal = Math.sin(a);
    const t      = (sinVal + 1) / 2;          // 0 → 1
    const scOrbit = 0.75 + t * 0.30;           // 0.75 (dietro) → 1.05 (fronte) — solo profondità
    const op      = 0.30 + t * 0.70;           // 0.30 → 1.0
    const sc      = scOrbit * burstScale.value; // burst moltiplica sopra

    return {
      transform: [{ translateX: x }, { translateY: y }, { scale: sc }],
      opacity: op,
    };
  });

  return (
    <Animated.View style={[styles.logoSlot, style]}>
      <Image source={source} style={styles.logoImg} resizeMode="contain" />
    </Animated.View>
  );
}

// ─── pagina ───────────────────────────────────────────────────────────────────
export default function Loading() {
  const angle        = useSharedValue(0);
  const progress     = useSharedValue(0);
  const introOpacity = useSharedValue(0);
  const introScale   = useSharedValue(0.85);

  // Burst scale separato per ogni logo
  const burst0 = useSharedValue(1);
  const burst1 = useSharedValue(1);
  const burst2 = useSharedValue(1);
  const bursts  = [burst0, burst1, burst2];

  const navigateToGraph = () => router.replace("/graph");

  useEffect(() => {
    // Ingresso
    introOpacity.value = withTiming(1, { duration: 500 });
    introScale.value   = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.4)) });

    // Orbita con soste in primo piano
    const oneCycle = withSequence(
      withTiming(Math.PI / 2,       { duration: SEG1,        easing: Easing.inOut(Easing.quad) }),
      withTiming(Math.PI / 2,       { duration: FRONT_PAUSE }),        // sosta pink
      withTiming(7 * Math.PI / 6,   { duration: SEG2,        easing: Easing.inOut(Easing.quad) }),
      withTiming(7 * Math.PI / 6,   { duration: FRONT_PAUSE }),        // sosta black
      withTiming(11 * Math.PI / 6,  { duration: SEG3,        easing: Easing.inOut(Easing.quad) }),
      withTiming(11 * Math.PI / 6,  { duration: FRONT_PAUSE }),        // sosta blue
      withTiming(2 * Math.PI,       { duration: SEG4,        easing: Easing.inOut(Easing.quad) }),
    );
    angle.value = withRepeat(oneCycle, -1, false);

    // Burst scale — scatta esattamente quando il logo raggiunge il fronte
    const burstOne = withSequence(
      withTiming(BURST_SCALE, { duration: BURST_UP,   easing: Easing.out(Easing.quad) }),
      withTiming(1.0,         { duration: BURST_DOWN, easing: Easing.in(Easing.quad)  }),
      withTiming(1.0,         { duration: CYCLE - BURST_UP - BURST_DOWN }), // attesa prossimo giro
    );

    bursts.forEach((b, i) => {
      b.value = withDelay(BURST_DELAYS[i], withRepeat(burstOne, -1, false));
    });

    // Progress bar → naviga a graph
    progress.value = withTiming(
      1,
      { duration: 6000, easing: Easing.bezier(0.4, 0, 0.2, 1) },
      (finished) => { if (finished) runOnJS(navigateToGraph)(); }
    );
  }, []);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introOpacity.value,
    transform: [{ scale: introScale.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.root}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />
      <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.container}>

          {/* Ingresso */}
          <Animated.View style={[styles.introWrap, introStyle]}>
            <Image
              source={require("../../assets/images/logo/name.png")}
              style={styles.nameImg}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Preparando il tuo spazio...</Text>
          </Animated.View>

          {/* Carosello */}
          <View style={styles.orbitContainer}>
            {LOGOS.map((src, i) => (
              <OrbitLogo
                key={i}
                source={src}
                angle={angle}
                offsetRad={(2 * Math.PI / 3) * i}
                burstScale={bursts[i]}
              />
            ))}
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, barStyle]} />
          </View>

          <Text style={styles.hint}>Caricamento in corso</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── stili ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: "#f8f8fb" },
  safeArea: { flex: 1 },

  blob: { position: "absolute", borderRadius: 999 },
  blob1: { width: 360, height: 360, backgroundColor: "#bfdbfe", opacity: 0.55, top: -120,   left: -100 },
  blob2: { width: 300, height: 300, backgroundColor: "#fbcfe8", opacity: 0.55, top: 280,    right: -110 },
  blob3: { width: 240, height: 240, backgroundColor: "#d1d5db", opacity: 0.50, bottom: 140, left: 10 },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    paddingHorizontal: 40,
  },

  introWrap: { alignItems: "center", gap: 10 },
  nameImg:   { width: 220, height: 50 },
  tagline:   { fontSize: 14, color: "rgba(0,0,0,0.38)", letterSpacing: 0.2 },

  orbitContainer: {
    width:  (ORBIT_RX + LOGO_SIZE) * 2,
    height: (ORBIT_RY + LOGO_SIZE) * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  logoSlot: {
    position: "absolute",
    width:  LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: LOGO_SIZE, height: LOGO_SIZE },

  progressTrack: {
    width: "100%", height: 4, borderRadius: 2,
    backgroundColor: "rgba(99,102,241,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: 2,
    backgroundColor: "#6366f1",
  },

  hint: { fontSize: 13, color: "rgba(0,0,0,0.32)", letterSpacing: 0.3 },
});
