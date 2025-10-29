"use client"

import { useState } from "react"
import { Navbar } from "@/components/navigation/navbar"
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuthContext } from "@/components/auth/auth-provider"

export default function FeaturesPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user } = useAuthContext()

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    return (
        <div className="min-h-screen bg-background dark:bg-gray-900/50">
            <Navbar />
            {user && (
                <>
                    <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
                    <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />
                </>
            )}

            <main className={`${user ? 'md:ml-64' : ''} pt-6 transition-all duration-300`}>
                <div className="container mx-auto px-6 py-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Features Card */}
                        <div className="bg-card/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl border border-border dark:border-gray-700/60 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-foreground dark:text-white">Features</h2>
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
                                <h3 className="text-2xl font-bold text-foreground dark:text-white mt-6 mb-2">
                                    Features Coming Soon
                                </h3>
                                <p className="text-muted-foreground dark:text-gray-400 max-w-md mx-auto">
                                    We're building powerful features and tools for your construction management needs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}