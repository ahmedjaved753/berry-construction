"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuthContext } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

export function UserNav() {
  const { user, profile, signOut } = useAuthContext()
  const router = useRouter()


  if (!user || !profile) return null

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || profile.email[0].toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.full_name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
            <Badge variant="secondary" className="w-fit text-xs mt-1">
              {profile.role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>Profile Settings</DropdownMenuItem>
        {profile.role === "admin" && (
          <DropdownMenuItem onClick={() => router.push("/admin-dashboard")}>Admin Dashboard</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => router.push("/")}>Home</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            if (signOut) {
              await signOut()
            }
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
