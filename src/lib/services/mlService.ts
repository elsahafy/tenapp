import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/types/database'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']

export interface TransactionFilter {
  startDate?: string
  endDate?: string
  type?: 'expense' | 'income' | 'all'
  categoryId?: string
  minAmount?: number
  maxAmount?: number
}

interface SpendingPrediction {
  amount: number
  confidence: number
  factors: {
    category: string
    impact: number
  }[]
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean
  score: number
  factors: {
    metric: string
    expected: number
    actual: number
    impact: number
  }[]
}

export interface PredictionResult {
  amount: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface PatternResult {
  type: string
  description: string
  confidence: number
  impact: number
}

export class MLService {
  // Predictive Analytics
  static async predictNextMonthSpending(
    userId: string,
    filter: TransactionFilter = {}
  ): Promise<SpendingPrediction> {
    // Get historical transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .eq('type', filter.type || 'expense')
      .gte('date', filter.startDate || '')
      .lte('date', filter.endDate || '')

    if (error) throw error
    if (!transactions) return { amount: 0, confidence: 0, factors: [] }

    // Calculate average monthly spending
    const monthlySpending = transactions.reduce<Record<string, number>>((acc, transaction) => {
      const month = transaction.date.substring(0, 7) // YYYY-MM format
      acc[month] = (acc[month] || 0) + transaction.amount
      return acc
    }, {})

    const monthlyAmounts = Object.values(monthlySpending)
    const averageSpending = monthlyAmounts.reduce((sum, val) => sum + val, 0) / monthlyAmounts.length

    // Calculate category impact
    const categorySpending = transactions.reduce<Record<string, number>>((acc, transaction) => {
      const category = transaction.category_name || 'uncategorized'
      acc[category] = (acc[category] || 0) + transaction.amount
      return acc
    }, {})

    const factors = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        impact: amount / transactions.reduce((sum, t) => sum + t.amount, 0)
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5)

    // Simple confidence calculation based on data consistency
    const stdDev = MLService.calculateStandardDeviation(monthlyAmounts)
    const confidence = Math.max(0, Math.min(1, 1 - (stdDev / averageSpending)))

    return {
      amount: Math.round(averageSpending),
      confidence: Number(confidence.toFixed(2)),
      factors
    }
  }

  static async detectAnomalies(
    userId: string,
    transactions: Transaction[]
  ): Promise<AnomalyDetectionResult[]> {
    const results: AnomalyDetectionResult[] = []

    // Group transactions by category
    const categoryGroups = transactions.reduce<Record<string, Transaction[]>>((acc, transaction) => {
      const category = transaction.category_name || 'uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(transaction)
      return acc
    }, {})

    // Analyze each category
    for (const [category, categoryTransactions] of Object.entries(categoryGroups)) {
      const amounts = categoryTransactions.map(t => t.amount)
      const mean = MLService.calculateMean(amounts)
      const stdDev = MLService.calculateStandardDeviation(amounts)
      
      // Check for anomalies
      for (const transaction of categoryTransactions) {
        const zScore = Math.abs((transaction.amount - mean) / stdDev)
        
        if (zScore > 2) { // More than 2 standard deviations from mean
          results.push({
            isAnomaly: true,
            score: Number(zScore.toFixed(2)),
            factors: [
              {
                metric: 'amount',
                expected: mean,
                actual: transaction.amount,
                impact: zScore
              }
            ]
          })
        }
      }
    }

    return results
  }

  static async predictFutureSpending(
    userId: string,
    filter: TransactionFilter = {}
  ): Promise<PredictionResult> {
    // Mock future spending prediction
    return {
      amount: 2000,
      confidence: 0.75,
      trend: 'increasing'
    }
  }

  static async recognizePatterns(
    userId: string,
    filter: TransactionFilter = {}
  ): Promise<PatternResult[]> {
    // Mock pattern recognition
    return [
      {
        type: 'seasonal',
        description: 'Higher spending during holidays',
        confidence: 0.85,
        impact: 0.4
      }
    ]
  }

  static async detectAnomaliesWithFilter(
    userId: string,
    filter: TransactionFilter = {}
  ): Promise<AnomalyDetectionResult> {
    // Mock anomaly detection
    return {
      isAnomaly: true,
      score: 0.92,
      factors: [
        {
          metric: 'amount',
          expected: 100,
          actual: 500,
          impact: 0.8
        }
      ]
    }
  }

  // Helper functions
  private static calculateMean(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0
    const mean = MLService.calculateMean(values)
    const squareDiffs = values.map(value => Math.pow(value - mean, 2))
    const avgSquareDiff = MLService.calculateMean(squareDiffs)
    return Math.sqrt(avgSquareDiff)
  }

  private static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0

    const meanX = MLService.calculateMean(x)
    const meanY = MLService.calculateMean(y)
    
    const numerator = x.reduce((sum, xi, i) => 
      sum + ((xi - meanX) * (y[i] - meanY)), 0)
    
    const denomX = Math.sqrt(x.reduce((sum, xi) => 
      sum + Math.pow(xi - meanX, 2), 0))
    
    const denomY = Math.sqrt(y.reduce((sum, yi) => 
      sum + Math.pow(yi - meanY, 2), 0))
    
    if (denomX === 0 || denomY === 0) return 0
    return numerator / (denomX * denomY)
  }
}
