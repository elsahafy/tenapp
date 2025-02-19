'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
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

      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (transactionError) throw transactionError

      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)

      if (categoryError) throw categoryError

      setTransactions(transactionData || [])
      setCategories(categoryData || [])

      // Calculate statistics
      if (transactionData) {
        const income = transactionData
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const expenses = transactionData
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        const breakdown: Record<string, number> = {}
        const categoryTransactions: Record<string, Transaction[]> = {}
        
        transactionData.forEach(t => {
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
