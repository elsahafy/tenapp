'use client'

import AccountList from '@/components/accounts/AccountList'
import { AddAccountModal } from '@/components/accounts/AddAccountModal'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Amount } from '@/components/ui/amount'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { supabase } from '@/lib/supabase'
import { convertCurrency, updateExchangeRates } from '@/lib/utils/currencyConverter'
import type { Database } from '@/types/supabase'
import { BanknotesIcon, BuildingLibraryIcon, CreditCardIcon, PlusIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

type Account = Database['public']['Tables']['accounts']['Row']

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { preferences } = useUserPreferences()

  const fetchAccounts = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name')

      if (error) throw error

      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const bankAccounts = accounts.filter(account => !['credit_card', 'loan', 'investment'].includes(account.type))
  const creditCards = accounts.filter(account => account.type === 'credit_card')
  const loans = accounts.filter(account => account.type === 'loan')
  const investments = accounts.filter(account => account.type === 'investment')

  const calculateTotal = (accounts: Account[], accountType?: Account['type']) => {
    return accounts.reduce((total, account) => {
      let amount = account.current_balance
      // For loans and credit cards, ensure the amount is negative
      if (account.type === 'loan' || account.type === 'credit_card') {
        amount = -Math.abs(amount)
      }
      const convertedAmount = convertCurrency(
        amount,
        account.currency,
        preferences.preferredCurrency
      )
      return total + convertedAmount
    }, 0)
  }

  const bankTotal = calculateTotal(bankAccounts)
  const creditTotal = calculateTotal(creditCards)
  const loanTotal = calculateTotal(loans)
  const investmentTotal = calculateTotal(investments)

  useEffect(() => {
    updateExchangeRates()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your financial accounts and track your balances
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Add Account
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Bank Accounts Summary */}
          <Card className="relative overflow-hidden bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/10">
                    <BanknotesIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Bank Accounts</h3>
                    <p className="text-xs text-gray-500">{bankAccounts.length} accounts</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Amount
                  value={bankTotal}
                  currency={preferences.preferredCurrency}
                  className="text-2xl font-semibold text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">Your checking and savings accounts</p>
              </div>
            </div>
          </Card>

          {/* Credit Cards Summary */}
          <Card className="relative overflow-hidden bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10">
                    <CreditCardIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Credit Cards</h3>
                    <p className="text-xs text-gray-500">{creditCards.length} accounts</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Amount
                  value={creditTotal}
                  currency={preferences.preferredCurrency}
                  accountType="credit_card"
                  className="text-2xl font-semibold text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">Your credit card accounts</p>
              </div>
            </div>
          </Card>

          {/* Loans Summary */}
          <Card className="relative overflow-hidden bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-500/10">
                    <BuildingLibraryIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Loans</h3>
                    <p className="text-xs text-gray-500">{loans.length} accounts</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Amount
                  value={loanTotal}
                  currency={preferences.preferredCurrency}
                  accountType="loan"
                  className="text-2xl font-semibold text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">Your loan accounts</p>
              </div>
            </div>
          </Card>

          {/* Investments Summary */}
          <Card className="relative overflow-hidden bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-500/10">
                    <PresentationChartLineIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Investments</h3>
                    <p className="text-xs text-gray-500">{investments.length} accounts</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Amount
                  value={investmentTotal}
                  currency={preferences.preferredCurrency}
                  accountType="investment"
                  className="text-2xl font-semibold text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">Your investment accounts</p>
              </div>
            </div>
          </Card>
        </div>

        <AccountList accounts={accounts} onRefresh={fetchAccounts} />

        <AddAccountModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={fetchAccounts}
        />
      </div>
    </DashboardLayout>
  )
}
