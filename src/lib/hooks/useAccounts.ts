'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']

interface UseAccountsResult {
  accounts: Account[] | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAccounts(): UseAccountsResult {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAccounts(null)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')

      if (fetchError) throw fetchError
      setAccounts(data as Account[])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch accounts'))
      setAccounts(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts
  }
}
