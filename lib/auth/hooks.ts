"use client"

import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: "user" | "admin"
  created_at: string
  updated_at: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setProfile(null)
    }
  }

  const signOut = async () => {
    console.log("[v0] signOut function called")
    try {
      console.log("[v0] About to call supabase.auth.signOut()")
      const { error } = await supabase.auth.signOut()
      console.log("[v0] signOut completed, error:", error)

      if (error) {
        console.error("[v0] Supabase signOut error:", error)
        throw error
      }

      console.log("[v0] signOut successful, redirecting...")
      router.push("/")
    } catch (error) {
      console.error("[v0] Error in signOut function:", error)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: "No user logged in" }

    try {
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()

      if (error) throw error
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      console.error("Error updating profile:", error)
      return { data: null, error }
    }
  }

  const isAdmin = profile?.role === "admin"
  const isUser = profile?.role === "user"

  return {
    user,
    profile,
    loading,
    signOut,
    updateProfile,
    isAdmin,
    isUser,
    refetchProfile: () => user && fetchUserProfile(user.id),
  }
}

export function useRequireAuth(requiredRole?: "user" | "admin") {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (requiredRole && profile?.role !== requiredRole) {
        // Redirect based on actual role
        if (profile?.role === "admin") {
          router.push("/admin-dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    }
  }, [user, profile, loading, requiredRole, router])

  return { user, profile, loading }
}
