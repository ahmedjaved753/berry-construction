"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import XeroConnectionPrompt from "@/components/integrations/xero-connection-prompt"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  TrendingUp,
  PoundSterling,
  Users,
  Calendar,
  ArrowRight,
  Plus,
  BarChart3,
  CheckCircle
} from "lucide-react"

interface XeroConnection {
  id: string
  org_name?: string
  tenant_name?: string
  connected_at: string
  expires_at: string
  last_refreshed_at: string
  is_expired: boolean
}

interface SyncStatus {
  connected: boolean
  lastSync: string | null
  dataCounts: {
    invoices: number
    departments: number
    stages: number
    lineItems: number
  }
}

// Helper function to get authenticated headers for Edge Function calls
async function getAuthHeaders() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Authentication required')
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

export default function HomePage() {
  const router = useRouter()
  const { user, profile, loading, profileLoading } = useAuthContext()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [xeroConnection, setXeroConnection] = useState<XeroConnection | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [connectionLoading, setConnectionLoading] = useState(true)

  // Add timeout for auth loading state (not profile loading)
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true)
      }, 10000) // 10 second timeout for auth

      return () => clearTimeout(timeout)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading])

  // Check Xero connection and sync status when user loads
  useEffect(() => {
    if (user && !loading) {
      checkXeroConnection()
      checkSyncStatus()
    }
  }, [user, loading])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const checkXeroConnection = async () => {
    if (!user) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/xero-connection`, {
        headers
      })
      const data = await response.json()

      if (data.connected) {
        setXeroConnection(data.connection)
      } else {
        setXeroConnection(null)
      }
    } catch (error) {
      console.error('Error checking Xero connection:', error)
    } finally {
      setConnectionLoading(false)
    }
  }

  const checkSyncStatus = async () => {
    if (!user) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/xero-sync-manager`, {
        headers
      })
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data)
      }
    } catch (error) {
      console.error('Error checking sync status:', error)
    }
  }

  const handleForceRefresh = () => {
    window.location.reload()
  }

  // OPTIMIZED: Only show loading state for initial auth loading (not profile loading)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground dark:text-gray-300">Loading your dashboard...</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">This should only take a moment</p>
            {loadingTimeout && (
              <div className="pt-4 space-y-2">
                <p className="text-sm text-orange-600 dark:text-orange-400">Taking longer than usual...</p>
                <Button onClick={handleForceRefresh} variant="outline" size="sm">
                  Force Refresh
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-white font-bold text-xl">BC</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground dark:text-white mb-4">
                Berry Construction
              </h1>
              <p className="text-xl text-muted-foreground dark:text-gray-300 mb-8">
                Streamline your construction business with integrated project management and financial insights.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-12">
              <Card className="text-left">
                <CardHeader>
                  <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle className="text-lg">Financial Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Connect your accounting software for real-time financial reporting and project profitability analysis.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-left">
                <CardHeader>
                  <Users className="w-8 h-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">Team Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Manage your construction team, track project progress, and collaborate effectively on all your builds.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-left">
                <CardHeader>
                  <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">Project Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Get detailed insights into project performance, costs, and timelines to make better business decisions.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="space-x-4">
              <Button
                size="lg"
                onClick={() => router.push('/auth/signup')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 rounded-full"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/auth/login')}
                className="px-8 py-3"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Redirect authenticated users to /expenses
  router.push('/expenses')
  return null
}