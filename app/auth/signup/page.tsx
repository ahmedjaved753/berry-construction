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
      // Step 1: Check if email already exists in database
      try {
        // Try to query the profiles table first
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, created_at')
          .eq('email', email)
          .maybeSingle()

        if (existingProfile && !profileError) {
          setError("An account with this email address already exists. Please sign in instead.")
          return
        }
      } catch (checkError) {
        // Proceed with signup despite check error
      }

      // Step 2: Attempt signup
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

      // Step 3: Handle explicit errors
      if (error) {
        throw error
      }

      // Step 4: Handle successful user creation
      if (data?.user) {
        // Check if this is actually a newly created user or an existing one
        const userCreatedAt = new Date(data.user.created_at)
        const signupTime = new Date()
        const timeDiffSeconds = Math.abs((signupTime.getTime() - userCreatedAt.getTime()) / 1000)

        // If user was created more than 30 seconds ago, it's likely an existing user
        if (timeDiffSeconds > 30) {
          setError("An account with this email address already exists. Please sign in instead.")
          return
        }

        // ADDITIONAL CHECK: Query profiles table again to see if this is truly a new signup
        try {
          const { data: allProfilesWithEmail } = await supabase
            .from('profiles')
            .select('id, email, created_at')
            .eq('email', email)

          if (allProfilesWithEmail && allProfilesWithEmail.length > 1) {
            setError("An account with this email address already exists. Please sign in instead.")
            return
          }
        } catch (postCheckError) {
          // Handle error silently
        }

        // Check if user needs email confirmation
        if (!data.user.email_confirmed_at && !data.session) {
          router.push("/auth/verify-email")
          return
        }

        // Check if user was immediately logged in
        if (data.session) {
          router.push("/")
          return
        }

        // Default case - go to verify email
        router.push("/auth/verify-email")
        return
      }

      // Step 5: Handle the case where no user was created (likely duplicate email)
      setError("An account with this email address already exists. Please try signing in instead.")

    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()

        if (errorMessage.includes("user already registered") ||
          errorMessage.includes("email already registered") ||
          errorMessage.includes("already been registered") ||
          errorMessage.includes("user already exists") ||
          errorMessage.includes("email already exists") ||
          errorMessage.includes("duplicate") ||
          errorMessage.includes("unique constraint")) {
          setError("An account with this email address already exists. Please sign in instead.")
        } else if (errorMessage.includes("invalid email")) {
          setError("Please enter a valid email address.")
        } else if (errorMessage.includes("weak password") || errorMessage.includes("password is too weak")) {
          setError("Password is too weak. Please use a stronger password.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An error occurred during signup. Please try again.")
      }
    } finally {
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
                  placeholder="Minimum 8 characters"
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
