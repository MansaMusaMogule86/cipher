import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch creator's real transaction data for analysis
  const { data: txData } = await supabase
    .from("transactions")
    .select("amount, type, status, created_at, fan_code")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: walletData } = await supabase
    .from("creator_wallets")
    .select("balance, total_earnings, referral_income")
    .eq("creator_id", user.id)
    .maybeSingle();

  const body = await req.json().catch(() => ({}));
  const currentPrice = Number(body.currentPrice ?? 0);
  const contentType = String(body.contentType ?? "subscription");

  const transactions = txData ?? [];
  const totalRevenue = transactions.reduce((s, t) => s + Number(t.amount ?? 0), 0);
  const avgTx = transactions.length > 0 ? totalRevenue / transactions.length : 0;
  const uniqueFans = new Set(transactions.map(t => t.fan_code)).size;
  const completedTx = transactions.filter(t => t.status === "completed").length;
  const conversionRate = transactions.length > 0 ? (completedTx / transactions.length) * 100 : 0;
  const balance = Number(walletData?.balance ?? 0);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const systemPrompt = `You are a pricing strategist for premium content creators. Analyze real transaction data and give precise, actionable pricing advice. Be direct, data-driven, and bold.`;

  const userPrompt = `Analyze this creator's data and recommend the optimal price for their ${contentType} content.

CREATOR DATA:
- Current price: $${currentPrice}
- Total revenue (last 50 transactions): $${totalRevenue.toFixed(2)}
- Average transaction: $${avgTx.toFixed(2)}
- Unique fans: ${uniqueFans}
- Completed transactions: ${completedTx}/${transactions.length}
- Conversion rate: ${conversionRate.toFixed(1)}%
- Available balance: $${balance.toFixed(2)}

Respond EXACTLY in this format:
RECOMMENDED_PRICE: $[number]
CONFIDENCE: [0-100]%
REASONING: [2-3 sentence explanation with data-backed rationale]
PREDICTION_1: [specific outcome prediction]
PREDICTION_2: [specific outcome prediction]
PREDICTION_3: [specific outcome prediction]`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const json = await res.json();
    const text: string = json.content?.[0]?.text ?? "";

    const extract = (key: string) => {
      const match = text.match(new RegExp(`${key}:\\s*(.+)`));
      return match?.[1]?.trim() ?? "";
    };

    return NextResponse.json({
      recommendedPrice: extract("RECOMMENDED_PRICE"),
      confidence: extract("CONFIDENCE"),
      reasoning: extract("REASONING"),
      predictions: [
        extract("PREDICTION_1"),
        extract("PREDICTION_2"),
        extract("PREDICTION_3"),
      ].filter(Boolean),
      stats: {
        totalRevenue: totalRevenue.toFixed(2),
        avgTransaction: avgTx.toFixed(2),
        uniqueFans,
        conversionRate: conversionRate.toFixed(1),
      },
    });
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
