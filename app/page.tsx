"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">AuthSystem</div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/auth/login")}>
                  Log in
                </Button>
                <Button size="sm" onClick={() => router.push("/auth/signup")}>
                  Get started
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-balance">
              The complete platform to build secure apps
            </h1>
            <p className="text-xl text-muted-foreground mb-12 text-balance max-w-2xl mx-auto leading-relaxed">
              Your team's toolkit to stop configuring and start innovating. Securely build, deploy, and scale the best
              user experiences with role-based authentication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" onClick={() => router.push("/auth/signup")}>
                Get started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 bg-transparent"
                onClick={() => router.push("/auth/login")}
              >
                Sign in
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // If user is authenticated, show dashboard
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-sm bg-transparent"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            {/* Construction Worker Sign */}
            <div className="relative">
              <div className="w-32 h-32 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
                <div className="text-black text-6xl">🚧</div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <div className="text-white text-lg">⚠️</div>
              </div>
            </div>

            {/* Work in Progress Message */}
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground">Work in Progress</h2>
              <p className="text-xl text-muted-foreground max-w-2xl">We're building something amazing for you!</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Construction in progress...</span>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-75"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
