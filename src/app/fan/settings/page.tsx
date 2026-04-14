import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/role-guards";

export default async function FanSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/fan/settings");

  const role = getRoleFromUser(user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_url, bio, country, timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <a href="/fan" className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← Back
          </a>
        </div>

        {/* Account info */}
        <section className="space-y-4">
          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
            Account
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-neutral-400">Email</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-neutral-400">Role</span>
              <span className="text-xs bg-white/10 rounded-full px-3 py-1 capitalize">{role}</span>
            </div>
            {profile?.handle && (
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-neutral-400">Handle</span>
                <span className="text-sm text-neutral-300">@{profile.handle}</span>
              </div>
            )}
          </div>
        </section>

        {/* Profile info */}
        {profile && (
          <section className="space-y-4">
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
              Profile
            </h2>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
              {profile.display_name && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-neutral-400">Display Name</span>
                  <span className="text-sm">{profile.display_name}</span>
                </div>
              )}
              {profile.country && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-neutral-400">Country</span>
                  <span className="text-sm">{profile.country}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Role upgrade prompt (only for fans) */}
        {role === "fan" && (
          <section className="rounded-xl border border-[#c8a96e]/20 bg-[#c8a96e]/5 p-5 space-y-2">
            <p className="text-sm font-medium text-[#c8a96e]">Become a Creator</p>
            <p className="text-xs text-neutral-400">
              Apply for a creator account to start monetizing your audience with 88% payouts.
            </p>
            <a
              href="/apply"
              className="inline-block mt-2 text-xs bg-[#c8a96e] text-black font-medium px-4 py-2 rounded-full hover:bg-[#d4b97e] transition-colors"
            >
              Apply now
            </a>
          </section>
        )}

      </div>
    </main>
  );
}
