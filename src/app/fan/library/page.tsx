import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FanLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/fan/library");

  // Unlocked content — joined via the unlocks table
  const { data: unlocks } = await supabase
    .from("unlocks")
    .select(`
      id,
      unlocked_at,
      content_items (
        id,
        title,
        description,
        type,
        thumbnail_url,
        creator_id,
        profiles!content_items_creator_id_fkey (handle, display_name)
      )
    `)
    .eq("fan_id", user.id)
    .order("unlocked_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your Library</h1>
            <p className="text-sm text-neutral-400 mt-1">
              {unlocks?.length ?? 0} item{(unlocks?.length ?? 0) !== 1 ? "s" : ""} unlocked
            </p>
          </div>
          <a href="/fan" className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← Back
          </a>
        </div>

        {unlocks && unlocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlocks.map((u) => {
              const item = Array.isArray(u.content_items) ? u.content_items[0] : u.content_items;
              const profile = item
                ? (Array.isArray(item.profiles) ? item.profiles[0] : item.profiles)
                : null;

              return (
                <div
                  key={u.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                >
                  {item?.thumbnail_url && (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4 space-y-1">
                    <p className="text-sm font-medium truncate">{item?.title ?? "Untitled"}</p>
                    {profile && (
                      <p className="text-xs text-neutral-500">
                        by {profile.display_name ?? profile.handle}
                      </p>
                    )}
                    <p className="text-xs text-neutral-600">
                      Unlocked {new Date(u.unlocked_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Your library is empty. Purchase content to unlock it here.
          </p>
        )}

      </div>
    </main>
  );
}
