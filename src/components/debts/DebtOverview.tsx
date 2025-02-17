'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import {
  BanknotesIcon,
  CreditCardIcon,
  HomeIcon,
  AcademicCapIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'

interface DebtSummary {
  totalDebt: number
  debtsByType: { [key in Database['public']['Enums']['debt_type']]: number }
  monthlyPayments: number
  averageInterestRate: number
}

const DEBT_ICONS: { [key: string]: any } = {
  mortgage: HomeIcon,
  credit_card: CreditCardIcon,
  student_loan: AcademicCapIcon,
  auto_loan: TruckIcon,
  personal: BanknotesIcon,
}

export function DebtOverview() {
  const [summary, setSummary] = useState<DebtSummary>({
    totalDebt: 0,
    debtsByType: {} as { [key in Database['public']['Enums']['debt_type']]: number },
    monthlyPayments: 0,
    averageInterestRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDebtSummary()
  }, [])

  async function fetchDebtSummary() {
    try {
      const { data: debts, error } = await supabase
        .from('debts')
        .select('*')
        .eq('active', true)

      if (error) throw error

      const summary = debts.reduce(
        (acc, debt) => {
          // Update total debt
          acc.totalDebt += debt.current_balance

          // Update debts by type
          acc.debtsByType[debt.type] = (acc.debtsByType[debt.type] || 0) + debt.current_balance

          // Update monthly payments
          acc.monthlyPayments += debt.minimum_payment

          // Update average interest rate (weighted)
          acc.averageInterestRate +=
            (debt.interest_rate * debt.current_balance) / acc.totalDebt

          return acc
        },
        {
          totalDebt: 0,
          debtsByType: {} as { [key in Database['public']['Enums']['debt_type']]: number },
          monthlyPayments: 0,
          averageInterestRate: 0,
        }
      )

      setSummary(summary)
    } catch (error) {
      console.error('Error fetching debt summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Debt Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-primary-900">Total Debt</p>
                <p className="text-2xl font-semibold text-primary-700">
                  ${summary.totalDebt.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Monthly Payments</p>
                <p className="text-2xl font-semibold text-green-700">
                  ${summary.monthlyPayments.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HomeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Largest Debt Type</p>
                <p className="text-2xl font-semibold text-blue-700">
                  {Object.entries(summary.debtsByType)
                    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Avg Interest Rate</p>
                <p className="text-2xl font-semibold text-purple-700">
                  {summary.averageInterestRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Debt Distribution</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(summary.debtsByType).map(([type, amount]) => {
              const Icon = DEBT_ICONS[type] || BanknotesIcon
              return (
                <div key={type} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {type.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
