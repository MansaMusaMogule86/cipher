"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const disp: React.CSSProperties = { fontFamily: "var(--font-display)" };
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// ─── CIPHER Score ──────────────────────────────────────────────────────────────
export type CipherScoreData = {
  totalEarnings: number;
  fanCount: number;
  contentCount: number;
  withdrawalCount: number;
  retentionRate: number;
};

function calcScore(data: CipherScoreData): { total: number; categories: Array<{ name: string; score: number; max: number }> } {
  const earnings = Math.min(Math.floor((data.totalEarnings / 10000) * 200), 200);
  const fans = Math.min(Math.floor((data.fanCount / 100) * 200), 200);
  const content = Math.min(Math.floor((data.contentCount / 20) * 150), 150);
  const payouts = Math.min(Math.floor((data.withdrawalCount / 5) * 150), 150);
  const retention = Math.min(Math.floor((data.retentionRate / 100) * 300), 300);
  return {
    total: earnings + fans + content + payouts + retention,
    categories: [
      { name: "EARNINGS", score: earnings, max: 200 },
      { name: "FAN BASE", score: fans, max: 200 },
      { name: "CONTENT", score: content, max: 150 },
      { name: "PAYOUTS", score: payouts, max: 150 },
      { name: "RETENTION", score: retention, max: 300 },
    ],
  };
}

export function CipherScore({ data }: { data: CipherScoreData }) {
  const [displayScore, setDisplayScore] = useState(0);
  const { total, categories } = calcScore(data);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const raf = requestAnimationFrame(function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(total * eased));
      if (p < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 1000) * circumference;
  const tier = total >= 800 ? "OBSIDIAN" : total >= 600 ? "GOLD" : total >= 400 ? "SILVER" : total >= 200 ? "BRONZE" : "CIPHER";
  const tierColor = total >= 800 ? "#e8ccff" : total >= 600 ? "#c8a96e" : total >= 400 ? "#a7adb8" : total >= 200 ? "#cd7f32" : "#555";

  return (
    <div style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.055)", borderRadius: "8px", padding: "18px" }}>
      <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", color: "var(--gold-dim)", marginBottom: "14px" }}>CIPHER SCORE</div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "20px", alignItems: "center" }}>
        <div style={{ position: "relative", width: "130px", height: "130px" }}>
          <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
              cx="65" cy="65" r={radius} fill="none"
              stroke={tierColor}
              strokeWidth="10"
              strokeDasharray={`${progress} ${circumference - progress}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.05s linear", filter: `drop-shadow(0 0 8px ${tierColor}55)` }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ ...disp, fontSize: "36px", color: tierColor, lineHeight: 1 }}>{displayScore}</div>
            <div style={{ ...mono, fontSize: "9px", color: tierColor, letterSpacing: "0.15em", marginTop: "2px" }}>{tier}</div>
          </div>
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {categories.map(cat => (
            <div key={cat.name}>
              <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: "9px", color: "var(--dim)", marginBottom: "3px" }}>
                <span>{cat.name}</span>
                <span style={{ color: "var(--gold)" }}>{cat.score}/{cat.max}</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(cat.score / cat.max) * 100}%`, background: "linear-gradient(90deg, rgba(200,169,110,0.6), #c8a96e)", borderRadius: "2px", transition: "width 0.8s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Phantom Mode ──────────────────────────────────────────────────────────────
export function PhantomModeToggle({ userId, initialPhantom }: { userId: string; initialPhantom: boolean }) {
  const [phantom, setPhantom] = useState(initialPhantom);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const toggle = async () => {
    setLoading(true);
    setMsg("");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("creator_applications")
        .update({ phantom_mode: !phantom })
        .eq("user_id", userId);

      if (error) throw error;
      setPhantom(!phantom);
      setMsg(phantom ? "Phantom mode disabled." : "Phantom mode enabled.");
    } catch (err) {
      console.error("Phantom toggle failed:", err);
      setMsg("Could not update phantom mode.");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <div style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.055)", borderRadius: "8px", padding: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", color: "var(--gold-dim)" }}>PHANTOM MODE</div>
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            width: "44px",
            height: "24px",
            borderRadius: "12px",
            border: "none",
            background: phantom ? "var(--gold)" : "rgba(255,255,255,0.15)",
            position: "relative",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          <div style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: "3px",
            left: phantom ? "23px" : "3px",
            transition: "left 0.2s",
          }} />
        </button>
      </div>
      <div style={{ fontSize: "12px", color: "var(--dim)", lineHeight: 1.6 }}>
        {phantom
          ? "Your identity is hidden. Fans see only your cipher code."
          : "Your profile is visible. Toggle on for anonymous mode."}
      </div>
      {msg && <div style={{ fontSize: "11px", color: "var(--gold)", marginTop: "8px" }}>{msg}</div>}
    </div>
  );
}

// ─── Dark Vault ────────────────────────────────────────────────────────────────
export function DarkVault({ userId, hasPin, onSetup }: { userId: string; hasPin: boolean; onSetup: () => void }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const setup = async () => {
    if (pin.length < 4) {
      setMsg("PIN must be at least 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setMsg("PINs do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/vault/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) throw new Error("Setup failed");
      setMsg("Vault PIN set successfully");
      onSetup();
      setTimeout(() => setOpen(false), 1500);
    } catch (err) {
      setMsg("Could not set PIN");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <div style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.055)", borderRadius: "8px", padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", color: "var(--gold-dim)", marginBottom: "6px" }}>DARK VAULT</div>
            <div style={{ fontSize: "12px", color: "var(--dim)" }}>
              {hasPin ? "PIN protected. Content encrypted at rest." : "Add a PIN to encrypt sensitive content."}
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            style={{ padding: "10px 18px", borderRadius: "6px", border: `1px solid ${hasPin ? "rgba(200,169,110,0.3)" : "var(--gold)"}`, background: hasPin ? "transparent" : "var(--gold)", color: hasPin ? "var(--gold)" : "#120c00", ...mono, fontSize: "10px", letterSpacing: "0.1em", cursor: "pointer" }}
          >
            {hasPin ? "CHANGE" : "SETUP"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#111120", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "18px" }}>
      <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", color: "var(--gold-dim)", marginBottom: "14px" }}>SETUP VAULT PIN</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="Enter 4-6 digit PIN"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
          style={{ padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "16px", textAlign: "center", letterSpacing: "0.3em" }}
        />
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="Confirm PIN"
          value={confirmPin}
          onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))}
          style={{ padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "16px", textAlign: "center", letterSpacing: "0.3em" }}
        />
        {msg && <div style={{ fontSize: "12px", color: msg.includes("success") ? "#4cc88c" : "#ff6a6a", textAlign: "center" }}>{msg}</div>}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "var(--dim)", ...mono, fontSize: "11px", cursor: "pointer" }}>CANCEL</button>
          <button onClick={setup} disabled={loading} style={{ flex: 2, padding: "12px", borderRadius: "6px", border: "none", background: "var(--gold)", color: "#120c00", ...mono, fontSize: "11px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>{loading ? "SETTING..." : "SET PIN"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Cipher Radio ──────────────────────────────────────────────────────────────
export function CipherRadio() {
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tracks = [
    { title: "Midnight Protocol", artist: "CIPHER FM", duration: "3:42" },
    { title: "Neon Drift", artist: "CIPHER FM", duration: "4:15" },
    { title: "Shadow Markets", artist: "CIPHER FM", duration: "3:28" },
  ];

  const toggle = () => {
    setPlaying(!playing);
    // In real implementation, this would control an audio element
  };

  return (
    <div style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.055)", borderRadius: "8px", padding: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", color: "var(--gold-dim)" }}>CIPHER RADIO</div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: playing ? "#4cc88c" : "var(--dim)", animation: playing ? "pulse 1s infinite" : "none" }} />
          <span style={{ ...mono, fontSize: "9px", color: playing ? "#4cc88c" : "var(--dim)" }}>{playing ? "LIVE" : "OFFLINE"}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
        <button
          onClick={toggle}
          style={{ width: "48px", height: "48px", borderRadius: "50%", border: "1px solid var(--gold)", background: playing ? "var(--gold)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#120c00"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--gold)"><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </button>
        <div>
          <div style={{ ...disp, fontSize: "16px", color: "rgba(255,255,255,0.9)", marginBottom: "2px" }}>{tracks[currentTrack].title}</div>
          <div style={{ ...mono, fontSize: "10px", color: "var(--dim)" }}>{tracks[currentTrack].artist} · {tracks[currentTrack].duration}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {tracks.map((track, i) => (
          <button
            key={i}
            onClick={() => setCurrentTrack(i)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: "4px",
              border: "none",
              background: currentTrack === i ? "rgba(200,169,110,0.1)" : "transparent",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "12px", color: currentTrack === i ? "var(--gold)" : "var(--dim)" }}>{track.title}</span>
            {currentTrack === i && playing && (
              <span style={{ display: "flex", gap: "2px" }}>
                {[0,1,2].map(j => <span key={j} style={{ width: "3px", height: "12px", background: "var(--gold)", animation: `eq 0.5s ease-in-out ${j * 0.1}s infinite alternate` }} />)}
              </span>
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes eq { from { height: 4px; } to { height: 14px; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

// ─── Legacy Mode ───────────────────────────────────────────────────────────────
export function LegacyMode() {
  const [enabled, setEnabled] = useState(false);
  const [beneficiary, setBeneficiary] = useState("");
  const [percentage, setPercentage] = useState(50);

  return (
    <div style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.055)", borderRadius: "8px", padding: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", color: "var(--gold-dim)" }}>LEGACY MODE</div>
        <button
          onClick={() => setEnabled(!enabled)}
          style={{
            width: "44px",
            height: "24px",
            borderRadius: "12px",
            border: "none",
            background: enabled ? "var(--gold)" : "rgba(255,255,255,0.15)",
            position: "relative",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          <div style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: "3px",
            left: enabled ? "23px" : "3px",
            transition: "left 0.2s",
          }} />
        </button>
      </div>

      <div style={{ fontSize: "12px", color: "var(--dim)", lineHeight: 1.6, marginBottom: enabled ? "16px" : 0 }}>
        Automatically transfer earnings to a beneficiary if inactive for 12 months.
      </div>

      {enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <label style={{ ...mono, fontSize: "9px", color: "var(--dim)", display: "block", marginBottom: "4px" }}>BENEFICIARY WALLET</label>
            <input
              type="text"
              value={beneficiary}
              onChange={e => setBeneficiary(e.target.value)}
              placeholder="0x... or @handle"
              style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#fff", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ ...mono, fontSize: "9px", color: "var(--dim)", display: "block", marginBottom: "4px" }}>TRANSFER PERCENTAGE: {percentage}%</label>
            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={percentage}
              onChange={e => setPercentage(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
          <button style={{ padding: "10px", background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "4px", color: "var(--gold)", ...mono, fontSize: "10px", cursor: "pointer" }}>
            SAVE LEGACY CONFIGURATION
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Fan Prediction Engine ────────────────────────────────────────────────────
export function FanPredictionEngine() {
  const [predictions, setPredictions] = useState<Array<{ title: string; value: string; direction: string; confidence: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const run = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/tools/predict", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setPredictions(data.predictions || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate predictions");
    } finally {
      setLoading(false);
    }
  };

  const dirColor = (d: string) => d === "up" ? "var(--gold)" : d === "down" ? "#ff6a6a" : "var(--dim)";
  const dirIcon = (d: string) => d === "up" ? "▲" : d === "down" ? "▼" : "—";

  return (
    <div style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.055)", borderRadius: "8px", padding: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", color: "var(--gold-dim)" }}>FAN PREDICTION ENGINE</div>
        <button
          onClick={run}
          disabled={loading}
          style={{ padding: "7px 12px", borderRadius: "6px", border: "none", background: "var(--gold)", color: "#120c00", ...mono, fontSize: "10px", letterSpacing: "0.1em", cursor: "pointer" }}
        >
          {loading ? "PREDICTING..." : "RUN PREDICTION"}
        </button>
      </div>

      {predictions.length === 0 && !loading && (
        <div style={{ fontSize: "13px", color: "var(--dim)", textAlign: "center", padding: "20px" }}>
          Hit &quot;RUN PREDICTION&quot; to analyze your trajectory.
        </div>
      )}

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ height: "80px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", animation: "pulseGold 1.2s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {predictions.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
          {predictions.map((pred, i) => (
            <div key={i} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ ...mono, fontSize: "9px", color: "var(--dim)", marginBottom: "6px" }}>{pred.title}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <div style={{ ...disp, fontSize: "22px", color: dirColor(pred.direction) }}>{pred.value}</div>
                <div style={{ fontSize: "12px", color: dirColor(pred.direction) }}>{dirIcon(pred.direction)}</div>
              </div>
              <div style={{ marginTop: "8px", height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pred.confidence}%`, background: dirColor(pred.direction) }} />
              </div>
              <div style={{ ...mono, fontSize: "9px", color: "var(--dim)", marginTop: "3px" }}>{pred.confidence}% confidence</div>
            </div>
          ))}
        </div>
      )}

      {err && <div style={{ fontSize: "12px", color: "#ff6a6a", marginTop: "8px" }}>{err}</div>}
    </div>
  );
}

// Re-export FanCodeGenerator from separate file
export { FanCodeGenerator } from "./FanCodeGenerator";
export type { FanCodeGeneratorProps } from "./FanCodeGenerator";
