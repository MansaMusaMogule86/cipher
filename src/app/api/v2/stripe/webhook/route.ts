import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { calculateSplit } from "@/lib/monetization";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Use Supabase service role for webhook (no user auth context)
function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/v2/stripe/webhook
 * Stripe sends checkout.session.completed events here.
 *
 * CRITICAL: This must use raw body for signature verification.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // ── Verify Stripe signature ───────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Handle checkout.session.completed ─────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const fanCode = session.metadata?.fan_code;
    const fanCodeId = session.metadata?.fan_code_id;
    const contentId = session.metadata?.content_id;
    const creatorId = session.metadata?.creator_id;

    if (!fanCode || !fanCodeId || !contentId || !creatorId) {
      console.error("Webhook missing metadata:", session.metadata);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const amountTotal = session.amount_total || 0;
    const currency = session.currency || "usd";
    const { platformFee, creatorEarnings } = calculateSplit(amountTotal);

    const supabase = getServiceSupabase();

    // ── Idempotency: check if already processed ─────────────────────────
    const { data: existing } = await supabase
      .from("transactions_v2")
      .select("id")
      .eq("stripe_session_id", session.id)
      .eq("status", "success")
      .single();

    if (existing) {
      // Already processed — safe to return 200
      return NextResponse.json({ received: true, duplicate: true });
    }

    // ── Update fan code to paid ─────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from("fan_codes_v2")
      .update({
        is_paid: true,
        payment_method: "stripe",
        paid_at: new Date().toISOString(),
      })
      .eq("id", fanCodeId);

    if (updateErr) {
      console.error("Failed to update fan code:", updateErr);
      return NextResponse.json({ error: "Failed to update fan code" }, { status: 500 });
    }

    // ── Insert transaction record ───────────────────────────────────────
    const { error: txErr } = await supabase
      .from("transactions_v2")
      .insert({
        content_id: contentId,
        fan_code_id: fanCodeId,
        creator_id: creatorId,
        amount: amountTotal,
        currency,
        payment_method: "stripe",
        status: "success",
        stripe_session_id: session.id,
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
      });

    if (txErr) {
      console.error("Failed to insert transaction:", txErr);
      return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
    }

    console.log(`✅ Payment processed: ${fanCode} → $${(amountTotal / 100).toFixed(2)}`);
  }

  return NextResponse.json({ received: true });
}
