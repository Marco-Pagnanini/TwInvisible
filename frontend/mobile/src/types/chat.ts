// ─── tipi relativi alla chat ──────────────────────────────────────────────────

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}
