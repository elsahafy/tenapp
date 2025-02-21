'use client'

import { Card } from '@/components/ui/Card'
import { Amount } from '@/components/ui/amount'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { convertCurrency } from '@/lib/utils/currencyConverter'
import type { Database } from '@/types/supabase'
import { BanknotesIcon, BuildingLibraryIcon, CreditCardIcon, PencilIcon, PresentationChartLineIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { DeleteAccountModal } from './DeleteAccountModal'
import { EditAccountModal } from './EditAccountModal'

type Account = Database['public']['Tables']['accounts']['Row']

interface AccountListProps {
  accounts: Account[]
  onRefresh: () => Promise<void>
}

interface AccountGroupProps {
  title: string
  total: number
  accounts: Account[]
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
  type: 'bank' | 'credit' | 'loan' | 'investment'
}

const groupStyles = {
  bank: {
    gradient: 'from-blue-500/5',
    icon: BanknotesIcon,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
  },
  credit: {
    gradient: 'from-red-500/5',
    icon: CreditCardIcon,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600',
  },
  loan: {
    gradient: 'from-amber-500/5',
    icon: BuildingLibraryIcon,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
  },
  investment: {
    gradient: 'from-green-500/5',
    icon: PresentationChartLineIcon,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-600',
  },
}

function AccountGroup({ title, total, accounts, onEdit, onDelete, type }: AccountGroupProps) {
  const userPreferences = useUserPreferences();
  const styles = groupStyles[type]
  const Icon = styles.icon

  if (accounts.length === 0) {
    return (
      <Card className="relative overflow-hidden bg-white">
        <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none", styles.gradient)} />
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className={cn("h-8 w-8 flex items-center justify-center rounded-lg", styles.iconBg)}>
              <Icon className={cn("h-5 w-5", styles.iconColor)} />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">No accounts in this category</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden bg-white h-full">
      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none", styles.gradient)} />
      <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("h-8 w-8 flex items-center justify-center rounded-lg", styles.iconBg)}>
              <Icon className={cn("h-5 w-5", styles.iconColor)} />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{accounts.length} accounts</p>
            </div>
          </div>
          <Amount value={total} currency="AED" className="text-sm font-medium text-gray-900" />
        </div>
      </div>
      <ul role="list" className="divide-y divide-gray-100">
        {accounts.map((account) => (
          <li key={account.id} className="group relative flex items-center justify-between gap-x-6 px-4 py-5 hover:bg-gray-50/80 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-start gap-x-3">
                <p className="text-sm font-medium leading-6 text-gray-900">{account.name}</p>
              </div>
              {account.institution && (
                <p className="mt-1 text-xs leading-5 text-gray-500">{account.institution}</p>
              )}
            </div>
            <div className="flex items-center gap-x-6">
              <div className="flex flex-col items-end">
                <Amount
                  value={account.current_balance}
                  currency={account.currency}
                  accountType={account.type}
                  className="text-sm font-medium text-gray-900"
                />
                {account.currency !== userPreferences.preferences.preferredCurrency && (
                  <Amount
                    value={convertCurrency(
                      account.current_balance,
                      account.currency,
                      userPreferences.preferences.preferredCurrency
                    )}
                    currency={userPreferences.preferences.preferredCurrency}
                    accountType={account.type}
                    className="text-xs text-gray-500"
                  />
                )}
              </div>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onEdit(account)}
                  className="rounded-md p-2 hover:bg-gray-50"
                >
                  <PencilIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(account)}
                  className="rounded-md p-2 hover:bg-gray-50"
                >
                  <TrashIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function AccountList({ accounts, onRefresh }: AccountListProps) {
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const userPreferences = useUserPreferences()

  // Group accounts by type
  const bankAccounts = accounts.filter(account => account.type === 'checking' || account.type === 'savings')
  const creditCards = accounts.filter(account => account.type === 'credit_card')
  const loans = accounts.filter(account => account.type === 'loan')
  const investments = accounts.filter(account => account.type === 'investment')

  const handleEdit = (account: Account) => {
    setAccountToEdit(account)
    setIsEditModalOpen(true)
  }

  const handleDelete = (account: Account) => {
    setAccountToEdit(account)
    setIsDeleteModalOpen(true)
  }

  const handleRefresh = async () => {
    await onRefresh()
  }

  const handleDeleteAccount = async () => {
    if (!accountToEdit) return

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountToEdit.id)

    if (error) {
      throw error
    }

    setIsDeleteModalOpen(false)
    await handleRefresh()
  }

  const calculateTotal = (accounts: Account[]) => {
    return accounts.reduce((total, account) => total + account.current_balance, 0)
  }

  return (
    <div className="space-y-8">
      {/* Bank Accounts and Credit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bank Accounts */}
        <Card className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/10">
                <BanknotesIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-7 text-gray-900">Bank Accounts</h2>
                <p className="text-sm text-gray-500">{bankAccounts.length} accounts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {bankAccounts.map(account => (
                <Card key={account.id} className="group relative">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-500/10">
                          <BanknotesIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{account.name}</h3>
                          <p className="text-xs text-gray-500">{account.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <div className="flex flex-col items-end">
                          <Amount
                            value={account.current_balance}
                            currency={account.currency}
                            accountType={account.type}
                            className="text-sm font-medium text-gray-900"
                          />
                          {account.currency !== userPreferences.preferences.preferredCurrency && (
                            <Amount
                              value={convertCurrency(
                                account.current_balance,
                                account.currency,
                                userPreferences.preferences.preferredCurrency
                              )}
                              currency={userPreferences.preferences.preferredCurrency}
                              accountType={account.type}
                              className="text-xs text-gray-500"
                            />
                          )}
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEdit(account)}
                            className="rounded-md p-1 hover:bg-gray-50"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(account)}
                            className="rounded-md p-1 hover:bg-gray-50"
                          >
                            <TrashIcon className="h-4 w-4 text-red-400" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>

        {/* Credit Cards */}
        <Card className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10">
                <CreditCardIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-7 text-gray-900">Credit Cards</h2>
                <p className="text-sm text-gray-500">{creditCards.length} accounts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {creditCards.map(account => (
                <Card key={account.id} className="group relative">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10">
                          <CreditCardIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{account.name}</h3>
                          <p className="text-xs text-gray-500">{account.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <div className="flex flex-col items-end">
                          <Amount
                            value={account.current_balance}
                            currency={account.currency}
                            accountType={account.type}
                            className="text-sm font-medium text-gray-900"
                          />
                          {account.currency !== userPreferences.preferences.preferredCurrency && (
                            <Amount
                              value={convertCurrency(
                                account.current_balance,
                                account.currency,
                                userPreferences.preferences.preferredCurrency
                              )}
                              currency={userPreferences.preferences.preferredCurrency}
                              accountType={account.type}
                              className="text-xs text-gray-500"
                            />
                          )}
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEdit(account)}
                            className="rounded-md p-1 hover:bg-gray-50"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(account)}
                            className="rounded-md p-1 hover:bg-gray-50"
                          >
                            <TrashIcon className="h-4 w-4 text-red-400" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Loans and Investments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loans */}
        <Card className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-500/10">
                <BuildingLibraryIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-7 text-gray-900">Loans</h2>
                <p className="text-sm text-gray-500">{loans.length} accounts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {loans.map(account => (
                <Card key={account.id} className="group relative">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-500/10">
                          <BuildingLibraryIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{account.name}</h3>
                          <p className="text-xs text-gray-500">{account.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <div className="flex flex-col items-end">
                          <Amount
                            value={account.current_balance}
                            currency={account.currency}
                            accountType={account.type}
                            className="text-sm font-medium text-gray-900"
                          />
                          {account.currency !== userPreferences.preferences.preferredCurrency && (
                            <Amount
                              value={convertCurrency(
                                account.current_balance,
                                account.currency,
                                userPreferences.preferences.preferredCurrency
                              )}
                              currency={userPreferences.preferences.preferredCurrency}
                              accountType={account.type}
                              className="text-xs text-gray-500"
                            />
                          )}
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEdit(account)}
                            className="rounded-md p-1 hover:bg-gray-50"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(account)}
                            className="rounded-md p-1 hover:bg-gray-50"
                          >
                            <TrashIcon className="h-4 w-4 text-red-400" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>

        {/* Investments */}
        <Card className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-500/10">
                <PresentationChartLineIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-7 text-gray-900">Investments</h2>
                <p className="text-sm text-gray-500">{investments.length} accounts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {investments.map(account => (
                <Card key={account.id} className="group relative">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-green-500/10">
                          <PresentationChartLineIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{account.name}</h3>
                          <p className="text-xs text-gray-500">{account.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <div className="flex flex-col items-end">
                          <Amount
                            value={account.current_balance}
                            currency={account.currency}
                            accountType={account.type}
                            className="text-sm font-medium text-gray-900"
                          />
                          {account.currency !== userPreferences.preferences.preferredCurrency && (
                            <Amount
                              value={convertCurrency(
                                account.current_balance,
                                account.currency,
                                userPreferences.preferences.preferredCurrency
                              )}
                              currency={userPreferences.preferences.preferredCurrency}
                              accountType={account.type}
                              className="text-xs text-gray-500"
                            />
                          )}
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEdit(account)}
                            className="rounded-md p-1 hover:bg-gray-50"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(account)}
                            className="rounded-md p-1 hover:bg-gray-50"
                          >
                            <TrashIcon className="h-4 w-4 text-red-400" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <EditAccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleRefresh}
        account={accountToEdit || undefined}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteAccount}
        account={accountToEdit}
      />
    </div>
  )
}
