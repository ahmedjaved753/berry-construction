"use client"

import { useState } from "react"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ProjectsPage() {
    const { user, profile } = useAuthContext()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    // Sample project data
    const projects = [
        {
            id: 1,
            name: "Modern Office Complex",
            description: "A state-of-the-art office building with sustainable features",
            status: "In Progress",
            progress: 65,
            startDate: "2024-01-15",
            estimatedCompletion: "2024-08-30",
            budget: "$2.5M",
            location: "Downtown District"
        },
        {
            id: 2,
            name: "Residential Tower",
            description: "Luxury residential tower with 200 units",
            status: "Planning",
            progress: 15,
            startDate: "2024-03-01",
            estimatedCompletion: "2025-06-15",
            budget: "$15M",
            location: "Riverside Area"
        },
        {
            id: 3,
            name: "Bridge Renovation",
            description: "Complete renovation of the historic city bridge",
            status: "Completed",
            progress: 100,
            startDate: "2023-09-01",
            estimatedCompletion: "2024-01-30",
            budget: "$800K",
            location: "City Center"
        }
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            case 'Planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Please sign in to view projects
                        </h1>
                        <Button onClick={() => window.location.href = '/auth/login'}>
                            Sign In
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
            <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

            {/* Main Content */}
            <main className="md:ml-64 min-h-screen flex items-center justify-center p-6 transition-all duration-300">
                <div className="container mx-auto px-6 py-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Projects Card */}
                        <div className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Projects</h2>
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
