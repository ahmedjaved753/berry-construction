"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, AlertCircle, Zap, Shield, TrendingUp, Clock, ArrowRight, RefreshCw } from "lucide-react"

interface XeroConnection {
    id: string
    org_name?: string
    tenant_name?: string
    connected_at: string
    expires_at: string
    last_refreshed_at: string
    is_expired: boolean
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

export default function IntegrationsPage() {
    const router = useRouter()
    const { user, profile, loading } = useAuthContext()
    const [xeroConnection, setXeroConnection] = useState<XeroConnection | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [connectionLoading, setConnectionLoading] = useState(true)
    const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
    const [syncStatus, setSyncStatus] = useState<any>(null)
    const isAdmin = profile?.role === 'admin'

    useEffect(() => {
        if (user && !loading) {
            checkXeroConnection()
            checkSyncStatus()
        }
    }, [user, loading])

    // Check for OAuth callback messages
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('xero_connected') === 'true') {
            setMessage({ type: "success", text: "🎉 Successfully connected to Xero!" })
            setTimeout(() => setMessage(null), 5000)
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
        } else if (urlParams.get('xero_error')) {
            const error = urlParams.get('xero_error')
            setMessage({ type: "error", text: `Connection failed: ${error}` })
            setTimeout(() => setMessage(null), 8000)
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
        }
    }, [])

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

    const handleConnectXero = async () => {
        setIsConnecting(true)
        setMessage(null)

        try {
            const response = await fetch('/api/xero/connect', {
                method: 'POST'
            })
            const data = await response.json()

            if (data.authUrl) {
                // Show connecting message and redirect
                setMessage({ type: "info", text: "Redirecting to Xero..." })
                setTimeout(() => {
                    window.location.href = data.authUrl
                }, 1000)
            } else {
                setMessage({ type: "error", text: "Failed to initiate Xero connection" })
                setIsConnecting(false)
            }
        } catch (error) {
            console.error('Error connecting to Xero:', error)
            setMessage({ type: "error", text: "Failed to connect to Xero" })
            setIsConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect from Xero? This will stop automatic data syncing.')) {
            return
        }

        try {
            const headers = await getAuthHeaders()
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/xero-connection`, {
                method: 'DELETE',
                headers
            })

            if (response.ok) {
                setXeroConnection(null)
                setSyncStatus(null)
                setMessage({ type: "success", text: "Successfully disconnected from Xero" })
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: "error", text: "Failed to disconnect from Xero" })
            }
        } catch (error) {
            console.error('Error disconnecting Xero:', error)
            setMessage({ type: "error", text: "Failed to disconnect from Xero" })
        }
    }

    if (loading || connectionLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-secondary rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-secondary rounded w-2/3 mb-8"></div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="h-64 bg-secondary rounded-lg"></div>
                            <div className="h-64 bg-secondary rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
                    <p className="text-muted-foreground mb-4">You need to be logged in to manage integrations.</p>
                    <Button onClick={() => router.push('/auth/login')}>Log In</Button>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <p className="text-muted-foreground mb-4">Only administrators can access integrations.</p>
                    <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">
                        Integrations
                    </h1>
                    <p className="text-muted-foreground dark:text-gray-400">
                        Connect your business tools to streamline your workflow and get better insights.
                    </p>
                </div>

                {/* Status Messages */}
                {message && (
                    <Alert className={`mb-6 ${message.type === "success"
                            ? "border-green-200 bg-green-50 dark:bg-green-950/30 text-green-800 dark:border-green-800 dark:text-green-200"
                            : message.type === "error"
                                ? "border-red-200 bg-red-50 dark:bg-red-950/30 text-red-800 dark:border-red-800 dark:text-red-200"
                                : "border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:border-blue-800 dark:text-blue-200"
                        }`}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>
                            {message.type === "success" ? "Success" : message.type === "error" ? "Error" : "Info"}
                        </AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                {/* Xero Integration Card */}
                <div className="grid gap-6">
                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                        <CardHeader className="relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Xero Accounting</CardTitle>
                                        <CardDescription>
                                            Sync your financial data, invoices, and customer information
                                        </CardDescription>
                                    </div>
                                </div>

                                {xeroConnection ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Connected
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-secondary text-foreground border-border dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                                        Not Connected
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="relative">
                            {!xeroConnection ? (
                                <div className="space-y-6">
                                    {/* Admin-only notice for non-admins */}
                                    {!isAdmin && (
                                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm">
                                                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                        Admin Connection Required
                                                    </p>
                                                    <p className="text-blue-700 dark:text-blue-300 text-xs">
                                                        Only administrators can connect to Xero. Once connected, all users will have access to the synced financial data.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Benefits Section */}
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm">Automatic Sync</h4>
                                                <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                    Keep your data up-to-date automatically
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-green-50 dark:bg-green-950/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm">Better Insights</h4>
                                                <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                    Get detailed financial analytics
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-50 dark:bg-purple-950/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm">Secure & Safe</h4>
                                                <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                    Bank-level security standards
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection CTA - Admin Only */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border dark:border-gray-800">
                                        {isAdmin ? (
                                            <>
                                                <Button
                                                    onClick={handleConnectXero}
                                                    disabled={isConnecting}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    {isConnecting ? (
                                                        <>
                                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                            Connecting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Connect to Xero
                                                            <ArrowRight className="w-4 h-4 ml-2" />
                                                        </>
                                                    )}
                                                </Button>
                                                <Button variant="outline" onClick={() => router.push('/features')}>
                                                    Learn More
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="w-full text-center p-4 bg-secondary dark:bg-gray-900 rounded-lg">
                                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                                    Contact your administrator to connect Xero
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                    Your data is secure
                                                </p>
                                                <p className="text-blue-700 dark:text-blue-300 text-xs">
                                                    We use read-only access and never store sensitive financial data.
                                                    You can disconnect anytime.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Connection Details */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <h4 className="font-medium text-sm text-muted-foreground dark:text-gray-400 mb-1">
                                                Organization
                                            </h4>
                                            <p className="text-lg font-medium">
                                                {xeroConnection.org_name || xeroConnection.tenant_name || 'Unknown'}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm text-muted-foreground dark:text-gray-400 mb-1">
                                                Connected Since
                                            </h4>
                                            <p className="text-lg font-medium">
                                                {new Date(xeroConnection.connected_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sync Status */}
                                    {syncStatus && (
                                        <div className="bg-secondary dark:bg-gray-900 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Data Sync Status
                                                </h4>
                                                {syncStatus.lastSync && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Last: {new Date(syncStatus.lastSync).toLocaleString()}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-blue-600">{syncStatus.dataCounts?.invoices || 0}</div>
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400">Invoices</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-purple-600">{syncStatus.dataCounts?.departments || 0}</div>
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400">Departments</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-orange-600">{syncStatus.dataCounts?.stages || 0}</div>
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400">Stages</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-green-600">{syncStatus.dataCounts?.lineItems || 0}</div>
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400">Line Items</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border dark:border-gray-800">
                                        <Button variant="outline" onClick={() => router.push('/projects')}>
                                            View Projects
                                        </Button>
                                        <Button variant="outline" onClick={() => router.push('/')}>
                                            View Dashboard
                                        </Button>
                                        <Button variant="destructive" onClick={handleDisconnect} className="sm:ml-auto">
                                            Disconnect
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Coming Soon Integrations */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* QuickBooks */}
                        <Card className="opacity-60">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">QB</span>
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">QuickBooks</CardTitle>
                                        <CardDescription>Accounting software integration</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Badge variant="secondary" className="mb-3">Coming Soon</Badge>
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    Connect your QuickBooks account for seamless financial data sync.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Stripe */}
                        <Card className="opacity-60">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">S</span>
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Stripe</CardTitle>
                                        <CardDescription>Payment processing integration</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Badge variant="secondary" className="mb-3">Coming Soon</Badge>
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    Sync payment data and customer information from Stripe.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Slack */}
                        <Card className="opacity-60">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">#</span>
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Slack</CardTitle>
                                        <CardDescription>Team communication integration</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Badge variant="secondary" className="mb-3">Coming Soon</Badge>
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    Get project notifications and updates in your Slack channels.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}


