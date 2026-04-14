import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FanPurchasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/fan/purchases");

  const { data: purchases } = await supabase
    .from("purchases")
    .select("id, amount, currency, status, created_at, completed_at, processor")
    .eq("fan_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const total = purchases
    ?.filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Purchases</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Lifetime spend: <span className="text-[#c8a96e]">${total.toFixed(2)}</span>
            </p>
          </div>
          <a href="/fan" className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← Back
          </a>
        </div>

        {purchases && purchases.length > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {purchases.map((p) => (
              <div key={p.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 capitalize">
                    {p.processor ?? "unknown"} · {p.status}
                  </p>
                </div>
                <p
                  className={
                    p.status === "completed"
                      ? "text-sm font-medium text-[#c8a96e]"
                      : "text-sm font-medium text-neutral-500"
                  }
                >
                  {p.currency} {Number(p.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No purchases yet.</p>
        )}

      </div>
    </main>
  );
}
