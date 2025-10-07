"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for persisted login error (in case page refreshed)
    const persistedError = localStorage.getItem('loginError')
    if (persistedError) {
      setError(persistedError)
      localStorage.removeItem('loginError')
    }

    // Check for signup success message
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('signup') === 'success' && urlParams.get('pending') === 'true') {
      setSuccessMessage("Account created successfully! Please wait for an administrator to activate your account before logging in.")
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (urlParams.get('error') === 'inactive') {
      setError("Your account is inactive. Please contact an administrator to activate your account.")
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔵 Starting login for:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('🔵 Login response:', { data: !!data, error })

      if (error) throw error

      // Check if user profile is active
      if (data.user) {
        console.log('🔵 Checking profile for user:', data.user.id)

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_active, role")
          .eq("id", data.user.id)
          .single()

        console.log('🔵 Profile check result:', { profile, profileError })

        if (profileError) {
          console.error('❌ Profile error:', profileError)
          await supabase.auth.signOut()
          throw new Error("Unable to verify account status. Please contact an administrator.")
        }

        if (!profile.is_active) {
          console.log('⚠️ User is inactive')
          await supabase.auth.signOut()
          throw new Error("Your account is inactive. Please contact an administrator to activate your account.")
        }

        console.log('✅ Login successful, redirecting to /expenses')
      }

      router.push("/expenses")
    } catch (error: unknown) {
      console.error('❌ Login error:', error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred"

      // Persist error in case page refreshes
      localStorage.setItem('loginError', errorMessage)

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">Welcome back</h1>
          <p className="text-base text-muted-foreground leading-relaxed">Sign in to your account to continue</p>
        </div>

        <Card className="border border-border bg-card shadow-lg shadow-black/5">
          <CardHeader className="space-y-2 pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-semibold text-center">Sign in</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your credentials below
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleEmailLogin} className="space-y-6">
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>

              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>


            <div className="text-center mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-foreground hover:text-primary font-medium transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
