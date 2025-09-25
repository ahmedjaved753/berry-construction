"use client"

import { useState } from "react"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
    isOpen: boolean
    onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const { user, profile } = useAuthContext()
    const pathname = usePathname()

    // Only show sidebar if user exists (profile can be loading)
    if (!user) return null

    const isAdmin = profile?.role === 'admin'

    // Navigation items based on user role
    const navigationItems = [
        // Home available to all users
        {
            href: "/",
            label: "Home",
            icon: "🏠",
            description: "Dashboard home",
            available: true
        },
        // Projects available to all users
        {
            href: "/projects",
            label: "Projects",
            icon: "📋",
            description: "View and manage projects",
            available: true
        },
        // Admin-only items
        {
            href: "/admin-dashboard",
            label: "Admin Dashboard",
            icon: "👑",
            description: "Admin panel and settings",
            available: isAdmin
        },
        {
            href: "/admin-dashboard/users",
            label: "User Management",
            icon: "👥",
            description: "Manage system users",
            available: isAdmin
        }
    ].filter(item => item.available)

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-md border-r border-gray-200/60 dark:bg-gray-950/80 dark:border-gray-800/60 z-50 transition-transform duration-300 ease-in-out w-64 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* User info section */}
                    <div className="p-6 border-b border-gray-200/60 dark:border-gray-800/60">
                        <div className="flex items-center justify-between">
                            {profile ? (
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-white font-semibold">
                                            {(profile.full_name || profile.email || user.email || 'U')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {profile.full_name || user.email || 'User'}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {profile.email || user.email}
                                            </span>
                                            {isAdmin && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                                    </div>
                                </div>
                            )}

                            {/* Close button for mobile */}
                            <button
                                onClick={onToggle}
                                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
                            >
                                <div className="w-5 h-5 relative">
                                    <span className="absolute h-0.5 w-5 bg-gray-600 dark:bg-gray-300 transform rotate-45 top-2.5" />
                                    <span className="absolute h-0.5 w-5 bg-gray-600 dark:bg-gray-300 transform -rotate-45 top-2.5" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                                Navigation
                            </div>

                            {navigationItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => {
                                            // Close mobile menu when navigating
                                            if (window.innerWidth < 768) {
                                                onToggle()
                                            }
                                        }}
                                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                            ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 shadow-sm"
                                            : "text-gray-700 hover:text-purple-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:text-purple-300 dark:hover:bg-purple-950/20"
                                            }`}
                                    >
                                        <span className={`text-lg transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"
                                            }`}>
                                            {item.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate">{item.label}</div>
                                            <div className={`text-xs truncate ${isActive
                                                ? "text-purple-600 dark:text-purple-400"
                                                : "text-gray-500 dark:text-gray-400"
                                                }`}>
                                                {item.description}
                                            </div>
                                        </div>
                                        {isActive && (
                                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200/60 dark:border-gray-800/60">
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Berry Construction
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                            v1.0.0
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}

// Toggle button for mobile sidebar
export function SidebarToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
    // Only show when sidebar is closed (for opening it)
    if (isOpen) return null

    return (
        <Button
            onClick={onToggle}
            variant="default"
            size="sm"
            className="md:hidden fixed top-20 left-4 z-50 bg-purple-600 hover:bg-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 flex items-center px-4 py-2.5 rounded-lg"
        >
            <div className="w-4 h-4 relative flex-shrink-0">
                <span className="absolute h-0.5 w-4 bg-current transform rotate-0 top-1" />
                <span className="absolute h-0.5 w-4 bg-current transform top-2" />
                <span className="absolute h-0.5 w-4 bg-current transform rotate-0 top-3" />
            </div>
            <span className="text-sm font-medium ml-3">
                Menu
            </span>
        </Button>
    )
}
