'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { Amount } from '@/components/ui/amount'
import { Card } from '@/components/ui/Card'
import { PlusIcon } from '@heroicons/react/24/outline'
import { CreateAccountModal } from '@/components/accounts/CreateAccountModal'
import {
  BanknotesIcon,
  CreditCardIcon,
  HomeModernIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline'

type Account = Database['public']['Tables']['accounts']['Row']

interface DebtSummary {
  totalDebt: number
  monthlyPayment: number
  interestPaid: number
  projectedPayoffMonths: number
  accounts: Account[]
}

export default function DebtOverview() {
  const [summary, setSummary] = useState<DebtSummary>({
    totalDebt: 0,
    monthlyPayment: 0,
    interestPaid: 0,
    projectedPayoffMonths: 0,
    accounts: []
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchDebtSummary()
  }, [])

  const fetchDebtSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['credit_card', 'loan'])
        .eq('is_active', true)

      if (error) throw error

      const debtAccounts = accounts as Account[]
      const totalDebt = debtAccounts.reduce((sum, account) => sum + account.current_balance, 0)
      
      // For now, use simple calculations
      const avgInterestRate = debtAccounts.reduce((sum, account) => sum + (account.interest_rate || 0), 0) / debtAccounts.length || 0
      const monthlyPayment = totalDebt * 0.05 // Assume 5% monthly payment
      const interestPaid = totalDebt * (avgInterestRate / 100) // Simple interest calculation
      const projectedPayoffMonths = totalDebt / monthlyPayment

      setSummary({
        totalDebt,
        monthlyPayment,
        interestPaid,
        projectedPayoffMonths,
        accounts: debtAccounts
      })
    } catch (error) {
      console.error('Error fetching debt summary:', error)
    } finally {
      setLoading(false)
    }
  }

  async function refetch() {
    await fetchDebtSummary()
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3">
                <BanknotesIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Debt</dt>
                  <dd>
                    <Amount value={summary.totalDebt} />
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3">
                <CreditCardIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Payment</dt>
                  <dd>
                    <Amount value={summary.monthlyPayment} />
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3">
                <HomeModernIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Interest Paid</dt>
                  <dd>
                    <Amount value={summary.interestPaid} />
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3">
                <BuildingLibraryIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Payoff Time</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.ceil(summary.projectedPayoffMonths)} months
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Your Debt Accounts
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                A list of all your active debt accounts including credit cards and loans.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <PlusIcon className="inline-block h-5 w-5 mr-1" />
                Add Account
              </button>
            </div>
          </div>

          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  {summary.accounts.map((account) => (
                    <div key={account.id} className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{account.name}</h4>
                          <p className="text-sm text-gray-500">{account.institution || 'No institution'}</p>
                        </div>
                        <div className="text-right">
                          <Amount
                            value={account.current_balance}
                            currency={account.currency}
                          />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="h-2 w-full bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-primary-600 rounded-full"
                            style={{ width: `${Math.min((account.current_balance / summary.totalDebt) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSave={async () => {
            await refetch()
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}
