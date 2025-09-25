export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: "user" | "admin"
  created_at: string
  updated_at: string
}

export type UserRole = "user" | "admin"

export interface AuthUser {
  id: string
  email: string
  created_at: string
}

export interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: any }>
  isAdmin: boolean
  isUser: boolean
  refetchProfile: () => void
}
