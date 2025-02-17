'use client'

import { useState, useEffect } from 'react'
import * as transactionService from '../services/transactionService'
import type { Transaction } from '../types/database'

interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  transactions: Transaction[]
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await transactionService.getTransactions()
        setTransactions(data)
        
        // Group transactions by category
        const categories = data.reduce<Record<string, Transaction[]>>((acc, transaction) => {
          const category = transaction.category_name || 'Uncategorized'
          acc[category] = [...(acc[category] || []), transaction]
          return acc
        }, {})

        // Calculate totals and percentages
        const total = data.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        const breakdown = Object.entries(categories).map(([category, txns]) => ({
          category,
          amount: txns.reduce((sum, t) => sum + Math.abs(t.amount), 0),
          percentage: (txns.reduce((sum, t) => sum + Math.abs(t.amount), 0) / total) * 100,
          transactions: txns
        }))

        setCategoryBreakdown(breakdown)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { transactions, categoryBreakdown, loading }
}
