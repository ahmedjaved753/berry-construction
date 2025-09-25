import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserProfile } from "./hooks";

export async function getServerUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getServerUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const user = await getServerUser();

  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function requireAuth(requiredRole?: "user" | "admin") {
  const user = await getServerUser();
  const profile = await getServerUserProfile();

  if (!user) {
    redirect("/auth/login");
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect based on actual role
    if (profile?.role === "admin") {
      redirect("/admin-dashboard");
    } else {
      redirect("/");
    }
  }

  return { user, profile };
}

export async function requireAdmin() {
  return requireAuth("admin");
}

export async function requireUser() {
  return requireAuth("user");
}
