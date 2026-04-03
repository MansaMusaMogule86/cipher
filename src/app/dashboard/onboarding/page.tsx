import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreatorOnboardingClient from "./CreatorOnboardingClient";

export default async function CreatorOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: creatorApplication }, { data: onboardingRow }] = await Promise.all([
    supabase
      .from("creator_applications")
      .select("name, category, content_types, audience_size, bio")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("creator_onboarding")
      .select("interests, content_types, experience_level, analysis")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const initialValues = {
    interests: Array.isArray(onboardingRow?.interests) && onboardingRow?.interests.length > 0
      ? onboardingRow.interests
      : [creatorApplication?.category].filter((value): value is string => Boolean(value)),
    contentTypes: Array.isArray(onboardingRow?.content_types) && onboardingRow?.content_types.length > 0
      ? onboardingRow.content_types
      : Array.isArray(creatorApplication?.content_types)
        ? creatorApplication.content_types
        : [],
    experience: onboardingRow?.experience_level || "beginner",
    currentPlatforms: [],
    goals: creatorApplication?.audience_size ? [`grow beyond ${creatorApplication.audience_size}`] : [],
  };

  return (
    <CreatorOnboardingClient
      creatorName={creatorApplication?.name || "Creator"}
      initialValues={initialValues}
      existingAnalysis={(onboardingRow?.analysis as Record<string, unknown> | null) ?? null}
    />
  );
}