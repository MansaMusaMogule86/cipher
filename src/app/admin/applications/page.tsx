import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationManager } from "./ApplicationManager";

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!adminCheck) {
    redirect("/dashboard");
  }

  return (
    <div style={{ padding: "32px", minHeight: "100vh", background: "#020203" }}>
      <ApplicationManager />
    </div>
  );
}
