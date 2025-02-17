import { useState, useEffect } from 'react'
import type { Database } from '@/lib/types/database'
import { supabase } from '@/lib/supabase-client'
import {
  calculateDebtPayoff,
  calculateTotalDebt,
  generateDebtRecommendations,
  type DebtRecommendation
} from '@/lib/services/debtService'
import { DebtAccountList } from './DebtAccountList'
import { DebtPayoffCalculator } from './DebtPayoffCalculator'
import { DebtRecommendations } from './DebtRecommendations'
import { ChartBarIcon, CreditCardIcon, ArrowTrendingDownIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { formatCurrency, defaultCurrency } from '@/lib/currency/currencies'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']
type AccountResponse = Tables['accounts']['Row'] & {
  minimum_payment?: number;
  currency?: string;
  institution?: string;
  account_number?: string;
}

interface SummaryCardProps {
  title: string
  value: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  trend?: number
  loading?: boolean
}

function SummaryCard({ title, value, description, icon: Icon, trend, loading }: SummaryCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow p-6 relative overflow-hidden animate-in fade-in duration-500"
      role="region"
      aria-label={`${title} summary card`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600" id={`${title.toLowerCase()}-label`}>{title}</p>
          {loading ? (
            <div 
              className="h-8 w-32 bg-gray-200 animate-pulse rounded mt-1"
              role="progressbar"
              aria-labelledby={`${title.toLowerCase()}-label`}
              aria-valuetext="Loading..."
            ></div>
          ) : (
            <p 
              className="mt-1 text-2xl font-semibold text-gray-900"
              aria-labelledby={`${title.toLowerCase()}-label`}
            >
              {value}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <div 
          className="h-8 w-8 bg-primary-50 rounded-lg flex items-center justify-center"
          aria-hidden="true"
        >
          <Icon className="h-4 w-4 text-primary-600" aria-hidden="true" />
        </div>
      </div>
      {trend !== undefined && (
        <div 
          className={`mt-4 flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
          role="status"
          aria-label={`${Math.abs(trend)}% ${trend >= 0 ? 'increase' : 'decrease'} from last month`}
        >
          <ArrowTrendingDownIcon 
            className={`h-3 w-3 mr-1 ${trend >= 0 ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
  )
}

export function DebtDashboard() {
  const [accounts, setAccounts] = useState<AccountResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summaryStats, setSummaryStats] = useState({
    totalDebt: 0,
    avgInterestRate: 0,
    monthlyPayments: 0,
    projectedPayoff: 0
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
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
      
      const validAccounts = (data as AccountResponse[] || []).map(account => ({
        ...account,
        minimum_payment: account.minimum_payment || 0,
        currency: account.currency || 'USD',
        institution: account.institution || '',
        account_number: account.account_number || ''
      }))

      setAccounts(validAccounts)
      
      // Calculate summary statistics
      const totalDebt = validAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0)
      const avgInterestRate = validAccounts.reduce((sum, acc) => sum + (acc.interest_rate || 0), 0) / validAccounts.length
      const monthlyPayments = validAccounts.reduce((sum, acc) => sum + (acc.minimum_payment || 0), 0)
      const payoffPlan = calculateDebtPayoff(validAccounts)
      
      setSummaryStats({
        totalDebt,
        avgInterestRate,
        monthlyPayments,
        projectedPayoff: payoffPlan.totalMonths
      })
    } catch (err) {
      console.error('Error fetching accounts:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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
          <p>{error}</p>
        </div>
      )}

      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        role="region"
        aria-label="Financial Summary"
      >
        <SummaryCard
          title="Total Debt"
          value={formatCurrency(summaryStats.totalDebt, defaultCurrency)}
          description="Across all accounts"
          icon={BanknotesIcon}
          loading={loading}
        />
        <SummaryCard
          title="Average Interest Rate"
          value={`${summaryStats.avgInterestRate.toFixed(2)}%`}
          description="Weighted average"
          icon={ChartBarIcon}
          loading={loading}
        />
        <SummaryCard
          title="Monthly Payments"
          value={formatCurrency(summaryStats.monthlyPayments, defaultCurrency)}
          description="Total minimum payments"
          icon={CreditCardIcon}
          loading={loading}
        />
        <SummaryCard
          title="Projected Payoff"
          value={`${summaryStats.projectedPayoff} months`}
          description="At current payment rate"
          icon={ArrowTrendingDownIcon}
          loading={loading}
        />
      </div>

      <div 
        className="space-y-8"
        role="region"
        aria-label="Debt Management Tools"
      >
        <div className="animate-in slide-in-from-bottom duration-500">
          <DebtAccountList accounts={accounts} onAccountsChange={fetchAccounts} />
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-100">
          <DebtPayoffCalculator payoffPlan={calculateDebtPayoff(accounts)} totalDebt={calculateTotalDebt(accounts)} />
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-200">
          <DebtRecommendations recommendations={generateDebtRecommendations(accounts)} />
        </div>
      </div>
    </div>
  )
}
