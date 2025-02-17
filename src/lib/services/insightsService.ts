import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/types/database'
import { MLService, type TransactionFilter } from './mlService'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { getDebts } from './debtService'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']
type Category = Tables['categories']['Row']

export interface InsightResult {
  type: 'spending' | 'saving' | 'debt' | 'goal'
  title: string
  description: string
  data?: any
  recommendation?: string
  priority: 'low' | 'medium' | 'high'
}

export interface SpendingPattern {
  category: string
  amount: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

export interface BudgetRecommendation {
  category: string
  currentSpending: number
  recommendedBudget: number
  potentialSavings: number
}

export interface InvestmentSuggestion {
  type: string
  description: string
  expectedReturn: number
  riskLevel: 'low' | 'medium' | 'high'
  minimumAmount: number
}

export interface SavingsOpportunity {
  category: string
  description: string
  potentialSavings: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface DebtStrategy {
  debtName: string
  currentBalance: number
  interestRate: number
  recommendedPayment: number
  payoffTimeMonths: number
}

export async function generateInsights(userId: string): Promise<InsightResult[]> {
  const insights: InsightResult[] = []
  
  // Get recent transactions
  const endDate = endOfMonth(new Date())
  const startDate = startOfMonth(subMonths(endDate, 3))
  
  const filter: TransactionFilter = {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    type: 'expense'
  }

  // Analyze spending patterns
  const spendingInsights = await analyzeSpending(userId, filter)
  insights.push(...spendingInsights)

  // Analyze savings
  const savingsInsights = await analyzeSavings(userId, filter)
  insights.push(...savingsInsights)

  // Analyze debt
  const debtInsights = await analyzeDebt(userId)
  insights.push(...debtInsights)

  return insights
}

async function analyzeSpending(
  userId: string,
  filter: TransactionFilter
): Promise<InsightResult[]> {
  const insights: InsightResult[] = []

  // Get spending prediction
  const prediction = await MLService.predictNextMonthSpending(userId, filter)
  
  if (prediction.amount > 0) {
    insights.push({
      type: 'spending',
      title: 'Predicted Monthly Spending',
      description: `Based on your spending patterns, you're likely to spend $${prediction.amount} next month`,
      data: prediction,
      priority: prediction.confidence > 0.7 ? 'high' : 'medium'
    })
  }

  // Detect anomalies
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', filter.startDate)
    .lte('date', filter.endDate)

  if (transactions) {
    const anomalies = await MLService.detectAnomalies(userId, transactions)
    
    if (anomalies.length > 0) {
      insights.push({
        type: 'spending',
        title: 'Unusual Spending Patterns',
        description: `Detected ${anomalies.length} unusual transactions`,
        data: anomalies,
        priority: 'high'
      })
    }
  }

  return insights
}

async function analyzeSavings(
  userId: string,
  filter: TransactionFilter
): Promise<InsightResult[]> {
  const insights: InsightResult[] = []

  // Calculate savings rate
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', filter.startDate)
    .lte('date', filter.endDate)

  if (transactions) {
    const income = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0)

    const savingsRate = income > 0 ? (income - expenses) / income : 0

    insights.push({
      type: 'saving',
      title: 'Savings Rate',
      description: `Your savings rate is ${(savingsRate * 100).toFixed(1)}%`,
      data: { savingsRate, income, expenses },
      recommendation: savingsRate < 0.2 ? 'Consider reducing non-essential expenses' : undefined,
      priority: savingsRate < 0.2 ? 'high' : 'medium'
    })
  }

  return insights
}

async function analyzeDebt(userId: string): Promise<InsightResult[]> {
  const insights: InsightResult[] = []

  // Get debt information
  const debts = await getDebts(userId)
  
  if (debts && debts.length > 0) {
    const totalDebt = debts.reduce((sum: number, debt: any) => sum + debt.amount, 0)
    const highInterestDebts = debts.filter((debt: any) => debt.interest_rate > 10)

    if (highInterestDebts.length > 0) {
      insights.push({
        type: 'debt',
        title: 'High Interest Debt',
        description: `You have ${highInterestDebts.length} high-interest debts`,
        data: highInterestDebts,
        recommendation: 'Consider prioritizing paying off high-interest debt',
        priority: 'high'
      })
    }

    insights.push({
      type: 'debt',
      title: 'Total Debt',
      description: `Your total debt is $${totalDebt.toFixed(2)}`,
      data: { totalDebt, debts },
      priority: 'medium'
    })
  }

  return insights
}

export async function getSpendingTrends(
  userId: string,
  months: number = 12
): Promise<Record<string, SpendingPattern>> {
  const endDate = endOfMonth(new Date())
  const startDate = startOfMonth(subMonths(endDate, months))

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())

  if (!transactions) return {}

  const trends: Record<string, SpendingPattern> = {}

  // Group by category and calculate totals
  transactions.forEach(transaction => {
    const category = transaction.category_name || 'Uncategorized'
    
    if (!trends[category]) {
      trends[category] = {
        category,
        amount: 0,
        change: 0,
        trend: 'stable'
      }
    }

    trends[category].amount += transaction.amount
  })

  // Calculate changes and trends
  const previousPeriodStart = startOfMonth(subMonths(startDate, months))
  
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', previousPeriodStart.toISOString())
    .lt('date', startDate.toISOString())

  if (previousTransactions) {
    const previousTotals: Record<string, number> = {}
    
    previousTransactions.forEach(transaction => {
      const category = transaction.category_name || 'Uncategorized'
      previousTotals[category] = (previousTotals[category] || 0) + transaction.amount
    })

    // Calculate changes
    Object.keys(trends).forEach(category => {
      const previousAmount = previousTotals[category] || 0
      const currentAmount = trends[category].amount
      
      if (previousAmount > 0) {
        const change = ((currentAmount - previousAmount) / previousAmount) * 100
        trends[category].change = change
        trends[category].trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
      }
    })
  }

  return trends
}

export async function generateSpendingInsights(
  userId: string,
  months: number = 3
): Promise<SpendingPattern[]> {
  const trends = await getSpendingTrends(userId, months)
  return Object.entries(trends).map(([category, insight]) => ({
    category,
    amount: insight.amount,
    change: insight.change,
    trend: insight.trend
  }))
}

export async function generateBudgetRecommendations(
  userId: string
): Promise<BudgetRecommendation[]> {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startOfMonth(subMonths(new Date(), 3)).toISOString())

  // Mock recommendations based on spending patterns
  return [
    {
      category: 'Dining',
      currentSpending: 500,
      recommendedBudget: 400,
      potentialSavings: 100
    },
    {
      category: 'Entertainment',
      currentSpending: 300,
      recommendedBudget: 200,
      potentialSavings: 100
    }
  ]
}

export async function generateInvestmentSuggestions(
  userId: string
): Promise<InvestmentSuggestion[]> {
  // Mock investment suggestions
  return [
    {
      type: 'Index Fund',
      description: 'Low-cost broad market exposure',
      expectedReturn: 7,
      riskLevel: 'medium',
      minimumAmount: 1000
    },
    {
      type: 'High-Yield Savings',
      description: 'Safe and liquid savings option',
      expectedReturn: 3,
      riskLevel: 'low',
      minimumAmount: 500
    }
  ]
}

export async function generateSavingsOpportunities(
  userId: string
): Promise<SavingsOpportunity[]> {
  // Mock savings opportunities
  return [
    {
      category: 'Subscriptions',
      description: 'Review and cancel unused subscriptions',
      potentialSavings: 50,
      difficulty: 'easy'
    },
    {
      category: 'Utilities',
      description: 'Switch to energy-efficient appliances',
      potentialSavings: 100,
      difficulty: 'medium'
    }
  ]
}

export async function generateDebtStrategies(
  userId: string
): Promise<DebtStrategy[]> {
  const debts = await getDebts(userId)
  
  // Mock debt strategies
  return [
    {
      debtName: 'Credit Card 1',
      currentBalance: 5000,
      interestRate: 15,
      recommendedPayment: 500,
      payoffTimeMonths: 12
    },
    {
      debtName: 'Student Loan',
      currentBalance: 20000,
      interestRate: 5,
      recommendedPayment: 400,
      payoffTimeMonths: 60
    }
  ]
}
