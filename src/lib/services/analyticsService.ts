import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']

export interface CategoryMetric {
  name: string
  total: number
  count: number
  average: number
}

export interface SpendingTrend {
  date: string
  amount: number
}

export interface AnalyticsSummary {
  totalSpending: number
  averageSpending: number
  topCategories: CategoryMetric[]
  spendingTrends: SpendingTrend[]
}

export interface CategorySpending {
  category: string
  amount: number
  percentage: number
  transactions: number
}

export interface MonthlyTrend {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface CashFlowAnalysis {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
  monthOverMonthChange: number
}

export interface Anomaly {
  id: string
  date: string
  type: 'expense' | 'income'
  amount: number
  description: string
  confidence: number
}

export async function getSpendingAnalytics(
  userId: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsSummary> {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) throw error
  if (!transactions) return {
    totalSpending: 0,
    averageSpending: 0,
    topCategories: [],
    spendingTrends: []
  }

  // Calculate category metrics
  const categoryMap = new Map<string, CategoryMetric>()
  
  transactions.forEach(transaction => {
    const categoryName = transaction.category_name || 'Uncategorized'
    const current = categoryMap.get(categoryName) || {
      name: categoryName,
      total: 0,
      count: 0,
      average: 0
    }

    current.total += transaction.amount
    current.count++
    current.average = current.total / current.count

    categoryMap.set(categoryName, current)
  })

  const topCategories = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Calculate spending trends (daily totals)
  const trendMap = new Map<string, number>()
  
  transactions.forEach(transaction => {
    const date = transaction.date.split('T')[0]
    const current = trendMap.get(date) || 0
    trendMap.set(date, current + transaction.amount)
  })

  const spendingTrends = Array.from(trendMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate overall metrics
  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0)
  const averageSpending = totalSpending / transactions.length || 0

  return {
    totalSpending,
    averageSpending,
    topCategories,
    spendingTrends
  }
}

export async function getCategoryAnalytics(
  userId: string,
  categoryId: string,
  startDate: string,
  endDate: string
): Promise<CategoryMetric & { transactions: Transaction[] }> {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error
  if (!transactions) return {
    name: 'Unknown',
    total: 0,
    count: 0,
    average: 0,
    transactions: []
  }

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)
  const count = transactions.length
  const average = count > 0 ? total / count : 0
  const name = transactions[0]?.category_name || 'Unknown'

  return {
    name,
    total,
    count,
    average,
    transactions
  }
}

export async function getMonthlyComparison(
  userId: string,
  currentMonth: string,
  previousMonth: string
): Promise<{
  currentMonth: CategoryMetric[]
  previousMonth: CategoryMetric[]
  changes: {
    name: string
    percentageChange: number
    absoluteChange: number
  }[]
}> {
  // Get current month data
  const { data: currentData } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .gte('date', currentMonth)
    .lt('date', previousMonth)

  // Get previous month data
  const { data: previousData } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .gte('date', previousMonth)
    .lt('date', currentMonth)

  const currentMetrics = calculateCategoryMetrics(currentData || [])
  const previousMetrics = calculateCategoryMetrics(previousData || [])

  // Calculate changes
  const changes = Array.from(new Set([
    ...currentMetrics.map(m => m.name),
    ...previousMetrics.map(m => m.name)
  ])).map(name => {
    const current = currentMetrics.find(m => m.name === name)?.total || 0
    const previous = previousMetrics.find(m => m.name === name)?.total || 0
    const absoluteChange = current - previous
    const percentageChange = previous === 0 ? 100 : ((current - previous) / previous) * 100

    return {
      name,
      percentageChange,
      absoluteChange
    }
  })

  return {
    currentMonth: currentMetrics,
    previousMonth: previousMetrics,
    changes
  }
}

function calculateCategoryMetrics(transactions: Transaction[]): CategoryMetric[] {
  const categoryMap = new Map<string, CategoryMetric>()
  
  transactions.forEach(transaction => {
    const categoryName = transaction.category_name || 'Uncategorized'
    const current = categoryMap.get(categoryName) || {
      name: categoryName,
      total: 0,
      count: 0,
      average: 0
    }

    current.total += transaction.amount
    current.count++
    current.average = current.total / current.count

    categoryMap.set(categoryName, current)
  })

  return Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
}

export const getSpendingByCategory = async (userId: string, timeframe: string): Promise<CategorySpending[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .gte('created_at', timeframe)

  if (error) throw error

  const categoryTotals = data.reduce((acc: Record<string, { amount: number; transactions: number }>, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = { amount: 0, transactions: 0 }
    }
    acc[curr.category].amount += curr.amount
    acc[curr.category].transactions++
    return acc
  }, {})

  const totalSpending = Object.values(categoryTotals).reduce((sum, { amount }) => sum + amount, 0)

  return Object.entries(categoryTotals).map(([category, { amount, transactions }]) => ({
    category,
    amount,
    percentage: (amount / totalSpending) * 100,
    transactions
  }))
}

export const getMonthlyTrends = async (userId: string, timeframe: string): Promise<MonthlyTrend[]> => {
  const startDate = getTimeframeDate(timeframe)
  
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error

  const monthlyData: Record<string, MonthlyTrend> = {}

  data.forEach(transaction => {
    const month = new Date(transaction.created_at).toISOString().slice(0, 7)
    if (!monthlyData[month]) {
      monthlyData[month] = { month, income: 0, expenses: 0, savings: 0 }
    }
    
    if (transaction.type === 'income') {
      monthlyData[month].income += transaction.amount
    } else {
      monthlyData[month].expenses += transaction.amount
    }
    monthlyData[month].savings = monthlyData[month].income - monthlyData[month].expenses
  })

  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
}

export const getCashFlowAnalysis = async (userId: string, timeframe: string): Promise<CashFlowAnalysis> => {
  const trends = await getMonthlyTrends(userId, timeframe)
  const currentMonth = trends[trends.length - 1]
  const previousMonth = trends[trends.length - 2]

  const monthOverMonthChange = previousMonth
    ? ((currentMonth.savings - previousMonth.savings) / previousMonth.savings) * 100
    : 0

  return {
    totalIncome: currentMonth.income,
    totalExpenses: currentMonth.expenses,
    netSavings: currentMonth.savings,
    savingsRate: (currentMonth.savings / currentMonth.income) * 100,
    monthOverMonthChange
  }
}

export const detectAnomalies = async (userId: string): Promise<Anomaly[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('amount', { ascending: false })
    .limit(10)

  if (error) throw error

  // Simple anomaly detection based on amount thresholds
  return data
    .filter(transaction => Math.abs(transaction.amount) > 1000)
    .map(transaction => ({
      id: transaction.id,
      date: transaction.created_at,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      confidence: calculateAnomalyConfidence(transaction.amount)
    }))
}

function calculateAnomalyConfidence(amount: number): number {
  // Simple confidence calculation based on amount
  const baseConfidence = Math.min(Math.abs(amount) / 2000, 1) * 100
  return Math.round(baseConfidence * 100) / 100
}

function getTimeframeDate(timeframe: string): Date {
  const now = new Date()
  switch (timeframe) {
    case '1m':
      return new Date(now.setMonth(now.getMonth() - 1))
    case '3m':
      return new Date(now.setMonth(now.getMonth() - 3))
    case '6m':
      return new Date(now.setMonth(now.getMonth() - 6))
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1))
    default:
      return new Date(now.setMonth(now.getMonth() - 1)) // Default to 1 month
  }
}
