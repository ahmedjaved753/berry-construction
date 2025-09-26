"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function VerifyEmailPage() {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [confirmationStatus, setConfirmationStatus] = useState<{
    isConfirmed: boolean
    message: string
    canResend: boolean
  } | null>(null)
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  const checkEmailConfirmation = async () => {
    setIsCheckingStatus(true)
    const supabase = createClient()

    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        setConfirmationStatus({
          isConfirmed: false,
          message: "Please sign in to check your email confirmation status.",
          canResend: false
        })
        return
      }

      if (user.email_confirmed_at) {
        // Check if profile is synced
        const { data: verification } = await supabase.rpc('verify_email_confirmation', {
          user_id: user.id
        })

        if (verification && verification.length > 0) {
          const syncStatus = verification[0]

          if (syncStatus.needs_sync) {
            // The callback route should handle this, but let's try here too
            await supabase
              .from('profiles')
              .update({
                email_confirmed_at: user.email_confirmed_at,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)
          }
        }

        setConfirmationStatus({
          isConfirmed: true,
          message: "Your email has been confirmed! You can now access your account.",
          canResend: false
        })
      } else {
        setConfirmationStatus({
          isConfirmed: false,
          message: "Email confirmation is still pending. Please check your inbox and spam folder.",
          canResend: true
        })
      }
    } catch (error) {
      setConfirmationStatus({
        isConfirmed: false,
        message: "Unable to check confirmation status. Please try again.",
        canResend: false
      })
    } finally {
      setIsCheckingStatus(false)
    }
  }

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

  useEffect(() => {
    // Auto-check status when component loads
    checkEmailConfirmation()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmationStatus?.isConfirmed
              ? 'bg-green-100 text-green-600'
              : 'bg-primary/10 text-primary'
              }`}>
              {confirmationStatus?.isConfirmed ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
            <CardTitle className="text-2xl">
              {confirmationStatus?.isConfirmed ? "Email Confirmed!" : "Check your email"}
            </CardTitle>
            <CardDescription>
              {confirmationStatus?.isConfirmed
                ? "Your account is now fully activated"
                : "We've sent you a verification link to complete your registration"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status indicator */}
            {status === 'pending' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                  Email confirmation is pending. Please check your inbox.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              {confirmationStatus?.message || "Click the link in the email we sent you to verify your account. If you don't see it, check your spam folder."}
            </p>


            <div className="space-y-2">
              <Button
                onClick={checkEmailConfirmation}
                disabled={isCheckingStatus}
                className="w-full"
                variant="outline"
              >
                {isCheckingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  "Check Confirmation Status"
                )}
              </Button>

              {confirmationStatus?.canResend && (
                <Button
                  onClick={resendConfirmation}
                  className="w-full"
                  variant="outline"
                >
                  Resend Confirmation Email
                </Button>
              )}

              {confirmationStatus?.isConfirmed ? (
                <Link href="/" className="block">
                  <Button className="w-full">
                    Continue to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    Back to sign in
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
