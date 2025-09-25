"use client"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Navbar } from "@/components/navigation/navbar"
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function UsersManagementPage() {
  const { user, profile } = useAuthContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
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

    const fetchUsers = async () => {
      const supabase = createClient()

      try {
        const { data: userData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
        setUsers(userData || [])
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.role === "admin") {
      fetchUsers()
    }
  }, [user, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading user management...</p>
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
      {/* Modern Navbar */}
      <Navbar />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content */}
      <main className="md:ml-64 pt-6 transition-all duration-300">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* User Management Card */}
            <div className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
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
                  User Management Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  We're building advanced user management tools for your construction team administration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}