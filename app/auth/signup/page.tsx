"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [signupAttempts, setSignupAttempts] = useState<Array<{ email: string, timestamp: string, result: string }>>([])
  const router = useRouter()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const timestamp = new Date().toISOString()
      console.log(`[SIGNUP-DEBUG ${timestamp}] 🚀 Starting signup process`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] Email: ${email}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] Full name: ${fullName}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] Password length: ${password.length}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] ⚠️ NOTE: You mentioned ahmedjaved7053@gail.com exists in database`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] Current signup email: ${email}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] ARE THESE THE SAME EMAIL? ${email === 'ahmedjaved7053@gail.com' ? 'YES' : 'NO'}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] If they're the same, pre-signup check should catch it`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] If they're different, this is actually a new email address`)

      // Track signup attempts for debugging
      console.log(`[SIGNUP-DEBUG ${timestamp}] Previous signup attempts:`, signupAttempts)
      const previousAttempts = signupAttempts.filter(attempt => attempt.email === email)
      if (previousAttempts.length > 0) {
        console.log(`[SIGNUP-DEBUG ${timestamp}] 🔍 Found ${previousAttempts.length} previous attempt(s) with this email:`)
        previousAttempts.forEach((attempt, index) => {
          console.log(`[SIGNUP-DEBUG ${timestamp}]   ${index + 1}. ${attempt.timestamp} - ${attempt.result}`)
        })
      } else {
        console.log(`[SIGNUP-DEBUG ${timestamp}] ✅ First attempt with this email`)
      }

      // Step 1: Check if email already exists in database
      console.log(`[SIGNUP-DEBUG ${timestamp}] 🔍 Step 1: Checking if email already exists in database`)

      try {
        // Try to query the profiles table first
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, created_at')
          .eq('email', email)
          .maybeSingle()

        console.log(`[SIGNUP-DEBUG ${timestamp}] Profile query result:`, {
          hasProfile: !!existingProfile,
          profileError: profileError?.message || 'none',
          profileId: existingProfile?.id || 'none',
          profileEmail: existingProfile?.email || 'none',
          profileCreated: existingProfile?.created_at || 'none'
        })

        if (existingProfile && !profileError) {
          console.log(`[SIGNUP-DEBUG ${timestamp}] 🚨 EMAIL ALREADY EXISTS IN PROFILES TABLE!`)
          console.log(`[SIGNUP-DEBUG ${timestamp}] Existing profile found:`, existingProfile)
          console.log(`[SIGNUP-DEBUG ${timestamp}] 💥 DISPLAYING ERROR: Email already exists (profiles check)`)

          // Track this attempt
          setSignupAttempts(prev => [...prev, {
            email,
            timestamp,
            result: `EMAIL_EXISTS_IN_PROFILES: ${existingProfile.id}`
          }])

          setError("An account with this email address already exists. Please sign in instead.")
          return
        }

        // Also try to check auth users table via RPC if possible
        console.log(`[SIGNUP-DEBUG ${timestamp}] 🔍 Step 1b: Email not found in profiles, checking current auth state`)
        const { data: currentSession } = await supabase.auth.getSession()
        console.log(`[SIGNUP-DEBUG ${timestamp}] Current session:`, {
          hasSession: !!currentSession.session,
          hasUser: !!currentSession.session?.user,
          sessionEmail: currentSession.session?.user?.email || 'none'
        })

        console.log(`[SIGNUP-DEBUG ${timestamp}] ✅ Email appears available, proceeding with signup`)
      } catch (checkError) {
        console.log(`[SIGNUP-DEBUG ${timestamp}] ⚠️ Error during email existence check:`, checkError)
        console.log(`[SIGNUP-DEBUG ${timestamp}] Proceeding with signup despite check error`)
      }

      // Step 2: Attempt signup
      console.log(`[SIGNUP-DEBUG ${timestamp}] 📝 Step 2: Calling supabase.auth.signUp()`)
      const signUpStartTime = Date.now()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: "user", // All new signups default to "user" role
          },
        },
      })

      const signUpDuration = Date.now() - signUpStartTime
      console.log(`[SIGNUP-DEBUG ${timestamp}] ⏱️ Signup call completed in ${signUpDuration}ms`)

      // Step 3: Analyze the complete response
      console.log(`[SIGNUP-DEBUG ${timestamp}] 📊 Step 3: Analyzing signup response`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] Raw response data:`, JSON.stringify(data, null, 2))
      console.log(`[SIGNUP-DEBUG ${timestamp}] Raw error:`, error ? JSON.stringify(error, null, 2) : null)

      console.log(`[SIGNUP-DEBUG ${timestamp}] Response analysis:`)
      console.log(`[SIGNUP-DEBUG ${timestamp}]   - data exists: ${!!data}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}]   - data.user exists: ${!!data?.user}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}]   - data.session exists: ${!!data?.session}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}]   - error exists: ${!!error}`)

      console.log(`[SIGNUP-DEBUG ${timestamp}] 🧐 SUPABASE BEHAVIOR ANALYSIS:`)
      if (data?.user && !error) {
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - Supabase created a user object (ID: ${data.user.id})`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - This means Supabase didn't reject the signup`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - Either email is truly new, or Supabase allows duplicates`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - User has identities: ${JSON.stringify(data.user.identities)}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - Confirmation sent at: ${data.user.confirmation_sent_at || 'null'}`)
      } else if (!data?.user && !error) {
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - No user created, no error = Silent rejection`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - This typically means email already exists`)
      } else if (error) {
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - Explicit error returned by Supabase`)
      }

      if (data?.user) {
        console.log(`[SIGNUP-DEBUG ${timestamp}] User object details:`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - id: ${data.user.id}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - email: ${data.user.email}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - email_confirmed_at: ${data.user.email_confirmed_at || 'null'}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - created_at: ${data.user.created_at}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - user_metadata: ${JSON.stringify(data.user.user_metadata)}`)
      }

      if (data?.session) {
        console.log(`[SIGNUP-DEBUG ${timestamp}] Session object details:`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - access_token length: ${data.session.access_token?.length || 0}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - refresh_token length: ${data.session.refresh_token?.length || 0}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - expires_at: ${data.session.expires_at}`)
      }

      // Step 4: Handle explicit errors
      if (error) {
        console.log(`[SIGNUP-DEBUG ${timestamp}] ❌ Step 4: Processing explicit error`)
        console.log(`[SIGNUP-DEBUG ${timestamp}] Error details:`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - message: ${error.message}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - status: ${error.status || 'undefined'}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - name: ${error.name || 'undefined'}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - code: ${(error as any).code || 'undefined'}`)
        throw error
      }

      // Step 5: Handle successful user creation
      if (data?.user) {
        console.log(`[SIGNUP-DEBUG ${timestamp}] ✅ Step 5: User object returned - analyzing if truly new`)

        // Check if this is actually a newly created user or an existing one
        const userCreatedAt = new Date(data.user.created_at)
        const signupTime = new Date(timestamp)
        const timeDiffSeconds = Math.abs((signupTime.getTime() - userCreatedAt.getTime()) / 1000)

        console.log(`[SIGNUP-DEBUG ${timestamp}] User creation time analysis:`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - User created_at: ${data.user.created_at}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - Signup timestamp: ${timestamp}`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - Time difference: ${timeDiffSeconds} seconds`)

        // If user was created more than 30 seconds ago, it's likely an existing user
        if (timeDiffSeconds > 30) {
          console.log(`[SIGNUP-DEBUG ${timestamp}] 🚨 EXISTING USER DETECTED!`)
          console.log(`[SIGNUP-DEBUG ${timestamp}] User was created ${timeDiffSeconds} seconds ago, not during this signup`)
          console.log(`[SIGNUP-DEBUG ${timestamp}] This indicates the email already exists and Supabase returned the existing user`)
          console.log(`[SIGNUP-DEBUG ${timestamp}] 💥 DISPLAYING ERROR: Email already exists (via timestamp analysis)`)

          // Track this attempt
          setSignupAttempts(prev => [...prev, {
            email,
            timestamp,
            result: `EXISTING_USER_DETECTED (created ${timeDiffSeconds}s ago)`
          }])

          setError("An account with this email address already exists. Please sign in instead.")
          return
        }

        console.log(`[SIGNUP-DEBUG ${timestamp}] ✅ User appears to be newly created (within ${timeDiffSeconds} seconds)`)

        // ADDITIONAL CHECK: Query profiles table again to see if this is truly a new signup
        console.log(`[SIGNUP-DEBUG ${timestamp}] 🔍 POST-SIGNUP: Double-checking if this email existed before signup`)
        try {
          const { data: allProfilesWithEmail, error: allProfilesError } = await supabase
            .from('profiles')
            .select('id, email, created_at')
            .eq('email', email)

          console.log(`[SIGNUP-DEBUG ${timestamp}] All profiles with this email:`, {
            count: allProfilesWithEmail?.length || 0,
            profiles: allProfilesWithEmail,
            error: allProfilesError?.message || 'none'
          })

          if (allProfilesWithEmail && allProfilesWithEmail.length > 1) {
            console.log(`[SIGNUP-DEBUG ${timestamp}] 🚨 MULTIPLE PROFILES WITH SAME EMAIL DETECTED!`)
            console.log(`[SIGNUP-DEBUG ${timestamp}] This indicates Supabase created a duplicate user`)
            console.log(`[SIGNUP-DEBUG ${timestamp}] 💥 DISPLAYING ERROR: Duplicate email created by Supabase`)

            // Track this attempt
            setSignupAttempts(prev => [...prev, {
              email,
              timestamp,
              result: `DUPLICATE_CREATED_BY_SUPABASE: ${allProfilesWithEmail.length} profiles`
            }])

            setError("An account with this email address already exists. Please sign in instead.")
            return
          }
        } catch (postCheckError) {
          console.log(`[SIGNUP-DEBUG ${timestamp}] ⚠️ Error during post-signup profile check:`, postCheckError)
        }

        // Check if user needs email confirmation
        if (!data.user.email_confirmed_at && !data.session) {
          console.log(`[SIGNUP-DEBUG ${timestamp}] 📧 User created but needs email confirmation`)
          console.log(`[SIGNUP-DEBUG ${timestamp}] 🔄 Redirecting to /auth/verify-email`)

          // Track this attempt
          setSignupAttempts(prev => [...prev, {
            email,
            timestamp,
            result: `SUCCESS_NEEDS_CONFIRMATION (${timeDiffSeconds}s old)`
          }])

          router.push("/auth/verify-email")
          return
        }

        // Check if user was immediately logged in
        if (data.session) {
          console.log(`[SIGNUP-DEBUG ${timestamp}] 🔐 User created and immediately logged in`)
          console.log(`[SIGNUP-DEBUG ${timestamp}] 🔄 Redirecting to /`)

          // Track this attempt
          setSignupAttempts(prev => [...prev, {
            email,
            timestamp,
            result: `SUCCESS_IMMEDIATE_LOGIN (${timeDiffSeconds}s old)`
          }])

          router.push("/")
          return
        }

        // Default case - go to verify email
        console.log(`[SIGNUP-DEBUG ${timestamp}] 🔄 Default: Redirecting to /auth/verify-email`)

        // Track this attempt
        setSignupAttempts(prev => [...prev, {
          email,
          timestamp,
          result: `SUCCESS_DEFAULT_VERIFICATION (${timeDiffSeconds}s old)`
        }])

        router.push("/auth/verify-email")
        return
      }

      // Step 6: Handle the case where no user was created (likely duplicate email)
      console.log(`[SIGNUP-DEBUG ${timestamp}] 🚨 Step 6: No user object returned`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] This typically means:`)
      console.log(`[SIGNUP-DEBUG ${timestamp}]   1. Email already exists in the system`)
      console.log(`[SIGNUP-DEBUG ${timestamp}]   2. Supabase silently rejected the signup`)
      console.log(`[SIGNUP-DEBUG ${timestamp}]   3. Email confirmation is enabled and email already exists`)

      // Try to get more information by checking auth state again
      console.log(`[SIGNUP-DEBUG ${timestamp}] 🔍 Checking auth state after signup attempt`)
      const { data: postSignupSession } = await supabase.auth.getSession()
      console.log(`[SIGNUP-DEBUG ${timestamp}] Post-signup session:`, {
        hasSession: !!postSignupSession.session,
        hasUser: !!postSignupSession.session?.user,
        sessionEmail: postSignupSession.session?.user?.email || 'none'
      })

      console.log(`[SIGNUP-DEBUG ${timestamp}] 💥 DISPLAYING ERROR: Email already exists`)

      // Track this attempt
      setSignupAttempts(prev => [...prev, {
        email,
        timestamp,
        result: 'NO_USER_RETURNED_LIKELY_DUPLICATE'
      }])

      setError("An account with this email address already exists. Please try signing in instead.")

    } catch (error: unknown) {
      const timestamp = new Date().toISOString()
      console.log(`[SIGNUP-DEBUG ${timestamp}] ❌ Caught exception in signup process`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] Exception type: ${typeof error}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] Exception instance of Error: ${error instanceof Error}`)
      console.log(`[SIGNUP-DEBUG ${timestamp}] Raw exception:`, error)

      if (error instanceof Error) {
        console.log(`[SIGNUP-DEBUG ${timestamp}] Error object details:`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - message: "${error.message}"`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - name: "${error.name}"`)
        console.log(`[SIGNUP-DEBUG ${timestamp}]   - stack: ${error.stack ? 'present' : 'not present'}`)

        const errorMessage = error.message.toLowerCase()
        console.log(`[SIGNUP-DEBUG ${timestamp}] Lowercase message: "${errorMessage}"`)

        console.log(`[SIGNUP-DEBUG ${timestamp}] 🔍 Checking error message patterns:`)
        const patterns = [
          'user already registered',
          'email already registered',
          'already been registered',
          'user already exists',
          'email already exists',
          'duplicate',
          'unique constraint',
          'invalid email',
          'weak password',
          'password is too weak'
        ]

        patterns.forEach(pattern => {
          const matches = errorMessage.includes(pattern)
          console.log(`[SIGNUP-DEBUG ${timestamp}]   - "${pattern}": ${matches}`)
        })

        if (errorMessage.includes("user already registered") ||
          errorMessage.includes("email already registered") ||
          errorMessage.includes("already been registered") ||
          errorMessage.includes("user already exists") ||
          errorMessage.includes("email already exists") ||
          errorMessage.includes("duplicate") ||
          errorMessage.includes("unique constraint")) {
          console.log(`[SIGNUP-DEBUG ${timestamp}] 💥 DISPLAYING ERROR: Duplicate email detected via exception`)

          // Track this attempt
          setSignupAttempts(prev => [...prev, {
            email,
            timestamp,
            result: `ERROR_DUPLICATE_VIA_EXCEPTION: ${error.message}`
          }])

          setError("An account with this email address already exists. Please sign in instead.")
        } else if (errorMessage.includes("invalid email")) {
          console.log(`[SIGNUP-DEBUG ${timestamp}] 💥 DISPLAYING ERROR: Invalid email`)

          // Track this attempt
          setSignupAttempts(prev => [...prev, {
            email,
            timestamp,
            result: `ERROR_INVALID_EMAIL: ${error.message}`
          }])

          setError("Please enter a valid email address.")
        } else if (errorMessage.includes("weak password") || errorMessage.includes("password is too weak")) {
          console.log(`[SIGNUP-DEBUG ${timestamp}] 💥 DISPLAYING ERROR: Weak password`)

          // Track this attempt
          setSignupAttempts(prev => [...prev, {
            email,
            timestamp,
            result: `ERROR_WEAK_PASSWORD: ${error.message}`
          }])

          setError("Password is too weak. Please use a stronger password.")
        } else {
          console.log(`[SIGNUP-DEBUG ${timestamp}] 💥 DISPLAYING ERROR: Generic error from exception`)
          console.log(`[SIGNUP-DEBUG ${timestamp}] Full error message: "${error.message}"`)

          // Track this attempt
          setSignupAttempts(prev => [...prev, {
            email,
            timestamp,
            result: `ERROR_GENERIC: ${error.message}`
          }])

          setError(error.message)
        }
      } else {
        console.log(`[SIGNUP-DEBUG ${timestamp}] 💥 DISPLAYING ERROR: Non-Error exception`)

        // Track this attempt
        setSignupAttempts(prev => [...prev, {
          email,
          timestamp,
          result: `ERROR_NON_ERROR_EXCEPTION: ${JSON.stringify(error)}`
        }])

        setError("An error occurred during signup. Please try again.")
      }
    } finally {
      const timestamp = new Date().toISOString()
      console.log(`[SIGNUP-DEBUG ${timestamp}] 🏁 Finally block: Setting loading to false`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">Create your account</h1>
          <p className="text-base text-muted-foreground leading-relaxed">Get started with your free account today</p>
        </div>

        <Card className="border border-border bg-card shadow-lg shadow-black/5">
          <CardHeader className="space-y-2 pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-semibold text-center">Sign up</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleEmailSignup} className="space-y-5">
              {/* Debug indicator */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                  🐛 DUPLICATE EMAIL DEBUG: Open console (F12) to see comprehensive signup analysis
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Testing: Pre-signup email check → Supabase signup → Post-signup duplicate detection
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm hover:shadow-md mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="text-center mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-foreground hover:text-primary font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
