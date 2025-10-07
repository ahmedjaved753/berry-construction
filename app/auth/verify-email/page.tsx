"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const pending = searchParams.get('pending')


  const resendConfirmation = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.email) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) {
        alert('Failed to resend confirmation email. Please try again.')
      } else {
        alert('Confirmation email sent! Please check your inbox.')
      }
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10 text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We've sent you a verification link to complete your registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Admin activation notice */}
            {pending === 'true' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 text-center font-medium mb-2">
                  ⏳ Account Pending Activation
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                  After verifying your email, your account will need to be activated by an administrator before you can log in. You'll be notified once your account is activated.
                </p>
              </div>
            )}

            {/* Status indicator */}
            {status === 'pending' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                  Email confirmation is pending. Please check your inbox.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email we sent you to verify your account. If you don't see it, check your spam folder.
            </p>


            <div className="space-y-2">
              <Button
                onClick={resendConfirmation}
                className="w-full"
                variant="outline"
              >
                Resend Confirmation Email
              </Button>

              <Link href="/auth/login" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to sign in
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
