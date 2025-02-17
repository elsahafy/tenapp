import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient, User } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UserMetadata {
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  currency?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    success: boolean
  }>
  signUp: (email: string, password: string) => Promise<{
    error: Error | null
    success: boolean
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{
    error: Error | null
    success: boolean
  }>
  updateProfile: (data: UserMetadata) => Promise<{
    error: Error | null
    success: boolean
  }>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN') {
        // Create default notification settings for new users
        if (session?.user) {
          // Create or update user profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email || '',
              first_name: null,
              last_name: null,
              avatar_url: null,
              currency: null,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            })
          if (profileError) console.error('Error setting up profile:', profileError)

          // Create or update notification settings
          const { error: notificationError } = await supabase
            .from('user_notification_settings')
            .upsert({
              user_id: session.user.id,
              email_notifications: true,
              push_notifications: true,
              goal_reminders: true,
              bill_reminders: true,
              budget_alerts: true,
              investment_alerts: true,
              debt_reminders: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          if (notificationError) console.error('Error setting up notifications:', notificationError)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error, success: !error }
    } catch (error) {
      return { error: error as Error, success: false }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error, success: !error }
    } catch (error) {
      return { error: error as Error, success: false }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      return { error, success: !error }
    } catch (error) {
      return { error: error as Error, success: false }
    }
  }

  const updateProfile = async (data: UserMetadata) => {
    try {
      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          updated_at: new Date().toISOString(),
          ...data,
        })

      return { error, success: !error }
    } catch (error) {
      return { error: error as Error, success: false }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
