import { useCurrency } from '@/lib/hooks/useCurrency'
import {
  calculateDebtPayoff,
  calculateTotalDebt,
  generateDebtRecommendations,
} from '@/lib/services/debtService'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/formatters'
import {
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { DebtAccountList } from './DebtAccountList'
import { DebtPayoffCalculator } from './DebtPayoffCalculator'
import { DebtRecommendations } from './DebtRecommendations'
import { SummaryCard } from './SummaryCard'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row'] & {
  collateral: string | null
  emi_enabled: boolean
  loan_end_date: string | null
  loan_purpose: string | null
  loan_start_date: string | null
  loan_term: number | null
  monthly_installment: number | null
  total_loan_amount: number | null
  min_payment_amount: number | null
  min_payment_percentage: number | null
}

type AccountResponse = Account & {
  minimum_payment?: number;
  currency?: string;
  institution?: string;
  account_number?: string;
}

type PayoffPlan = {
  monthlyPayment: number;
  minimumPayment: number;
  totalMonths: number;
  totalInterestPaid: number;
  accountPayoffs: {
    account: Account;
    monthlyPayment: number;
    minimumPayment: number;
    monthsToPayoff: number;
    totalInterest: number;
  }[];
}

type SummaryStats = {
  totalDebt: number;
  avgInterestRate: number;
  recommendedPayment: number;
  totalMinPayments: number;
  projectedPayoff: number;
  totalInterest: number;
}

// Helper function to get minimum payment for an account
const getMinimumPayment = (account: Account): number => {
  if (account.type === 'credit_card' && account.min_payment_percentage) {
    return Math.max(
      (account.min_payment_percentage / 100) * account.current_balance,
      account.min_payment_amount || 0
    )
  }
  return account.min_payment_amount || 0
}

export function DebtDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalDebt: 0,
    avgInterestRate: 0,
    recommendedPayment: 0,
    totalMinPayments: 0,
    projectedPayoff: 0,
    totalInterest: 0
  })
  const [payoffPlan, setPayoffPlan] = useState<PayoffPlan | null>(null)
  const { currency: userCurrency } = useCurrency()

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['credit_card', 'loan'])
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Convert and validate account data
      const validAccounts = (data || []).map(account => ({
        ...account,
        current_balance: Math.abs(account.current_balance || 0), // Ensure positive balance
        interest_rate: account.interest_rate || 0,
        min_payment_amount: account.min_payment_amount || null,
        min_payment_percentage: account.min_payment_percentage || null,
        monthly_installment: account.monthly_installment || null,
        currency: account.currency || userCurrency
      }))

      setAccounts(validAccounts)

      // Filter accounts matching user's currency
      const matchingCurrencyAccounts = validAccounts.filter(acc => acc.currency === userCurrency)

      // Calculate total debt
      const totalDebt = calculateTotalDebt(matchingCurrencyAccounts)

      // Calculate weighted average interest rate
      const weightedInterestRate = matchingCurrencyAccounts.reduce((sum, acc) => {
        return sum + (acc.interest_rate * (acc.current_balance / totalDebt))
      }, 0)

      // Calculate payoff details
      const payoffDetails = calculateDebtPayoff(matchingCurrencyAccounts)

      setSummaryStats({
        totalDebt,
        avgInterestRate: weightedInterestRate,
        totalMinPayments: payoffDetails.monthlyPayment,
        recommendedPayment: payoffDetails.monthlyPayment,
        projectedPayoff: payoffDetails.totalMonths,
        totalInterest: payoffDetails.totalInterestPaid
      })

      setPayoffPlan(payoffDetails)

    } catch (err) {
      console.error('Error fetching accounts:', err)
      setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [userCurrency])

  // Handle payment amount changes
  const handlePaymentChange = (newPayment: number) => {
    if (!accounts.length) return

    const totalMinPayment = accounts.reduce((sum, acc) => {
      if (acc.type === 'credit_card' && acc.min_payment_percentage) {
        return sum + Math.max(
          (acc.min_payment_percentage / 100) * acc.current_balance,
          acc.min_payment_amount || 0
        )
      }
      return sum + (acc.min_payment_amount || 0)
    }, 0)

    const newPayoffPlan = calculateDebtPayoff(accounts, Math.max(newPayment, totalMinPayment))
    setPayoffPlan(newPayoffPlan)
    
    // Update summary stats with new calculation
    setSummaryStats({
      totalDebt: accounts.reduce((sum, acc) => sum + acc.current_balance, 0),
      avgInterestRate: accounts.reduce((sum, acc) => sum + ((acc.interest_rate || 0) * acc.current_balance), 0) / 
        accounts.reduce((sum, acc) => sum + acc.current_balance, 0),
      recommendedPayment: newPayment,
      totalMinPayments: totalMinPayment,
      projectedPayoff: newPayoffPlan.totalMonths,
      totalInterest: newPayoffPlan.totalInterestPaid
    })
  }

  // Format payoff duration for display
  const formatPayoffDuration = (months: number): string => {
    if (months <= 0) return 'No payment needed'
    if (months === -1) return 'Unable to calculate'

    const years = Math.floor(months / 12)
    const remainingMonths = months % 12

    if (years === 0) return `${remainingMonths} months`
    if (remainingMonths === 0) return `${years} years`
    return `${years} years, ${remainingMonths} months`
  }

  if (error) {
    return <div className="text-red-600">{error}</div>
  }

  if (!payoffPlan) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Debt Dashboard</h1>
          <div className="mt-4">Loading debt payoff plan...</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500"
      role="main"
      aria-label="Debt Management Dashboard"
    >
      {error && (
        <div
          className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        role="region"
        aria-label="Financial Summary"
      >
        <SummaryCard
          title="Total Debt"
          value={formatCurrency(summaryStats.totalDebt, userCurrency)}
          description="Across all accounts"
          icon={BanknotesIcon}
          loading={loading}
        />
        <SummaryCard
          title="Average Interest Rate"
          value={`${summaryStats.avgInterestRate.toFixed(2)}%`}
          description="Weighted by balance"
          icon={ChartBarIcon}
          loading={loading}
        />
        <SummaryCard
          title="Monthly Payment"
          value={formatCurrency(summaryStats.recommendedPayment, userCurrency)}
          description={`Minimum required: ${formatCurrency(summaryStats.totalMinPayments, userCurrency)}`}
          icon={CreditCardIcon}
          loading={loading}
        />
        <SummaryCard
          title="Debt Free In"
          value={formatPayoffDuration(summaryStats.projectedPayoff)}
          description={`Total interest: ${formatCurrency(summaryStats.totalInterest, userCurrency)}`}
          icon={ArrowTrendingDownIcon}
          loading={loading}
        />
      </div>

      <div
        className="space-y-8"
        role="region"
        aria-label="Debt Management Tools"
      >
        <DebtAccountList
          accounts={accounts}
          onAccountsChange={fetchAccounts}
        />

        {accounts.length > 0 && (
          <>
            <DebtPayoffCalculator
              payoffPlan={payoffPlan}
              totalDebt={summaryStats.totalDebt}
              onPaymentChange={handlePaymentChange}
            />
            <DebtRecommendations
              recommendations={generateDebtRecommendations(accounts)}
            />
          </>
        )}
      </div>
    </div>
  )
}
