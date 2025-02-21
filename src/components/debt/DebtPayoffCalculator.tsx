import { useCurrency } from '@/lib/hooks/useCurrency'
import type { Database } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/formatters'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

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

type PayoffPlan = {
  monthlyPayment: number
  minimumPayment: number
  totalMonths: number
  totalInterestPaid: number
  accountPayoffs: {
    account: Account
    monthlyPayment: number
    minimumPayment: number
    monthsToPayoff: number
    totalInterest: number
  }[]
}

interface DebtPayoffCalculatorProps {
  payoffPlan: PayoffPlan
  totalDebt: number
  onPaymentChange: (payment: number) => void
}

export function DebtPayoffCalculator({ payoffPlan, totalDebt, onPaymentChange }: DebtPayoffCalculatorProps) {
  const { currency } = useCurrency()
  const [customPayment, setCustomPayment] = useState(payoffPlan.monthlyPayment)
  const [error, setError] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  // Validate that custom payment meets minimum requirements
  const validateCustomPayment = (amount: number) => {
    const totalMinPayment = payoffPlan.accountPayoffs.reduce((acc, { minimumPayment }) => acc + minimumPayment, 0)
    if (amount < totalMinPayment) {
      setError(`Payment must be at least ${formatCurrency(totalMinPayment, currency)} to cover minimum payments`)
      return false
    }
    setError('')
    return true
  }

  // Handle custom payment change
  const handleCustomPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value > 0) {
      setCustomPayment(value)
      setIsDirty(true)
      validateCustomPayment(value)
    }
  }

  // Handle recalculate
  const handleRecalculate = () => {
    if (validateCustomPayment(customPayment)) {
      onPaymentChange(customPayment)
      setIsDirty(false)
    }
  }

  // Reset to account minimum payments
  const handleReset = () => {
    const totalMinPayment = payoffPlan.accountPayoffs.reduce((acc, { minimumPayment }) => acc + minimumPayment, 0)
    setCustomPayment(totalMinPayment)
    onPaymentChange(totalMinPayment)
    setError('')
    setIsDirty(false)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Debt Payoff Calculator</h2>

      <div className="space-y-6">
        <div>
          <label htmlFor="monthly-payment" className="block text-sm font-medium text-gray-700">
            Monthly Payment
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{currency}</span>
            </div>
            <input
              type="number"
              name="monthly-payment"
              id="monthly-payment"
              className={`block w-full pl-12 pr-24 sm:text-sm rounded-md ${
                error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
              value={customPayment}
              onChange={handleCustomPaymentChange}
              min={payoffPlan.accountPayoffs.reduce((acc, { minimumPayment }) => acc + minimumPayment, 0)}
              step="0.01"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="text-primary-600 hover:text-primary-700 focus:outline-none focus:text-primary-700"
                  title="Recalculate with new payment"
                >
                  <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                title="Reset to account minimum payments"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Minimum required: {formatCurrency(payoffPlan.accountPayoffs.reduce((acc, { minimumPayment }) => acc + minimumPayment, 0), currency)}
          </p>
          {isDirty && (
            <p className="mt-2 text-sm text-primary-600">
              Click the recalculate button to update the payment plan
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Breakdown</h3>
          <div className="space-y-4">
            {payoffPlan.accountPayoffs.map(({ account, monthlyPayment, minimumPayment, monthsToPayoff, totalInterest }) => (
              <div key={account.id} className="bg-gray-50 rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{account.name}</h4>
                    <p className="text-sm text-gray-500">
                      Balance: {formatCurrency(account.current_balance, currency)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Minimum payment: {formatCurrency(minimumPayment, currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(monthlyPayment, currency)}/mo
                    </p>
                    <p className="text-sm text-gray-500">
                      {monthsToPayoff === 1 ? '1 month' : monthsToPayoff > 0 ? `${monthsToPayoff} months` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Interest: {formatCurrency(totalInterest, currency)}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-primary-500 rounded-full"
                      style={{
                        width: `${(monthlyPayment / customPayment) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total Debt</dt>
              <dd className="text-sm font-medium text-gray-900">{formatCurrency(totalDebt, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total Interest</dt>
              <dd className="text-sm font-medium text-gray-900">{formatCurrency(payoffPlan.totalInterestPaid, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Time to Debt Free</dt>
              <dd className="text-sm font-medium text-gray-900">
                {payoffPlan.totalMonths > 0
                  ? `${Math.floor(payoffPlan.totalMonths / 12)} years, ${payoffPlan.totalMonths % 12} months`
                  : 'N/A'
                }
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
