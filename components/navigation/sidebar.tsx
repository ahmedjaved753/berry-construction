"use client"

import React, { useState, useEffect } from "react"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
    isOpen: boolean
    onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const { user, profile, signOut, isLoggingOut, profileLoading } = useAuthContext()
    const pathname = usePathname()

    // Only show sidebar if user exists (profile can be loading)
    if (!user) return null

    const isAdmin = profile?.role === 'admin'

    // Set CSS custom property for dynamic viewport height to handle mobile browser UI
    useEffect(() => {
        const setVH = () => {
            const vh = window.innerHeight * 0.01
            document.documentElement.style.setProperty('--vh', `${vh}px`)
        }

        const debouncedSetVH = () => {
            // Use timeout to ensure browser UI animation is complete
            setTimeout(setVH, 100)
        }

        // Initial set
        setVH()

        // Listen for various events that might change viewport
        window.addEventListener('resize', debouncedSetVH)
        window.addEventListener('orientationchange', debouncedSetVH)

        // Listen for scroll events to detect browser UI changes
        let ticking = false
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setVH()
                    ticking = false
                })
                ticking = true
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true })

        return () => {
            window.removeEventListener('resize', debouncedSetVH)
            window.removeEventListener('orientationchange', debouncedSetVH)
            window.removeEventListener('scroll', onScroll)
        }
    }, [])

    // Navigation items based on user role
    const navigationItems = [
        // Integrations - Admin only
        {
            href: "/integrations",
            label: "Integrations",
            icon: "🔗",
            description: "Connect your business tools",
            available: isAdmin
        },
        {
            href: "/expenses",
            label: "Expenses",
            icon: "💰",
            description: "Track department expenses & profitability",
            available: true
        },
        {
            href: "/expenses/daily",
            label: "Daily Snapshot",
            icon: "📅",
            description: "View finances for any day",
            available: true
        },
        {
            href: "/expenses/monthly",
            label: "Monthly Snapshot",
            icon: "📊",
            description: "View finances for any month",
            available: true
        },
        {
            href: "/expenses/yearly",
            label: "Yearly Snapshot",
            icon: "📈",
            description: "View finances for any year",
            available: true
        },
        // Admin-only items
        {
            href: "/admin-dashboard",
            label: "Admin Dashboard",
            icon: "👑",
            description: "Admin panel and settings",
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

            {/* Sidebar - Mobile browser UI adaptive */}
            <aside
                className={`fixed left-0 top-0 bg-card/80 backdrop-blur-md border-r border-border dark:bg-gray-950/80 dark:border-gray-800/60 z-50 transition-transform duration-300 ease-in-out w-64 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    }`}
                style={{
                    // Dynamic height that adapts to mobile browser UI changes
                    height: 'calc(var(--vh, 1vh) * 100)',
                    maxHeight: 'calc(var(--vh, 1vh) * 100)',
                    minHeight: 'calc(var(--vh, 1vh) * 100)'
                }}
            >
                <div className="flex flex-col h-full overflow-hidden" style={{ maxHeight: 'calc(var(--vh, 1vh) * 100)' }}>
                    {/* Header with close button - Fixed */}
                    <div className="flex-shrink-0 px-4 py-3 border-b border-border dark:border-gray-800/60 flex items-center justify-between">
                        <div className="text-lg font-bold text-foreground dark:text-white">
                            Berry Construction
                        </div>
                        {/* Close button for mobile */}
                        <button
                            onClick={onToggle}
                            className="md:hidden p-2 rounded-lg hover:bg-accent dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
                        >
                            <div className="w-5 h-5 relative">
                                <span className="absolute h-0.5 w-5 bg-gray-600 dark:bg-gray-300 transform rotate-45 top-2.5" />
                                <span className="absolute h-0.5 w-5 bg-gray-600 dark:bg-gray-300 transform -rotate-45 top-2.5" />
                            </div>
                        </button>
                    </div>

                    {/* Navigation - Scrollable */}
                    <nav className="flex-1 overflow-y-auto px-4 py-2 min-h-0" style={{ scrollbarWidth: 'thin' }}>
                        <div className="space-y-2 pb-2">
                            <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wider px-3 py-1">
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
                                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
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
                                                : "text-muted-foreground dark:text-gray-400"
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

                    {/* User info and logout section - Fixed at bottom */}
                    <div className="flex-shrink-0 px-4 py-2 pb-6 md:pb-4 border-t border-border dark:border-gray-800/60 space-y-2">
                        {user ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-white font-semibold text-sm">
                                        {/* OPTIMIZED: Use email immediately, fallback to profile name when loaded */}
                                        {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* OPTIMIZED: Show user email immediately, upgrade to full name when profile loads */}
                                    <div className="text-sm font-semibold text-foreground dark:text-white truncate">
                                        {profile?.full_name || user.email?.split('@')[0] || 'User'}
                                        {profileLoading && !profile?.full_name && (
                                            <span className="ml-2 inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                                            {user.email}
                                        </span>
                                        {/* OPTIMIZED: Show admin badge immediately when profile loads */}
                                        {profile?.role === 'admin' ? (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                                Admin
                                            </span>
                                        ) : profileLoading ? (
                                            <div className="w-12 h-4 bg-secondary dark:bg-gray-700 rounded animate-pulse"></div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-secondary dark:bg-gray-700 rounded-full animate-pulse"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-secondary dark:bg-gray-700 rounded animate-pulse"></div>
                                    <div className="h-3 bg-secondary dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                                </div>
                            </div>
                        )}

                        {/* Logout button */}
                        <button
                            onClick={signOut}
                            disabled={isLoggingOut}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg transition-colors duration-200 border border-red-200 dark:border-red-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoggingOut ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Logging out...</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm">🔓</span>
                                    <span className="text-sm font-medium">Logout</span>
                                </>
                            )}
                        </button>

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
            className="md:hidden fixed top-4 left-4 z-50 bg-purple-600 hover:bg-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 flex items-center px-4 py-2.5 rounded-lg"
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
