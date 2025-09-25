"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar"
import { useState, useEffect } from "react"

export default function HomePage() {
  const router = useRouter()
  const { user, profile, loading, profileLoading } = useAuthContext()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  console.log('[HOMEPAGE-DEBUG] HomePage rendering:', {
    hasUser: !!user,
    hasProfile: !!profile,
    userRole: profile?.role,
    loading,
    timestamp: new Date().toISOString()
  })

  // Add timeout for auth loading state (not profile loading)
  useEffect(() => {
    if (loading) {
      console.log('[HOMEPAGE-DEBUG] Auth still loading, starting timeout...')
      const timeout = setTimeout(() => {
        console.log('[HOMEPAGE-DEBUG] ⚠️ Auth loading timeout reached - this might indicate an auth issue')
        setLoadingTimeout(true)
      }, 10000) // 10 second timeout for auth (reduced from 15s)

      return () => clearTimeout(timeout)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading])

  const handleForceRefresh = () => {
    console.log('[HOMEPAGE-DEBUG] 🔄 Force refresh requested')
    window.location.reload()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // OPTIMIZED: Only show loading state for initial auth loading (not profile loading)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {loadingTimeout ? "Authentication is taking longer than expected..." : "Checking authentication..."}
            </p>

            {loadingTimeout && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  This might be an authentication issue. Check the browser console for debug logs.
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
        <main className="container mx-auto px-6 py-8 min-h-screen flex items-center justify-center">
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

  // OPTIMIZED: Always show content when user exists (even during profile loading)
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">

      {/* Sidebar for authenticated users */}
      {user && (
        <>
          <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
          <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />
        </>
      )}

      {/* Main Content with sidebar spacing */}
      <main className={`transition-all duration-300 ${user ? 'md:ml-64' : ''} min-h-screen flex items-center justify-center p-6`}>
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">

            {/* OPTIMIZED: Profile loading indicator */}
            {profileLoading && (
              <div className="mb-6 p-4 bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Loading your profile details...
                  </p>
                </div>
              </div>
            )}

            {/* OPTIMIZED: Personal welcome message when profile loads */}
            {profile && !profileLoading && (
              <div className="mb-6 p-4 bg-green-50/70 dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/60 rounded-lg">
                <h1 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  Welcome back, {profile.full_name || user.email?.split('@')[0] || 'User'}!
                  {profile.role === 'admin' && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                      👑 Admin Access
                    </span>
                  )}
                </h1>
              </div>
            )}

            {/* Main Construction Card */}
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