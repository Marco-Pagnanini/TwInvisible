// ─── tipi relativi alla schermata loading ─────────────────────────────────────
import type { SharedValue } from "react-native-reanimated";

/** Props del componente OrbitLogo */
export interface OrbitLogoProps {
  source: number; 
  angle: SharedValue<number>;
  offsetRad: number;
  burstScale: SharedValue<number>;
}
