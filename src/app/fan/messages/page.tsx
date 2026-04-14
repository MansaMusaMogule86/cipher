import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function FanMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/fan/messages");

  const { data: messages } = await supabase
    .from("messages")
    .select(`
      id,
      body,
      is_read,
      created_at,
      sender_id,
      profiles!messages_sender_id_fkey (handle, display_name, avatar_url)
    `)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = messages?.filter((m) => !m.is_read).length ?? 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-[#c8a96e] mt-1">{unreadCount} unread</p>
            )}
          </div>
          <Link href="/fan" className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← Back
          </Link>
        </div>

        {messages && messages.length > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {messages.map((m) => {
              const sender = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
              return (
                <div
                  key={m.id}
                  className={`py-4 flex gap-3 ${!m.is_read ? "opacity-100" : "opacity-60"}`}
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-800 overflow-hidden shrink-0">
                    {sender?.avatar_url && (
                      <img
                        src={sender.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {sender?.display_name ?? sender?.handle ?? "Creator"}
                      </p>
                      <p className="text-xs text-neutral-600 shrink-0">
                        {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-400 mt-0.5 truncate">{m.body}</p>
                  </div>
                  {!m.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[#c8a96e] self-center shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No messages yet.</p>
        )}

      </div>
    </main>
  );
}
