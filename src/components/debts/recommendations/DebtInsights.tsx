import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { RecommendationList } from './RecommendationList'
import { SavingsOpportunities } from './SavingsOpportunities'
import { ActionItems } from './ActionItems'

interface Debt {
  id: string
  name: string
  current_balance: number
  interest_rate: number
  minimum_payment: number
  type: string
}

interface Transaction {
  amount: number
  category: string
  date: string
}

interface Recommendation {
  id: string
  category: string
  title: string
  description: string
  potential_savings: number
  priority: number
  implemented: boolean
}

export function DebtInsights() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (debts.length > 0 && transactions.length > 0) {
      generateRecommendations()
    }
  }, [debts, transactions])

  async function fetchData() {
    try {
      // Fetch debts
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .eq('active', true)

      if (debtsError) throw debtsError

      // Fetch last 3 months of transactions
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, category, date')
        .gte('date', threeMonthsAgo.toISOString())

      if (transactionsError) throw transactionsError

      setDebts(debtsData || [])
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generateRecommendations() {
    const newRecommendations: Omit<Recommendation, 'id'>[] = []

    // Calculate total debt and monthly payments
    const totalDebt = debts.reduce((sum, debt) => sum + debt.current_balance, 0)
    const monthlyPayments = debts.reduce(
      (sum, debt) => sum + debt.minimum_payment,
      0
    )

    // Calculate monthly spending by category
    const categorySpending = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = 0
      }
      acc[transaction.category] += transaction.amount
      return acc
    }, {} as Record<string, number>)

    // Average monthly spending by category
    const monthlyAvgByCategory = Object.entries(categorySpending).map(
      ([category, total]) => ({
        category,
        monthly: total / 3, // 3 months of data
      })
    )

    // Find high-interest debts
    const highInterestDebts = debts.filter((debt) => debt.interest_rate > 15)
    if (highInterestDebts.length > 0) {
      newRecommendations.push({
        category: 'high_interest',
        title: 'Consider Debt Consolidation',
        description:
          'You have high-interest debts that could be consolidated at a lower rate, potentially saving you money on interest.',
        potential_savings: highInterestDebts.reduce(
          (sum, debt) =>
            sum + (debt.current_balance * (debt.interest_rate - 15)) / 100,
          0
        ),
        priority: 1,
        implemented: false,
      })
    }

    // Identify discretionary spending categories
    const discretionaryCategories = ['entertainment', 'dining', 'shopping']
    const discretionarySpending = monthlyAvgByCategory
      .filter((cat) => discretionaryCategories.includes(cat.category))
      .reduce((sum, cat) => sum + cat.monthly, 0)

    if (discretionarySpending > monthlyPayments * 0.5) {
      const potentialSavings = discretionarySpending * 0.2 // Suggest 20% reduction
      newRecommendations.push({
        category: 'spending',
        title: 'Reduce Discretionary Spending',
        description:
          'Your discretionary spending is high relative to your debt payments. Consider reducing non-essential expenses to accelerate debt payoff.',
        potential_savings: potentialSavings,
        priority: 2,
        implemented: false,
      })
    }

    // Check for balance transfer opportunities
    const creditCardDebts = debts.filter((debt) => debt.type === 'credit_card')
    if (creditCardDebts.length > 0) {
      const potentialSavings = creditCardDebts.reduce(
        (sum, debt) =>
          sum + (debt.current_balance * (debt.interest_rate - 3)) / 100, // Assume 3% balance transfer fee
        0
      )
      if (potentialSavings > 500) {
        newRecommendations.push({
          category: 'balance_transfer',
          title: 'Balance Transfer Opportunity',
          description:
            'You could save money by transferring high-interest credit card balances to a card with a 0% introductory rate.',
          potential_savings: potentialSavings,
          priority: 1,
          implemented: false,
        })
      }
    }

    // Save recommendations to database
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Delete existing recommendations
      await supabase
        .from('debt_recommendations')
        .delete()
        .eq('user_id', userData.user.id)

      // Insert new recommendations
      const { error } = await supabase.from('debt_recommendations').insert(
        newRecommendations.map((rec) => ({
          ...rec,
          user_id: userData.user.id,
        }))
      )

      if (error) throw error

      // Fetch saved recommendations with IDs
      const { data: savedRecs, error: fetchError } = await supabase
        .from('debt_recommendations')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('priority')

      if (fetchError) throw fetchError
      setRecommendations(savedRecs || [])
    } catch (error) {
      console.error('Error saving recommendations:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <RecommendationList
        recommendations={recommendations}
        onImplemented={(id) => {
          setRecommendations((prev) =>
            prev.map((rec) =>
              rec.id === id ? { ...rec, implemented: true } : rec
            )
          )
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SavingsOpportunities
          recommendations={recommendations}
          totalDebt={debts.reduce((sum, debt) => sum + debt.current_balance, 0)}
        />
        <ActionItems recommendations={recommendations} />
      </div>
    </div>
  )
}
