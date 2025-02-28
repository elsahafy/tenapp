'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']
type Category = Tables['categories']['Row']

interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  transactions: Transaction[]
}

interface TransactionStats {
  totalIncome: number
  totalExpenses: number
  netIncome: number
  categoryBreakdown: Record<string, number>
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    categoryBreakdown: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get current date at start of day
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      // Fetch transactions including future ones
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (transactionError) throw transactionError

      // Fetch recurring transactions and generate future occurrences
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .gte('next_occurrence', now.toISOString())
        .order('next_occurrence', { ascending: true })

      if (recurringError) throw recurringError

      // Combine regular and future recurring transactions
      const allTransactions = [
        ...(transactionData || []),
        ...(recurringData || []).map(rt => ({
          id: `future_${rt.id}_${rt.next_occurrence}`,
          date: rt.next_occurrence,
          description: `${rt.description} (Recurring)`,
          amount: rt.amount,
          type: rt.type,
          account_id: rt.account_id,
          category_id: rt.category_id,
          user_id: rt.user_id,
          created_at: rt.created_at,
          updated_at: rt.updated_at,
          is_future: true
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setTransactions(allTransactions)

      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)

      if (categoryError) throw categoryError

      setCategories(categoryData || [])

      // Calculate statistics
      if (allTransactions) {
        const income = allTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const expenses = allTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        const breakdown: Record<string, number> = {}
        const categoryTransactions: Record<string, Transaction[]> = {}
        
        allTransactions.forEach(t => {
          if (t.category_id) {
            const category = categoryData?.find(c => c.id === t.category_id)
            if (category) {
              const categoryName = category.name
              breakdown[categoryName] = (breakdown[categoryName] || 0) + Math.abs(t.amount)
              categoryTransactions[categoryName] = categoryTransactions[categoryName] || []
              categoryTransactions[categoryName].push(t)
            }
          }
        })

        // Calculate total for percentages
        const total = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0)

        // Create category breakdown array
        const breakdownArray = Object.entries(breakdown).map(([category, amount]) => ({
          category,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          transactions: categoryTransactions[category] || []
        }))

        setStats({
          totalIncome: income,
          totalExpenses: expenses,
          netIncome: income - expenses,
          categoryBreakdown: breakdown
        })

        setCategoryBreakdown(breakdownArray)
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const refetch = () => {
    return fetchTransactions()
  }

  return {
    transactions,
    categories,
    categoryBreakdown,
    stats,
    isLoading,
    error,
    refetch
  }
}
