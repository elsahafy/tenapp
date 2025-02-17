import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import {
  generateSpendingInsights,
  generateBudgetRecommendations,
  generateInvestmentSuggestions,
  generateSavingsOpportunities,
  generateDebtStrategies,
  type SpendingPattern,
  type BudgetRecommendation,
  type InvestmentSuggestion,
  type SavingsOpportunity,
  type DebtStrategy
} from '@/lib/services/insightsService'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  CircleStackIcon,
  CurrencyDollarIcon,
  WalletIcon
} from '@heroicons/react/24/outline'

export default function InsightsDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [spendingPatterns, setSpendingPatterns] = useState<SpendingPattern[]>([])
  const [budgetRecommendations, setBudgetRecommendations] = useState<BudgetRecommendation[]>([])
  const [investmentSuggestions, setInvestmentSuggestions] = useState<InvestmentSuggestion[]>([])
  const [savingsOpportunities, setSavingsOpportunities] = useState<SavingsOpportunity[]>([])
  const [debtStrategies, setDebtStrategies] = useState<DebtStrategy[]>([])

  useEffect(() => {
    const fetchInsights = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        const [
          spendingData,
          budgetData,
          investmentData,
          savingsData,
          debtData
        ] = await Promise.all([
          generateSpendingInsights(user.id),
          generateBudgetRecommendations(user.id),
          generateInvestmentSuggestions(user.id),
          generateSavingsOpportunities(user.id),
          generateDebtStrategies(user.id)
        ])

        setSpendingPatterns(spendingData)
        setBudgetRecommendations(budgetData)
        setInvestmentSuggestions(investmentData)
        setSavingsOpportunities(savingsData)
        setDebtStrategies(debtData)
      } catch (err) {
        console.error('Error fetching insights:', err)
        setError(err instanceof Error ? err.message : 'Failed to load insights')
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [user?.id])

  const renderSpendingPattern = (pattern: SpendingPattern, index: number) => (
    <div key={index} className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{pattern.category}</h3>
        {pattern.trend === 'up' ? (
          <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
        ) : pattern.trend === 'down' ? (
          <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />
        ) : (
          <ChartBarIcon className="h-5 w-5 text-gray-500" />
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        ${pattern.amount.toFixed(2)} ({pattern.change > 0 ? '+' : ''}{pattern.change}% vs last month)
      </p>
    </div>
  )

  const renderBudgetRecommendation = (recommendation: BudgetRecommendation, index: number) => (
    <div key={index} className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{recommendation.category}</h3>
        <BanknotesIcon className="h-5 w-5 text-blue-500" />
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-sm text-gray-500">
          Current: ${recommendation.currentSpending.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500">
          Recommended: ${recommendation.recommendedBudget.toFixed(2)}
        </p>
        <p className="text-sm text-green-600">
          Potential Savings: ${recommendation.potentialSavings.toFixed(2)}
        </p>
      </div>
    </div>
  )

  const renderInvestmentSuggestion = (suggestion: InvestmentSuggestion, index: number) => (
    <div key={index} className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{suggestion.type}</h3>
        <CircleStackIcon className="h-5 w-5 text-yellow-500" />
      </div>
      <p className="mt-1 text-sm text-gray-500">{suggestion.description}</p>
      <div className="mt-2 space-y-1">
        <p className="text-sm text-gray-500">
          Expected Return: {suggestion.expectedReturn}%
        </p>
        <p className="text-sm text-gray-500">
          Risk Level: {suggestion.riskLevel}
        </p>
        <p className="text-sm text-gray-500">
          Minimum: ${suggestion.minimumAmount.toFixed(2)}
        </p>
      </div>
    </div>
  )

  const renderSavingsOpportunity = (opportunity: SavingsOpportunity, index: number) => (
    <div key={index} className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{opportunity.category}</h3>
        <WalletIcon className="h-5 w-5 text-green-500" />
      </div>
      <p className="mt-1 text-sm text-gray-500">{opportunity.description}</p>
      <div className="mt-2 space-y-1">
        <p className="text-sm text-green-600">
          Potential Savings: ${opportunity.potentialSavings.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500">
          Difficulty: {opportunity.difficulty}
        </p>
      </div>
    </div>
  )

  const renderDebtStrategy = (strategy: DebtStrategy, index: number) => (
    <div key={index} className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{strategy.debtName}</h3>
        <CurrencyDollarIcon className="h-5 w-5 text-red-500" />
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-sm text-gray-500">
          Balance: ${strategy.currentBalance.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500">
          Interest Rate: {strategy.interestRate}%
        </p>
        <p className="text-sm text-gray-500">
          Recommended Payment: ${strategy.recommendedPayment.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500">
          Payoff Time: {strategy.payoffTimeMonths} months
        </p>
      </div>
    </div>
  )

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please sign in to view insights</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading insights...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading insights</h3>
            <p className="text-sm text-red-700 mt-2">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Spending Patterns */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Spending Patterns</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spendingPatterns.map((pattern, index) => renderSpendingPattern(pattern, index))}
        </div>
      </section>

      {/* Budget Recommendations */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Budget Recommendations</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetRecommendations.map((rec, index) => renderBudgetRecommendation(rec, index))}
        </div>
      </section>

      {/* Investment Suggestions */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Investment Suggestions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {investmentSuggestions.map((suggestion, index) => renderInvestmentSuggestion(suggestion, index))}
        </div>
      </section>

      {/* Savings Opportunities */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Savings Opportunities</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savingsOpportunities.map((opportunity, index) => renderSavingsOpportunity(opportunity, index))}
        </div>
      </section>

      {/* Debt Strategies */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Debt Strategies</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {debtStrategies.map((strategy, index) => renderDebtStrategy(strategy, index))}
        </div>
      </section>
    </div>
  )
}
