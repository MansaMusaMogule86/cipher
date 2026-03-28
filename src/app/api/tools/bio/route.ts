import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const keywords = String(body.keywords ?? "").trim();
  const category = String(body.category ?? "luxury").trim();

  if (!keywords) {
    return NextResponse.json({ error: "keywords required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const prompt = `Generate 3 distinct creator bio variations for a ${category} content creator. Their keywords are: ${keywords}.

Each bio must be:
- Exactly 2-3 sentences
- Dark, luxury, mysterious tone — like a cipher that only true fans can decode
- Written in first person
- Evocative, bold, never generic

Format your response EXACTLY like this (no extra text):
BIO_1: [bio here]
BIO_2: [bio here]
BIO_3: [bio here]`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
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
            max_tokens: 600,
            stream: true,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!res.ok || !res.body) {
          controller.enqueue(encoder.encode("Generation failed."));
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = dec.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
                controller.enqueue(encoder.encode(json.delta.text));
              }
            } catch {}
          }
        }
        controller.close();
      } catch {
        controller.enqueue(encoder.encode("Generation failed."));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
