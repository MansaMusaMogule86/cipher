// ─── Admin shared types, theme tokens, and utilities ─────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  finances: {
    totalGMV: number;
    revenue30d: number;
    totalTransactions: number;
  };
  users: {
    totalCreators: number;
    activeCreators: number;
    totalFans: number;
    onlineFans?: number;
    pendingApplications: number;
  };
}

export interface RealtimeEvent {
  id?: string;
  event_type: string;
  message?: string;
  severity?: 'critical' | 'warning' | 'info';
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ── Theme tokens ─────────────────────────────────────────────────────────────

export const t = {
  // Backgrounds
  void:    '#08080f',
  deep:    '#0d0d1a',
  faint:   'rgba(255,255,255,0.03)',

  // Borders
  rim:     'rgba(255,255,255,0.07)',

  // Text
  white:   'rgba(255,255,255,0.92)',
  muted:   'rgba(255,255,255,0.48)',
  dim:     'rgba(255,255,255,0.28)',

  // Gold
  gold:    '#c8a96e',
  goldDim: 'rgba(200,169,110,0.5)',
  goldGlow:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,169,110,0.06) 0%, transparent 70%)',

  // Status
  green:   '#4ade80',
  red:     '#f87171',
  redD:    'rgba(248,113,113,0.08)',

  // Fonts
  mono:    "var(--font-mono, 'DM Mono', monospace)",
  sans:    "var(--font-body, 'Outfit', sans-serif)",
  serif:   "var(--font-display, serif)",
} as const;

// ── Utilities ─────────────────────────────────────────────────────────────────

export async function fetchJsonOrThrow<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

/** Format a number as USD currency. */
export function $f(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
