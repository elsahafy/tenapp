'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Get initial user
    async function getCurrentUser() {
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        setUser(currentUser)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get user'))
      } finally {
        setLoading(false)
      }
    }
    
    getCurrentUser()

    // Listen for auth state changes
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      authListener.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}
