"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Navbar } from "@/components/navigation/navbar"
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar"
import { useState, useEffect } from "react"

export default function HomePage() {
  const router = useRouter()
  const { user, profile, loading } = useAuthContext()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  console.log('[HOMEPAGE-DEBUG] HomePage rendering:', {
    hasUser: !!user,
    hasProfile: !!profile,
    userRole: profile?.role,
    loading,
    timestamp: new Date().toISOString()
  })

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    if (loading && user) {
      console.log('[HOMEPAGE-DEBUG] User exists but still loading, starting timeout...')
      const timeout = setTimeout(() => {
        console.log('[HOMEPAGE-DEBUG] ⚠️ Loading timeout reached - this might indicate a profile fetch issue')
        setLoadingTimeout(true)
      }, 15000) // 15 second timeout

      return () => clearTimeout(timeout)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading, user])

  const handleForceRefresh = () => {
    console.log('[HOMEPAGE-DEBUG] 🔄 Force refresh requested')
    window.location.reload()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Show loading state only if we don't have a user and are still loading
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {loadingTimeout ? "Loading is taking longer than expected..." : "Loading..."}
            </p>

            {loadingTimeout && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  This might be a profile loading issue. Check the browser console for debug logs.
                </p>
                <Button onClick={handleForceRefresh} variant="outline">
                  🔄 Refresh Page
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // If user is not authenticated, show landing page with construction theme
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <Navbar />

        <main className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Construction Card for non-authenticated users */}
            <div className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Berry Construction</h2>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  Get Started
                </Button>
              </div>

              {/* Construction Progress Illustration */}
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-xl transform rotate-3">
                    <div className="text-6xl">🚧</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <div className="text-white text-lg">⚠️</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
                  Platform Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                  We're building an amazing construction project management platform. Sign up to get early access!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="px-8 bg-gradient-to-r from-purple-600 to-blue-600" onClick={() => router.push("/auth/signup")}>
                    Get Started
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8"
                    onClick={() => router.push("/auth/login")}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Always show construction content when user exists (even during profile loading)
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* Modern Navbar */}
      <Navbar />

      {/* Sidebar for authenticated users */}
      {user && (
        <>
          <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
          <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />
        </>
      )}

      {/* Main Content with sidebar spacing */}
      <main className={`transition-all duration-300 ${user ? 'md:ml-64' : ''} pt-6`}>
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Construction Card */}
            <div className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  View All
                </Button>
              </div>

              {/* Construction Progress Illustration */}
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-xl transform rotate-3">
                    <div className="text-6xl">🚧</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <div className="text-white text-lg">⚠️</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
                  Projects Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  We're building an amazing project management system for your construction needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}