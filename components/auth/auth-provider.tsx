"use client"

import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { UserProfile } from "@/lib/auth/hooks"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const timestamp = new Date().toISOString()
      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] 🔄 Getting initial session...`)

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Initial session exists: ${!!session}`)

        if (session?.user) {
          console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Initial user found: ${session.user.id}`)
          setUser(session.user)

          console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] ⏳ Fetching initial profile...`)
          await fetchUserProfile(session.user.id)
          console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] ✅ Initial profile fetch completed`)
        } else {
          console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] No initial session`)
        }
      } catch (error) {
        console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] ❌ Error getting initial session:`, error)
      } finally {
        console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] 🔄 Setting initial loading to false`)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const timestamp = new Date().toISOString()
      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Auth state change: ${event}`)
      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Session exists: ${!!session}`)
      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] User exists: ${!!session?.user}`)

      try {
        if (session?.user) {
          console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Setting user: ${session.user.id}`)
          setUser(session.user)

          console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] ⏳ Starting profile fetch...`)
          await fetchUserProfile(session.user.id)
          console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] ✅ Profile fetch completed`)

        } else {
          console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Clearing user and profile`)
          setUser(null)
          setProfile(null)

          // If this is a SIGNED_OUT event, redirect to login
          if (event === 'SIGNED_OUT') {
            console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] 🔄 User signed out, redirecting to login`)
            window.location.href = '/auth/login'
          }
        }
      } catch (error) {
        console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] ❌ Error in auth state change:`, error)
      } finally {
        console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] 🔄 Setting loading to false`)
        setLoading(false)
        console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Auth state change complete`)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    const timestamp = new Date().toISOString()
    try {
      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] 🔄 Fetching profile for user: ${userId}`)

      const startTime = Date.now()

      // Add timeout to prevent hanging
      const fetchPromise = supabase.from("profiles").select("*").eq("id", userId).single()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000)
      })

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])
      const fetchTime = Date.now() - startTime

      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] ⏱️  Profile query took ${fetchTime}ms`)
      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Query result:`, {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message
      })

      if (error) {
        console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] ❌ Database error:`, error)

        // Check for common issues
        if (error.code === 'PGRST116') {
          console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] 🚨 Profile not found - attempting to create one`)

          // Try to create the missing profile
          try {
            const { data: user } = await supabase.auth.getUser()
            if (user?.user) {
              console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] 🔧 Creating missing profile for user: ${userId}`)

              const { data: newProfile, error: insertError } = await supabase
                .from("profiles")
                .insert({
                  id: userId,
                  email: user.user.email || '',
                  full_name: '',
                  role: 'user'
                })
                .select()
                .single()

              if (insertError) {
                console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] ❌ Failed to create profile:`, insertError)
                throw error // Throw original error
              } else {
                console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] ✅ Profile created successfully:`, newProfile)
                setProfile(newProfile)
                return // Successfully created and set profile
              }
            }
          } catch (createError) {
            console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] ❌ Error creating profile:`, createError)
          }
        } else if (error.code === '42501') {
          console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] 🚨 Permission denied - check RLS policies`)
        }

        throw error
      }

      if (!data) {
        console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] ❌ No profile data returned`)
        setProfile(null)
        return
      }

      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] ✅ Profile fetched successfully:`, {
        role: data.role,
        email: data.email,
        fullName: data.full_name,
        id: data.id
      })
      setProfile(data)

    } catch (error) {
      console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] ❌ Error fetching user profile:`, error)
      console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] Error details:`, {
        message: error?.message,
        code: error?.code,
        hint: error?.hint,
        details: error?.details,
        stack: error?.stack
      })
      setProfile(null)
    }
  }

  const signOut = async () => {
    const timestamp = new Date().toISOString()
    try {
      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Auth provider signOut called`)

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] Supabase signOut error:`, error)
        throw error
      }

      console.log(`[AUTH-PROVIDER-DEBUG ${timestamp}] Auth provider signOut completed successfully`)
    } catch (error) {
      console.error(`[AUTH-PROVIDER-DEBUG ${timestamp}] Error in auth provider signOut:`, error)
      throw error // Re-throw to let calling component handle it
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
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
