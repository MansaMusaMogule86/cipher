import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Fan dashboard layout.
 * Middleware already enforces authentication for /fan routes,
 * but we re-verify here for defence-in-depth and to surface the role.
 */
export default async function FanLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/fan");
  }

  // Role is forwarded by middleware via request header
  const headersList = await headers();
  const role = headersList.get("X-User-Role") ?? "fan";

  // Admins who land on /fan should be redirected to their panel
  if (role === "admin" || role === "super_admin") {
    redirect("/admin");
  }

  return <>{children}</>;
}
