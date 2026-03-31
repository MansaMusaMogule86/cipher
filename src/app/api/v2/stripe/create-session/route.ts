import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * POST /api/v2/stripe/create-session
 * Creates a Stripe Checkout session for a fan code purchase.
 *
 * Body: { fan_code: string }
 * Returns: { url: string } — redirect the fan to this URL
 */
export async function POST(request: Request) {
  let body: { fan_code?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fanCode = body.fan_code?.trim().toUpperCase();
  if (!fanCode || !/^FAN-[A-Z2-9]{10}$/.test(fanCode)) {
    return NextResponse.json({ error: "Invalid fan code" }, { status: 400 });
  }

  // ── Fetch fan code + content ──────────────────────────────────────────────
  const supabase = await createClient();

  const { data: codeRow, error: codeErr } = await supabase
    .from("fan_codes_v2")
    .select("id, code, content_id, is_paid")
    .eq("code", fanCode)
    .single();

  if (codeErr || !codeRow) {
    return NextResponse.json({ error: "Fan code not found" }, { status: 404 });
  }

  if (codeRow.is_paid) {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const { data: content, error: contentErr } = await supabase
    .from("content_items_v2")
    .select("id, title, price, currency, creator_id")
    .eq("id", codeRow.content_id)
    .single();

  if (contentErr || !content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  // ── Create Stripe Checkout session ────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: content.currency || "usd",
          product_data: {
            name: content.title,
            description: `Unlock code: ${fanCode}`,
          },
          unit_amount: content.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      fan_code: fanCode,
      fan_code_id: codeRow.id,
      content_id: content.id,
      creator_id: content.creator_id,
    },
    success_url: `${baseUrl}/unlock/${fanCode}?success=true`,
    cancel_url: `${baseUrl}/unlock/${fanCode}?canceled=true`,
  });

  return NextResponse.json({
    success: true,
    data: { url: session.url },
  });
}
