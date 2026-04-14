import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Fan dashboard home.
 * Shows: recent activity, followed creators, unread messages, recent purchases.
 */
export default async function FanHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/fan");

  // Followed creators (memberships)
  const { data: memberships } = await supabase
    .from("memberships")
    .select(`
      tier,
      total_spent,
      purchase_count,
      last_active_at,
      creator_id,
      profiles!memberships_creator_id_fkey (handle, display_name, avatar_url)
    `)
    .eq("fan_id", user.id)
    .eq("is_active", true)
    .order("last_active_at", { ascending: false })
    .limit(6);

  // Unread messages count
  const { count: unreadCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  // Recent purchases
  const { data: recentPurchases } = await supabase
    .from("purchases")
    .select("id, amount, currency, created_at, status")
    .eq("fan_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(3);

  // Unread notifications
  const { count: notifCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your Dashboard</h1>
            <p className="text-sm text-neutral-400 mt-1">
              {memberships?.length ?? 0} creator{(memberships?.length ?? 0) !== 1 ? "s" : ""} followed
            </p>
          </div>
          <div className="flex gap-3">
            {(notifCount ?? 0) > 0 && (
              <span className="text-xs bg-[#c8a96e]/20 text-[#c8a96e] border border-[#c8a96e]/30 rounded-full px-3 py-1">
                {notifCount} notification{notifCount !== 1 ? "s" : ""}
              </span>
            )}
            {(unreadCount ?? 0) > 0 && (
              <span className="text-xs bg-white/10 text-white border border-white/10 rounded-full px-3 py-1">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        {/* Followed creators */}
        <section>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">
            Following
          </h2>
          {memberships && memberships.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {memberships.map((m) => {
                const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                return (
                  <Link key={m.creator_id} href={`/${profile?.handle ?? m.creator_id}`}
                    className="group flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0">
                      {profile?.avatar_url && (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name ?? ""}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {profile?.display_name ?? profile?.handle ?? "Creator"}
                      </p>
                      <p className="text-xs text-neutral-500 capitalize">{m.tier}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              You haven&apos;t followed any creators yet.{" "}
              <Link href="/apply" className="text-[#c8a96e] hover:underline">
                Explore creators
              </Link>
            </p>
          )}
        </section>

        {/* Recent purchases */}
        {recentPurchases && recentPurchases.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">
                Recent Purchases
              </h2>
              <Link href="/fan/purchases" className="text-xs text-[#c8a96e] hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {recentPurchases.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <p className="text-sm text-neutral-300">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium text-[#c8a96e]">
                    {p.currency} {Number(p.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick links */}
        <section>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">
            Quick Access
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/fan/purchases", label: "Purchases" },
              { href: "/fan/library", label: "Library" },
              { href: "/fan/messages", label: "Messages" },
              { href: "/fan/settings", label: "Settings" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-sm text-center transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
