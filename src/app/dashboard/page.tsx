import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./components/DashboardShell";

export const metadata = { title: "Dashboard — MULUK" };

async function DashboardHome({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: stats } = await supabase.rpc("get_creator_dashboard_stats", { p_user_id: userId });
  return (
    <div style={{ padding: "32px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "#fff", marginBottom: 24 }}>
        Welcome back
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Total Fans", value: stats?.total_fans ?? 0 },
          { label: "Monthly Revenue", value: `$${((stats?.monthly_revenue_cents ?? 0) / 100).toFixed(2)}` },
          { label: "Active Content", value: stats?.active_content_count ?? 0 },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "20px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: "#c8a96e" }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileRow?.onboarding_completed !== true) redirect("/dashboard/onboarding");

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("handle")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      userId={user.id}
      handle={creatorProfile?.handle ?? undefined}
    >
      <DashboardHome userId={user.id} />
    </DashboardShell>
  );
}
