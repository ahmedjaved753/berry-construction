"use client"

import { useAuth } from "@/lib/auth/hooks"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: "user" | "admin"
  fallback?: ReactNode
}

export function ProtectedRoute({ children, requiredRole, fallback }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (requiredRole && profile?.role !== requiredRole) {
        // Redirect based on actual role
        if (profile?.role === "admin") {
          router.push("/admin-dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    }
  }, [user, profile, loading, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return fallback || null
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return fallback || null
  }

  return <>{children}</>
}
