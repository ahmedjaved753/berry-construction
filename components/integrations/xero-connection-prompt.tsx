"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import { useAuthContext } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import {
    ExternalLink,
    Zap,
    TrendingUp,
    Shield,
    RefreshCw,
    X,
    ArrowRight,
    CheckCircle
} from "lucide-react"
import { useRouter } from "next/navigation"

interface XeroConnectionPromptProps {
    variant?: "banner" | "card" | "inline"
    context?: "projects" | "dashboard" | "reports" | "general"
    onDismiss?: () => void
    className?: string
}

// Helper function to get authenticated headers
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

export default function XeroConnectionPrompt({
    variant = "card",
    context = "general",
    onDismiss,
    className = ""
}: XeroConnectionPromptProps) {
    const router = useRouter()
    const { user, profile, loading } = useAuthContext()
    const [isConnected, setIsConnected] = useState<boolean | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)
    const isAdmin = profile?.role === 'admin'

    useEffect(() => {
        if (user && !loading) {
            checkXeroConnection()
        }
    }, [user, loading])

    const checkXeroConnection = async () => {
        if (!user) return

        try {
            const headers = await getAuthHeaders()
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/xero-connection`, {
                headers
            })
            const data = await response.json()
            setIsConnected(data.connected)
        } catch (error) {
            console.error('Error checking Xero connection:', error)
            setIsConnected(false)
        }
    }

    const handleConnect = async () => {
        setIsConnecting(true)

        try {
            const response = await fetch('/api/xero/connect', {
                method: 'POST'
            })
            const data = await response.json()

            if (data.authUrl) {
                window.location.href = data.authUrl
            } else {
                setIsConnecting(false)
            }
        } catch (error) {
            console.error('Error connecting to Xero:', error)
            setIsConnecting(false)
        }
    }

    const handleDismiss = () => {
        setIsDismissed(true)
        onDismiss?.()
    }

    // Don't show if user is not loaded, is connecting, already connected, has dismissed, or is not admin
    if (loading || isConnecting || isConnected || isDismissed || !user || !isAdmin) {
        return null
    }

    // Context-specific content
    const getContextContent = () => {
        switch (context) {
            case "projects":
                return {
                    title: "Sync Project Data with Xero",
                    description: "Connect Xero to automatically sync project invoices, expenses, and financial data for better project tracking.",
                    benefits: ["Track project profitability", "Sync invoices automatically", "Better financial insights"]
                }
            case "dashboard":
                return {
                    title: "Complete Your Setup",
                    description: "Connect Xero to unlock powerful financial insights and automated data syncing for your business.",
                    benefits: ["Real-time financial data", "Automated sync", "Better reporting"]
                }
            case "reports":
                return {
                    title: "Connect Xero for Financial Reports",
                    description: "Get comprehensive financial reports and analytics by connecting your Xero accounting data.",
                    benefits: ["Detailed financial reports", "Real-time data", "Advanced analytics"]
                }
            default:
                return {
                    title: "Connect Your Xero Account",
                    description: "Sync your financial data to get the most out of your business management platform.",
                    benefits: ["Automated data sync", "Better insights", "Save time"]
                }
        }
    }

    const content = getContextContent()

    if (variant === "banner") {
        return (
            <Alert className={`border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 ${className}`}>
                <Zap className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between pr-6">
                    <span>
                        <strong>Connect Xero</strong> to unlock automated data syncing and better insights.
                    </span>
                    <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" onClick={handleConnect} disabled={isConnecting}>
                            {isConnecting ? (
                                <>
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                "Connect Now"
                            )}
                        </Button>
                        {onDismiss && (
                            <Button variant="ghost" size="sm" onClick={handleDismiss}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </AlertDescription>
            </Alert>
        )
    }

    if (variant === "inline") {
        return (
            <div className={`flex items-center gap-4 p-4 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 rounded-lg ${className}`}>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                            Connect Xero
                        </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        {content.description}
                    </p>
                </div>
                <Button onClick={handleConnect} disabled={isConnecting} size="sm">
                    {isConnecting ? (
                        <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            Connect
                            <ArrowRight className="w-3 h-3 ml-1" />
                        </>
                    )}
                </Button>
            </div>
        )
    }

    // Default card variant
    return (
        <Card className={`border-blue-200 dark:border-blue-800 ${className}`}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                        </div>
                        <div>
                            <CardTitle className="text-lg">{content.title}</CardTitle>
                            <CardDescription>{content.description}</CardDescription>
                        </div>
                    </div>
                    {onDismiss && (
                        <Button variant="ghost" size="sm" onClick={handleDismiss}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-4">
                    {/* Benefits */}
                    <div className="grid gap-2">
                        {content.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="flex-1"
                        >
                            {isConnecting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting to Xero...
                                </>
                            ) : (
                                <>
                                    Connect Xero Account
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/integrations')}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Learn More
                        </Button>
                    </div>

                    {/* Trust indicator */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            Secure connection • Read-only access • Disconnect anytime
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


