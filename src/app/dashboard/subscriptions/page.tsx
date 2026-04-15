import DashboardShell from "@/app/dashboard/components/DashboardShell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Subscriptions — MULUK" };

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("handle")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <DashboardShell userEmail={user.email ?? ""} userId={user.id} handle={creatorProfile?.handle ?? undefined}>
      <ComingSoon label="SUBSCRIPTIONS" sub="Create recurring membership tiers. Fans pay monthly to unlock ongoing access." />
    </DashboardShell>
  );
}

function ComingSoon({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ padding: "40px 36px", minHeight: "100vh", background: "#08080f", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)", fontSize: "11px", letterSpacing: "0.22em", color: "rgba(200,169,110,0.45)", marginBottom: "14px" }}>
        COMING SOON
      </div>
      <h1 style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)", fontSize: "22px", fontWeight: 500, color: "var(--gold, #c8a96e)", letterSpacing: "0.16em", margin: 0 }}>
        {label}
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.28)", marginTop: "12px", maxWidth: "360px", textAlign: "center", fontFamily: "var(--font-body, 'Outfit', sans-serif)", lineHeight: 1.6 }}>
        {sub}
      </p>
    </div>
  );
}
