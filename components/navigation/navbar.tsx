"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const { user, profile } = useAuthContext()
    const router = useRouter()
    const supabase = createClient()

    // Handle scroll effect for navbar shadow
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            router.push("/auth/login")
        } catch (error) {
            // Handle logout error silently
        } finally {
            setIsLoggingOut(false)
        }
    }

    const toggleMenu = () => {
        setIsOpen(!isOpen)
    }

    const closeMenu = () => {
        setIsOpen(false)
    }

    // Navigation links moved to sidebar - navbar now focuses on branding and auth

    return (
        <nav className={`sticky top-0 z-50 w-full transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-200/60 dark:bg-gray-950/80 dark:border-gray-800/60 ${isScrolled ? "shadow-sm" : ""
            }`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                                <span className="text-white font-bold text-sm">BC</span>
                            </div>
                            <span className="font-semibold text-lg text-gray-900 dark:text-white">
                                Berry Construction
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation removed - links moved to sidebar */}

                    {/* Right side - Auth buttons or User info */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                {/* User info */}
                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {profile?.full_name || 'User'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {profile?.role === 'admin' ? '👑 Admin' : '👤 User'}
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                        <span className="text-white font-medium text-sm">
                                            {(profile?.full_name || profile?.email || 'U')[0].toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Logout button */}
                                <Button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                                >
                                    {isLoggingOut ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            <span>Logging out</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <span>🔓</span>
                                            <span>Logout</span>
                                        </div>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push("/auth/login")}
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                >
                                    Sign In
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => router.push("/auth/signup")}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6"
                                >
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-2 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <div className="w-6 h-6 relative">
                                <span
                                    className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ${isOpen ? "rotate-45 top-3" : "rotate-0 top-1"
                                        }`}
                                />
                                <span
                                    className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 top-3 ${isOpen ? "opacity-0" : "opacity-100"
                                        }`}
                                />
                                <span
                                    className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ${isOpen ? "-rotate-45 top-3" : "rotate-0 top-5"
                                        }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu - Auth only */}
            <div
                className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    } overflow-hidden bg-white/95 backdrop-blur-md dark:bg-gray-950/95 border-t border-gray-200/60 dark:border-gray-800/60`}
            >
                <div className="px-2 pt-2 pb-3">
                    {/* Mobile auth section - navigation links moved to sidebar */}
                    <div className="pt-2">
                        {user ? (
                            <div className="space-y-3">
                                <div className="px-3 py-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-medium text-sm">
                                                {(profile?.full_name || profile?.email || 'U')[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {profile?.full_name || 'User'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {profile?.role === 'admin' ? '👑 Admin' : '👤 User'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    variant="ghost"
                                    className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-950/20"
                                >
                                    {isLoggingOut ? "Logging out..." : "🔓 Logout"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        router.push("/auth/login")
                                        closeMenu()
                                    }}
                                    className="w-full justify-start"
                                >
                                    Sign In
                                </Button>
                                <Button
                                    onClick={() => {
                                        router.push("/auth/signup")
                                        closeMenu()
                                    }}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                >
                                    Get Started
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
