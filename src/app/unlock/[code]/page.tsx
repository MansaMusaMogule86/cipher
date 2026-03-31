"use client";

import React, { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface ContentData {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  file_url: string | null;
  preview_url: string | null;
}

interface FanCodeData {
  id: string;
  code: string;
  is_paid: boolean;
  payment_method: string | null;
}

/* ─────────────────────────────────────────
   UNLOCK PAGE
───────────────────────────────────────── */
export default function UnlockPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const [content, setContent] = useState<ContentData | null>(null);
  const [fanCode, setFanCode] = useState<FanCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // ── Fetch content + code status ───────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v2/unlock/${code}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Content not found");
          return;
        }
        setContent(json.data.content);
        setFanCode(json.data.fanCode);
        if (json.data.fanCode.is_paid || success) {
          setUnlocked(true);
        }
      } catch {
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code, success]);

  // ── Pay with Stripe ───────────────────────────────────────────────────
  const handleStripePay = async () => {
    setPaying(true);
    try {
      const res = await fetch("/api/v2/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fan_code: code }),
      });
      const json = await res.json();
      if (json.success && json.data.url) {
        window.location.href = json.data.url;
      } else {
        setError(json.error || "Failed to create payment session");
        setPaying(false);
      }
    } catch {
      setError("Payment failed — please try again");
      setPaying(false);
    }
  };

  // ── Styles (inline to match CIPHER design system) ─────────────────────
  const mono = { fontFamily: "var(--font-mono, 'DM Mono', monospace)" } as const;
  const disp = { fontFamily: "var(--font-display, 'Cormorant Garamond', serif)" } as const;
  const gold = { color: "#c8a96e" } as const;
  const muted = { color: "rgba(255,255,255,0.45)" } as const;
  const dim = { color: "rgba(255,255,255,0.22)" } as const;

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020203" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", ...gold, marginBottom: "16px" }}>
            Loading
          </div>
          <div style={{ width: "32px", height: "32px", border: "2px solid rgba(200,169,110,0.2)", borderTop: "2px solid #c8a96e", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error || !content || !fanCode) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020203", padding: "24px" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ ...disp, fontSize: "64px", fontWeight: 300, ...gold, marginBottom: "16px" }}>✦</div>
          <h1 style={{ ...disp, fontSize: "32px", fontWeight: 300, fontStyle: "italic", marginBottom: "12px" }}>
            {canceled ? "Payment cancelled" : "Content not found"}
          </h1>
          <p style={{ fontSize: "14px", fontWeight: 300, ...muted, lineHeight: 1.7 }}>
            {canceled
              ? "No worries — your code is still valid. Come back whenever you're ready."
              : error || "This unlock code doesn't exist or has expired."}
          </p>
          {canceled && (
            <button
              onClick={() => window.location.href = `/unlock/${code}`}
              style={{
                marginTop: "24px", ...mono, fontSize: "11px", letterSpacing: "0.15em",
                textTransform: "uppercase", ...gold, background: "transparent",
                border: "1px solid rgba(200,169,110,0.3)", padding: "12px 24px",
                borderRadius: "2px", cursor: "pointer", transition: "all 0.25s",
              }}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Format price ──────────────────────────────────────────────────────
  const priceDisplay = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: content.currency?.toUpperCase() || "USD",
  }).format(content.price / 100);

  // ═══════════════════════════════════════════════════════════════════════
  //   UNLOCKED STATE
  // ═══════════════════════════════════════════════════════════════════════
  if (unlocked) {
    return (
      <div style={{ minHeight: "100vh", background: "#020203", padding: "24px" }}>
        <div style={{ maxWidth: "680px", margin: "80px auto 0", position: "relative" }}>
          {/* Success header */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "rgba(76,200,140,0.1)", border: "1px solid rgba(76,200,140,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: "24px",
            }}>
              ✓
            </div>
            <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#4cc88c", marginBottom: "12px" }}>
              Content unlocked
            </div>
            <h1 style={{ ...disp, fontSize: "clamp(32px,5vw,48px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, marginBottom: "8px" }}>
              {content.title}
            </h1>
            <div style={{ ...mono, fontSize: "11px", letterSpacing: "0.15em", ...dim }}>
              {fanCode.code} · Paid via {fanCode.payment_method === "stripe" ? "card" : fanCode.payment_method || "card"}
            </div>
          </div>

          {/* Content */}
          <div style={{
            background: "#111120", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "4px", overflow: "hidden",
          }}>
            {content.description && (
              <div style={{ padding: "32px 32px 0", fontSize: "14px", fontWeight: 300, ...muted, lineHeight: 1.8 }}>
                {content.description}
              </div>
            )}
            <div style={{ padding: "32px" }}>
              {content.file_url && (
                <a
                  href={content.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "10px",
                    ...mono, fontSize: "12px", letterSpacing: "0.1em", ...gold,
                    textDecoration: "none", padding: "14px 24px",
                    background: "rgba(200,169,110,0.08)",
                    border: "1px solid rgba(200,169,110,0.2)",
                    borderRadius: "3px", transition: "all 0.25s",
                  }}
                >
                  ↓ Download content
                </a>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <span style={{ ...mono, fontSize: "15px", letterSpacing: "0.3em", ...gold, fontWeight: 500 }}>CIPHER</span>
            <div style={{ ...mono, fontSize: "10px", ...dim, marginTop: "8px", letterSpacing: "0.12em" }}>
              Anonymous content. Instant access.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //   LOCKED STATE — PAYMENT REQUIRED
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: "#020203", padding: "24px" }}>
      <div style={{ maxWidth: "520px", margin: "80px auto 0" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{ ...mono, fontSize: "15px", letterSpacing: "0.3em", ...gold, fontWeight: 500 }}>CIPHER</span>
        </div>

        {/* Content card */}
        <div style={{
          background: "#111120", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "4px", padding: "40px", position: "relative", overflow: "hidden",
        }}>
          {/* Gold accent line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #c8a96e, transparent)" }} />

          <div style={{ ...mono, fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", ...dim, marginBottom: "8px" }}>
            Exclusive content
          </div>

          <h1 style={{ ...disp, fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.15, marginBottom: "16px" }}>
            {content.title}
          </h1>

          {content.description && (
            <p style={{ fontSize: "14px", fontWeight: 300, ...muted, lineHeight: 1.8, marginBottom: "24px" }}>
              {content.description}
            </p>
          )}

          {/* Preview image */}
          {content.preview_url && (
            <div style={{
              width: "100%", height: "200px", borderRadius: "3px",
              background: `url(${content.preview_url}) center/cover`,
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: "24px", position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, transparent 50%, rgba(2,2,3,0.8) 100%)",
              }} />
            </div>
          )}

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "32px" }}>
            <span style={{ ...disp, fontSize: "42px", fontWeight: 300, ...gold }}>{priceDisplay}</span>
            <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.15em", ...dim, textTransform: "uppercase" }}>
              one-time
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "28px" }} />

          {/* Payment options label */}
          <div style={{ ...mono, fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", ...dim, marginBottom: "16px" }}>
            Payment method
          </div>

          {/* Stripe (active) */}
          <button
            onClick={handleStripePay}
            disabled={paying}
            id="pay-with-card-btn"
            style={{
              width: "100%", padding: "18px 24px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
              background: "#c8a96e", border: "none", borderRadius: "3px",
              color: "#0a0800", cursor: paying ? "wait" : "pointer",
              ...mono, fontSize: "12px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase",
              transition: "opacity 0.2s",
              opacity: paying ? 0.7 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            {paying ? "Redirecting..." : "Pay with Card"}
          </button>

          {/* Crypto (placeholder) */}
          <button
            disabled
            id="pay-with-crypto-btn"
            style={{
              width: "100%", padding: "18px 24px", marginTop: "12px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "3px",
              color: "rgba(255,255,255,0.22)",
              cursor: "not-allowed",
              ...mono, fontSize: "12px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v12m-3-9h6m-7 3h8" />
            </svg>
            Crypto — Coming Soon
          </button>

          {/* Trust signals */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginTop: "28px" }}>
            {[
              ["🔒", "Encrypted"],
              ["👤", "No account needed"],
              ["⚡", "Instant access"],
            ].map(([icon, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 300, ...dim }}>
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>
        </div>

        {/* Code display */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.15em", ...dim }}>
            Your code: {fanCode.code}
          </span>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <div style={{ ...mono, fontSize: "10px", ...dim, letterSpacing: "0.12em" }}>
            Powered by CIPHER · No login required
          </div>
        </div>
      </div>
    </div>
  );
}
