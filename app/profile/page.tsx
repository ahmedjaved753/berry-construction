"use client"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Navbar } from "@/components/navigation/navbar"
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"

interface XeroConnection {
  id: string
  org_name?: string
  tenant_name?: string
  connected_at: string
  expires_at: string
  last_refreshed_at: string
  is_expired: boolean
}

export default function ProfilePage() {
  const { user, profile } = useAuthContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [xeroConnection, setXeroConnection] = useState<XeroConnection | null>(null)
  const [isConnectingXero, setIsConnectingXero] = useState(false)
  const [xeroLoading, setXeroLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const checkXeroConnection = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/xero/connection')
      const data = await response.json()

      if (data.connected) {
        setXeroConnection(data.connection)
      } else {
        setXeroConnection(null)
      }
    } catch (error) {
      console.error('Error checking Xero connection:', error)
    } finally {
      setXeroLoading(false)
    }
  }

  const handleConnectXero = async () => {
    setIsConnectingXero(true)
    try {
      const response = await fetch('/api/xero/connect', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.authUrl) {
        // Redirect to Xero OAuth
        window.location.href = data.authUrl
      } else {
        setMessage({ type: "error", text: "Failed to initiate Xero connection" })
      }
    } catch (error) {
      console.error('Error connecting to Xero:', error)
      setMessage({ type: "error", text: "Failed to connect to Xero" })
    } finally {
      setIsConnectingXero(false)
    }
  }

  const handleDisconnectXero = async () => {
    if (!confirm('Are you sure you want to disconnect from Xero? You will need to re-authorize to access Xero data again.')) {
      return
    }

    try {
      const response = await fetch('/api/xero/connection', {
        method: 'DELETE'
      })

      if (response.ok) {
        setXeroConnection(null)
        setMessage({ type: "success", text: "Xero disconnected successfully" })
      } else {
        setMessage({ type: "error", text: "Failed to disconnect Xero" })
      }
    } catch (error) {
      console.error('Error disconnecting Xero:', error)
      setMessage({ type: "error", text: "Failed to disconnect Xero" })
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (profile) {
      setFullName(profile.full_name || "")
    }

    // Check Xero connection status
    checkXeroConnection()

    // Handle OAuth callback messages
    const xeroConnected = searchParams.get('xero_connected')
    const xeroError = searchParams.get('xero_error')

    if (xeroConnected === 'true') {
      setMessage({ type: "success", text: "Xero connected successfully!" })
      // Refresh connection status
      checkXeroConnection()
      // Clean up URL
      router.replace('/profile')
    }

    if (xeroError) {
      let errorMessage = "Failed to connect to Xero"
      switch (xeroError) {
        case 'access_denied':
          errorMessage = "Xero authorization was denied"
          break
        case 'invalid_state':
          errorMessage = "Security validation failed. Please try again."
          break
        case 'token_exchange_failed':
          errorMessage = "Failed to complete Xero authorization"
          break
        default:
          errorMessage = `Xero connection error: ${xeroError}`
      }
      setMessage({ type: "error", text: errorMessage })
      // Clean up URL
      router.replace('/profile')
    }
  }, [user, profile, router, searchParams])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsUpdating(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", profile.id)

      if (error) throw error

      setMessage({ type: "success", text: "Profile updated successfully!" })

      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      // Handle error silently
      setMessage({ type: "error", text: "Failed to update profile. Please try again." })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    )
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
          <div className="max-w-4xl mx-auto">
            {/* Profile Card */}
            <div className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile</h2>
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
                  Profile Features Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  We're building enhanced profile customization and settings for your account.
                </p>
              </div>
            </div>

            {/* Profile Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Info Card */}
              <div className="lg:col-span-1">
                <Card className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 border-gray-200/60 dark:border-gray-700/60">
                  <CardHeader className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {(profile.full_name || profile.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <CardTitle className="text-gray-900 dark:text-white">
                      {profile.full_name || 'Unnamed User'}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {profile.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Role:</span>
                      <Badge
                        className={profile.role === "admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                        }
                      >
                        {profile.role === "admin" ? "👑 Admin" : "👤 User"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Joined:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="text-sm text-green-600 dark:text-green-400">✅ Active</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Edit Profile Form */}
              <div className="lg:col-span-2">
                <Card className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 border-gray-200/60 dark:border-gray-700/60">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">✏️</span>
                      </div>
                      <div>
                        <CardTitle className="text-gray-900 dark:text-white">Edit Profile</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          Update your personal information
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-900 dark:text-white">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="bg-gray-100/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Email cannot be changed at this time
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-900 dark:text-white">
                          Full Name
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-white/70 dark:bg-gray-800/70 border-gray-200/60 dark:border-gray-700/60"
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Coming Soon Features */}
                      <div className="space-y-4 p-4 bg-gray-100/70 dark:bg-gray-700/70 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          🚧 Coming Soon Features
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <div>📱 Phone Number</div>
                          <div>🏢 Company Name</div>
                          <div>📍 Location</div>
                          <div>💼 Job Title</div>
                          <div>🖼️ Profile Picture</div>
                          <div>🔔 Notifications</div>
                        </div>
                      </div>

                      {/* Message Display */}
                      {message && (
                        <div className={`p-4 rounded-lg ${message.type === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                          }`}>
                          {message.text}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <Button
                          type="submit"
                          disabled={isUpdating}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                          {isUpdating ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Updating...
                            </div>
                          ) : (
                            "💾 Save Changes"
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFullName(profile.full_name || "")}
                          className="bg-white/50 hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 border-gray-200/60 dark:border-gray-700/60"
                        >
                          Reset
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Xero Integration Section */}
            <div className="mt-8">
              <Card className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 border-gray-200/60 dark:border-gray-700/60">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🔗</span>
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Xero Integration</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Connect your Xero account to access financial data
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {xeroLoading ? (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Checking connection status...
                    </div>
                  ) : xeroConnection ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          ✅ Connected
                        </Badge>
                        {xeroConnection.is_expired && (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                            ⚠️ Token Expired
                          </Badge>
                        )}
                      </div>

                      {xeroConnection.org_name && (
                        <div className="p-4 bg-gray-100/70 dark:bg-gray-700/70 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Organization:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {xeroConnection.org_name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Connected:</span>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {new Date(xeroConnection.connected_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Token Expires:</span>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {new Date(xeroConnection.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => window.open('/api/xero/invoices', '_blank')}
                          className="bg-white/50 hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 border-gray-200/60 dark:border-gray-700/60"
                        >
                          📄 View Invoices
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/api/xero/contacts', '_blank')}
                          className="bg-white/50 hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 border-gray-200/60 dark:border-gray-700/60"
                        >
                          👥 View Contacts
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDisconnectXero}
                          className="ml-auto"
                        >
                          🔌 Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        Connect your Xero account to automatically sync invoices, contacts, and other financial data.
                      </p>

                      <div className="p-4 bg-blue-50/70 dark:bg-blue-900/20 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                          🔐 Secure Integration
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                          <li>• Read-only access to your Xero data</li>
                          <li>• Encrypted token storage</li>
                          <li>• Automatic token refresh</li>
                          <li>• Disconnect anytime</li>
                        </ul>
                      </div>

                      <Button
                        onClick={handleConnectXero}
                        disabled={isConnectingXero}
                        className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                      >
                        {isConnectingXero ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Connecting...
                          </div>
                        ) : (
                          "🔗 Connect to Xero"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}