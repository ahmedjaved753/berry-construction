"use client"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const { user, profile } = useAuthContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState({ totalUsers: 0, adminUsers: 0, regularUsers: 0, recentUsers: 0 })
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (profile && profile.role !== "admin") {
      router.push("/")
      return
    }

    const fetchAdminData = async () => {
      const supabase = createClient()

      try {
        // Get stats
        const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })
        const { count: adminUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin")
        const { count: regularUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user")

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const { count: recentUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString())

        setStats({
          totalUsers: totalUsers || 0,
          adminUsers: adminUsers || 0,
          regularUsers: regularUsers || 0,
          recentUsers: recentUsers || 0,
        })

        // Get recent users
        const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5)
        setRecentUsers(users || [])

      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }

    if (profile?.role === "admin") {
      fetchAdminData()
    }
  }, [user, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== "admin") {
    return null // Router will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen flex items-center justify-center p-6 transition-all duration-300">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Admin Dashboard Card */}
            <div className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h2>
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
                  Admin Features Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  We're building advanced admin tools and analytics for your construction management platform.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
