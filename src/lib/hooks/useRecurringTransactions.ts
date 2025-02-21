import { useEffect, useState } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Database } from '@/types/database.types'
import { RecurringTransactionWithDetails } from '@/types/recurring'

export function useRecurringTransactions() {
  const supabase = useSupabaseClient<Database>()
  const user = useUser()
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransactionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRecurringTransactions = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          account:accounts(id, name),
          category:categories(id, name),
          transfer_account:accounts(id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRecurringTransactions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recurring transactions'))
    } finally {
      setIsLoading(false)
    }
  }

  const addRecurringTransaction = async (transaction: Omit<RecurringTransactionWithDetails, 'id' | 'created_at'>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .insert([{
          ...transaction,
          amount: transaction.type === 'expense' ? -Math.abs(transaction.amount) : transaction.amount,
          user_id: user.id
        }])

      if (error) throw error

      await fetchRecurringTransactions()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add recurring transaction')
    }
  }

  const toggleRecurringTransaction = async (id: string, active: boolean) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchRecurringTransactions()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to toggle recurring transaction')
    }
  }

  const deleteRecurringTransaction = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchRecurringTransactions()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete recurring transaction')
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecurringTransactions()
    }
  }, [user])

  return {
    recurringTransactions,
    isLoading,
    error,
    addRecurringTransaction,
    toggleRecurringTransaction,
    deleteRecurringTransaction,
    refetch: fetchRecurringTransactions
  }
}
