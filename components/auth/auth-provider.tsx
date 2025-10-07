"use client"

import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { UserProfile } from "@/lib/auth/hooks"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  signOut: () => Promise<void>
  isLoggingOut?: boolean
  emailConfirmed: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session - OPTIMIZED for faster loading
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // OPTIMIZATION: Set user immediately - don't wait for profile
          setUser(session.user)

          // Check email confirmation status
          setEmailConfirmed(!!session.user.email_confirmed_at)

          // OPTIMIZATION: Set loading to false immediately after user is set
          setLoading(false)

          // OPTIMIZATION: Fetch profile in background (non-blocking)
          setProfileLoading(true)
          fetchUserProfile(session.user.id).then(() => {
            setProfileLoading(false)
          }).catch(() => {
            setProfileLoading(false)
          })
        } else {
          setLoading(false)
        }
      } catch (error) {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setUser(session.user)

          // Check email confirmation status
          setEmailConfirmed(!!session.user.email_confirmed_at)

          // OPTIMIZATION: Fetch profile in background (non-blocking)
          setProfileLoading(true)
          fetchUserProfile(session.user.id).then(() => {
            setProfileLoading(false)
          }).catch(() => {
            setProfileLoading(false)
          })

        } else {
          setUser(null)
          setProfile(null)
          setProfileLoading(false)
          setEmailConfirmed(false)

          // Reset logging out state on sign out
          setIsLoggingOut(false)

          // If this is a SIGNED_OUT event, redirect to login (but only if not already on login/signup pages)
          if (event === 'SIGNED_OUT') {
            const currentPath = window.location.pathname
            if (!currentPath.includes('/auth/')) {
              window.location.href = '/auth/login'
            }
          }
        }
      } catch (error) {
        // Silently handle auth state change errors
      } finally {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // Add timeout to prevent hanging
      const fetchPromise = supabase.from("profiles").select("*").eq("id", userId).single()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000)
      })

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      if (error) {
        // Check for common issues
        if (error.code === 'PGRST116') {
          // Try to create the missing profile
          try {
            const { data: user } = await supabase.auth.getUser()
            if (user?.user) {
              const { data: newProfile, error: insertError } = await supabase
                .from("profiles")
                .insert({
                  id: userId,
                  email: user.user.email || '',
                  full_name: '',
                  role: 'user',
                  is_active: false
                })
                .select()
                .single()

              if (insertError) {
                throw error // Throw original error
              } else {
                setProfile(newProfile)
                return // Successfully created and set profile
              }
            }
          } catch (createError) {
            // Handle profile creation error silently
          }
        }

        throw error
      }

      if (!data) {
        setProfile(null)
        return
      }

      // Check if user is inactive - sign them out immediately
      if (data.is_active === false) {
        console.log('⚠️ User account is inactive - signing out')
        setProfile(null)
        setUser(null)
        await supabase.auth.signOut()

        // Only redirect if not already on login page
        const currentPath = window.location.pathname
        if (!currentPath.includes('/auth/login')) {
          window.location.href = '/auth/login?error=inactive'
        }
        return
      }

      setProfile(data)

    } catch (error) {
      setProfile(null)
    }
  }


  const signOut = async () => {
    try {
      setIsLoggingOut(true)

      const { error } = await supabase.auth.signOut()

      if (error) {
        setIsLoggingOut(false)
        throw error
      }

      // Don't set isLoggingOut to false here - let the auth state change handle cleanup
    } catch (error) {
      setIsLoggingOut(false)
      throw error // Re-throw to let calling component handle it
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        signOut,
        isLoggingOut,
        emailConfirmed,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
