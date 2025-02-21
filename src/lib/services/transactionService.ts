import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']
type TransactionInsert = Tables['transactions']['Insert']
type TransactionUpdate = Tables['transactions']['Update']

export interface TransactionFilter {
  type?: Transaction['type'] | 'all'
  status?: Transaction['status'] | 'all'
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
  categoryIds?: string[]
  accountIds?: string[]
  minAmount?: number
  maxAmount?: number
  searchTerm?: string
}

interface CategoryBreakdown {
  count: number
  total: number
  percentage: number
  category_name: string
}

export interface TransactionAnalytics {
  totalTransactions: number
  totalAmount: number
  averageAmount: number
  categoryBreakdown: {
    income: CategoryBreakdown[]
    expenses: CategoryBreakdown[]
  }
  monthlyTrend: {
    month: string
    income: number
    expenses: number
    net: number
  }[]
  insights: {
    type: 'spending' | 'saving' | 'income'
    message: string
    data?: any
  }[]
}

export async function getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*, categories(name)')
    .order('date', { ascending: false })

  if (filter) {
    if (filter.startDate) {
      query = query.gte('date', filter.startDate)
    }
    if (filter.endDate) {
      query = query.lte('date', filter.endDate)
    }
    if (filter.type) {
      query = query.eq('type', filter.type)
    }
    if (filter.categoryIds?.length) {
      query = query.in('category_id', filter.categoryIds)
    }
    if (filter.accountIds?.length) {
      query = query.in('account_id', filter.accountIds)
    }
    if (filter.minAmount) {
      query = query.gte('amount', filter.minAmount)
    }
    if (filter.maxAmount) {
      query = query.lte('amount', filter.maxAmount)
    }
    if (filter.searchTerm) {
      query = query.ilike('description', `%${filter.searchTerm}%`)
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTransaction(
  data: Omit<TransactionInsert, 'id' | 'created_at'>
): Promise<Transaction> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data: newTransaction, error } = await supabase
      .from('transactions')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()

    if (error) throw error

    // Update account balance
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', data.account_id)
      .single()

    if (account) {
      let balanceChange = data.amount
      if (data.type === 'withdrawal') {
        balanceChange = -data.amount
      }

      await supabase
        .from('accounts')
        .update({ balance: account.balance + balanceChange })
        .eq('id', data.account_id)
    }

    return newTransaction
  } catch (error) {
    console.error('Error creating transaction:', error)
    throw error
  }
}

export async function updateTransaction(
  id: string,
  updates: Partial<TransactionUpdate>
): Promise<Transaction> {
  // Get the original transaction
  const original = await getTransaction(id)
  if (!original) throw new Error('Transaction not found')

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Update account balance if amount or type changed
  if (updates.amount !== undefined || updates.type !== undefined) {
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', original.account_id)
      .single()

    if (account) {
      // Reverse the original transaction's effect
      let originalBalanceChange = original.amount
      if (original.type === 'withdrawal') {
        originalBalanceChange = -original.amount
      }

      // Apply the new transaction's effect
      let newBalanceChange = updates.amount || original.amount
      if ((updates.type || original.type) === 'withdrawal') {
        newBalanceChange = -(updates.amount || original.amount)
      }

      const netBalanceChange = newBalanceChange - originalBalanceChange

      await supabase
        .from('accounts')
        .update({ balance: account.balance + netBalanceChange })
        .eq('id', original.account_id)
    }
  }

  return data
}

export async function deleteTransaction(id: string): Promise<void> {
  // Get the transaction before deleting
  const transaction = await getTransaction(id)
  if (!transaction) throw new Error('Transaction not found')

  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error

  // Update account balance
  const { data: account } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', transaction.account_id)
    .single()

  if (account) {
    let balanceChange = -transaction.amount
    if (transaction.type === 'withdrawal') {
      balanceChange = transaction.amount
    }

    await supabase
      .from('accounts')
      .update({ balance: account.balance + balanceChange })
      .eq('id', transaction.account_id)
  }
}

function calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const breakdown = new Map<string, { total: number; count: number; name: string }>()
  
  transactions.forEach(t => {
    const categoryId = t.category_id || 'uncategorized'
    const current = breakdown.get(categoryId) || { 
      total: 0, 
      count: 0, 
      name: t.category_name || 'Uncategorized' 
    }
    
    breakdown.set(categoryId, {
      total: current.total + t.amount,
      count: current.count + 1,
      name: current.name
    })
  })

  const total = Array.from(breakdown.values()).reduce((sum, b) => sum + b.total, 0)
  
  return Array.from(breakdown.entries()).map(([_, data]) => ({
    count: data.count,
    total: data.total,
    percentage: total > 0 ? (data.total / total) * 100 : 0,
    category_name: data.name
  }))
}

export async function getTransactionAnalytics(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<TransactionAnalytics> {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .gte('date', startDate || new Date(0).toISOString())
    .lte('date', endDate || new Date().toISOString())

  if (error) throw error
  if (!transactions) return {
    totalTransactions: 0,
    totalAmount: 0,
    averageAmount: 0,
    categoryBreakdown: { income: [], expenses: [] },
    monthlyTrend: [],
    insights: []
  }

  const deposits = transactions.filter(t => t.type === 'deposit')
  const withdrawals = transactions.filter(t => t.type === 'withdrawal')

  const total_income = deposits.reduce((sum, t) => sum + t.amount, 0)
  const total_expenses = withdrawals.reduce((sum, t) => sum + t.amount, 0)

  const income_by_category = calculateCategoryBreakdown(deposits)
  const expense_by_category = calculateCategoryBreakdown(withdrawals)

  type MonthlyData = { income: number; expenses: number; net: number }
  const monthlyMap = new Map<string, MonthlyData>()

  transactions.forEach(t => {
    const month = new Date(t.date).toISOString().substring(0, 7)
    const current = monthlyMap.get(month) || { income: 0, expenses: 0, net: 0 }
    
    if (t.type === 'deposit') {
      current.income += t.amount
    } else if (t.type === 'withdrawal') {
      current.expenses += t.amount
    }
    current.net = current.income - current.expenses
    
    monthlyMap.set(month, current)
  })

  const monthly_trend = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Generate insights
  const insights: TransactionAnalytics['insights'] = []
  
  // Spending pattern insights
  const avgByCategory = new Map<string, number>()
  withdrawals.forEach(t => {
    const categoryId = t.category_id || 'uncategorized'
    const current = avgByCategory.get(categoryId) || 0
    avgByCategory.set(categoryId, current + t.amount)
  })

  // Find unusual spending
  withdrawals.forEach(t => {
    const categoryId = t.category_id || 'uncategorized'
    const avgSpending = avgByCategory.get(categoryId) || 0
    if (t.amount > avgSpending * 1.5) {
      insights.push({
        type: 'spending',
        message: `Higher than usual spending in ${t.category_name || 'Uncategorized'}`
      })
    }
  })

  return {
    totalTransactions: transactions.length,
    totalAmount: total_income + total_expenses,
    averageAmount: transactions.length > 0 ? (total_income + total_expenses) / transactions.length : 0,
    categoryBreakdown: {
      income: income_by_category,
      expenses: expense_by_category
    },
    monthlyTrend: monthly_trend,
    insights
  }
}
