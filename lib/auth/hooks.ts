"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const timestamp = new Date().toISOString();
      console.log(
        `[AUTH-HOOKS-DEBUG ${timestamp}] Auth state change: ${event}`
      );
      console.log(
        `[AUTH-HOOKS-DEBUG ${timestamp}] Session exists: ${!!session}`
      );
      console.log(
        `[AUTH-HOOKS-DEBUG ${timestamp}] User exists: ${!!session?.user}`
      );

      if (session?.user) {
        console.log(
          `[AUTH-HOOKS-DEBUG ${timestamp}] Setting user: ${session.user.id}`
        );
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        console.log(
          `[AUTH-HOOKS-DEBUG ${timestamp}] Clearing user and profile`
        );
        setUser(null);
        setProfile(null);
        setSigningOut(false); // Reset signing out state

        // If this is a SIGNED_OUT event (not initial load), redirect to login
        if (event === "SIGNED_OUT") {
          console.log(
            `[AUTH-HOOKS-DEBUG ${timestamp}] 🔄 User signed out, redirecting to login`
          );
          router.push("/auth/login");
        }
      }
      setLoading(false);
      console.log(`[AUTH-HOOKS-DEBUG ${timestamp}] Auth state change complete`);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfile(null);
    }
  };

  const signOut = async () => {
    const timestamp = new Date().toISOString();
    console.log(
      `[LOGOUT-DEBUG ${timestamp}] ========== LOGOUT PROCESS STARTED ==========`
    );
    console.log(`[LOGOUT-DEBUG ${timestamp}] User ID: ${user?.id}`);
    console.log(`[LOGOUT-DEBUG ${timestamp}] User Role: ${profile?.role}`);
    console.log(
      `[LOGOUT-DEBUG ${timestamp}] Current Path: ${window.location.pathname}`
    );

    if (signingOut) {
      console.log(
        `[LOGOUT-DEBUG ${timestamp}] ⚠️  Already signing out, ignoring duplicate call`
      );
      return;
    }

    setSigningOut(true);
    console.log(`[LOGOUT-DEBUG ${timestamp}] ✅ Set signingOut to true`);

    try {
      console.log(
        `[LOGOUT-DEBUG ${timestamp}] 🔄 Calling supabase.auth.signOut()`
      );

      const { error } = await supabase.auth.signOut();

      console.log(`[LOGOUT-DEBUG ${timestamp}] SignOut Response:`, {
        error: error ? JSON.stringify(error) : null,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.error(
          `[LOGOUT-DEBUG ${timestamp}] ❌ Supabase signOut error:`,
          error
        );
        throw error;
      }

      console.log(
        `[LOGOUT-DEBUG ${timestamp}] ✅ Supabase signOut successful - auth state listener will handle cleanup`
      );
    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      console.error(
        `[LOGOUT-DEBUG ${errorTimestamp}] ❌ Error in signOut function:`,
        error
      );
      setSigningOut(false); // Reset on error
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: "No user logged in" };

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { data: null, error };
    }
  };

  const isAdmin = profile?.role === "admin";
  const isUser = profile?.role === "user";

  return {
    user,
    profile,
    loading,
    signingOut,
    signOut,
    updateProfile,
    isAdmin,
    isUser,
    refetchProfile: () => user && fetchUserProfile(user.id),
  };
}

export function useRequireAuth(requiredRole?: "user" | "admin") {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      if (requiredRole && profile?.role !== requiredRole) {
        // Redirect based on actual role
        if (profile?.role === "admin") {
          router.push("/admin-dashboard");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, profile, loading, requiredRole, router]);

  return { user, profile, loading };
}
