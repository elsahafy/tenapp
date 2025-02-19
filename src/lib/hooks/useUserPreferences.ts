import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'

type CurrencyCode = Database['public']['Enums']['currency_code']

interface UserPreferences {
  preferredCurrency: CurrencyCode
}

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredCurrency: 'AED'
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (mounted) {
            setLoading(false)
          }
          return
        }

        // Fetch user preferences
        const { data: prefsData, error: prefsError } = await supabase
          .from('user_preferences')
          .select('preferred_currency')
          .eq('user_id', user.id)
          .single()

        if (prefsError) {
          // If no preferences found, create default preferences
          if (prefsError.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('user_preferences')
              .insert({
                user_id: user.id,
                preferred_currency: DEFAULT_PREFERENCES.preferredCurrency
              })

            if (insertError) throw insertError

            if (mounted) {
              setPreferences(DEFAULT_PREFERENCES)
            }
          } else {
            throw prefsError
          }
        } else if (prefsData && mounted) {
          setPreferences({
            preferredCurrency: prefsData.preferred_currency
          })
        }
      } catch (err) {
        console.error('Error fetching preferences:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchPreferences()

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      mounted = false
    }
  }, [])

  const updatePreferredCurrency = async (currency: CurrencyCode) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_currency: currency
        })

      if (error) throw error

      setPreferences(prev => ({
        ...prev,
        preferredCurrency: currency
      }))
    } catch (err) {
      console.error('Error updating preferred currency:', err)
      throw err
    }
  }

  return {
    preferences,
    loading,
    error,
    updatePreferredCurrency
  }
}
