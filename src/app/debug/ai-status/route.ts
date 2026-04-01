import { NextResponse } from "next/server";

export async function GET() {
  // Check which AI providers are configured
  const status = {
    // OpenRouter (used by bio generator & price optimizer)
    openrouter: {
      keySet: !!process.env.OPENROUTER_API_KEY,
      keyPrefix: process.env.OPENROUTER_API_KEY?.slice(0, 12) || null,
      referer: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
    // Anthropic (used by ghostwriter)
    anthropic: {
      keySet: !!process.env.ANTHROPIC_API_KEY,
      keyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 12) || null,
    },
    // Supabase (for saving generated content)
    supabase: {
      urlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKeySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleSet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  };

  // Determine overall health
  const hasOpenRouter = status.openrouter.keySet;
  const hasAnthropic = status.anthropic.keySet;
  const hasSupabaseService = status.supabase.serviceRoleSet;

  return NextResponse.json({
    ...status,
    health: {
      canGenerateBio: hasOpenRouter,
      canPredictPrice: hasOpenRouter,
      canGhostwrite: hasAnthropic,
      canSaveToDb: hasSupabaseService,
      allSystemsGo: hasOpenRouter && hasAnthropic && hasSupabaseService,
    },
    fixes: {
      bioGeneration: !hasOpenRouter 
        ? "Add OPENROUTER_API_KEY to Vercel env vars" 
        : "Working",
      ghostwriter: !hasAnthropic 
        ? "Add ANTHROPIC_API_KEY to Vercel env vars" 
        : "Working",
      database: !hasSupabaseService 
        ? "Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars (NOT NEXT_PUBLIC_)" 
        : "Working",
    },
  });
}
