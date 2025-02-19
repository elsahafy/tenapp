'use client'

import { useState } from 'react'
import { EditAccountModal } from '@/components/accounts/EditAccountModal'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { formatCurrencyWithCode, convertCurrency } from '@/lib/utils/currencyConverter'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PlusIcon, PencilIcon, TrashIcon, CreditCardIcon, BanknotesIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']
type AccountType = Database['public']['Enums']['account_type']

interface AccountGroup {
  title: string
  type: AccountType | AccountType[]
  icon: React.ElementType
  description: string
}

const accountGroups: AccountGroup[] = [
  {
    title: 'Bank Accounts',
    type: ['checking', 'savings'],
    icon: BanknotesIcon,
    description: 'Your checking and savings accounts'
  },
  {
    title: 'Credit Cards',
    type: 'credit_card',
    icon: CreditCardIcon,
    description: 'Your credit card accounts'
  },
  {
    title: 'Investments',
    type: ['investment', 'loan'],
    icon: BuildingLibraryIcon,
    description: 'Your investment and loan accounts'
  }
]

export default function AccountsPage() {
  const { preferences } = useUserPreferences()
  const { accounts, loading, error, refetch: fetchAccounts } = useAccounts()
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  function getAccountsByType(types: AccountType | AccountType[]) {
    const typeArray = Array.isArray(types) ? types : [types]
    return (accounts ?? []).filter(account => typeArray.includes(account.type))
  }

  function getGroupTotal(types: AccountType | AccountType[], currency?: string) {
    if (!preferences.preferredCurrency) return 0
    
    const accountsInGroup = getAccountsByType(types)
    const filteredAccounts = currency 
      ? accountsInGroup.filter(account => account.currency === currency)
      : accountsInGroup

    return filteredAccounts.reduce((total, account) => {
      const convertedBalance = convertCurrency(
        account.current_balance,
        account.currency,
        preferences.preferredCurrency
      )
      return account.type === 'credit_card' ? total - convertedBalance : total + convertedBalance
    }, 0)
  }

  function groupAccountsByCurrency(accounts: Account[]) {
    return accounts.reduce((groups, account) => {
      const currency = account.currency
      if (!groups[currency]) {
        groups[currency] = []
      }
      groups[currency].push(account)
      return groups
    }, {} as Record<string, Account[]>)
  }

  const currencyNames: Record<string, string> = {
    AED: 'UAE Dirham',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    SAR: 'Saudi Riyal',
    QAR: 'Qatari Riyal',
    BHD: 'Bahraini Dinar',
    KWD: 'Kuwaiti Dinar',
    OMR: 'Omani Rial',
    EGP: 'Egyptian Pound'
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Accounts</h1>
            <p className="text-sm text-gray-500">Manage your financial accounts and track your balances</p>
          </div>
          <Button onClick={() => {
            setSelectedAccount(null)
            setIsEditModalOpen(true)
          }}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Account
          </Button>
        </div>

        {error ? (
          <div className="text-red-600">Error loading accounts: {error.message}</div>
        ) : loading ? (
          <div className="text-gray-500">Loading accounts...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accountGroups.map((group) => {
              const groupAccounts = getAccountsByType(group.type)
              const currencyGroups = groupAccountsByCurrency(groupAccounts)

              return (
                <Card key={group.title} className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <group.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{group.title}</CardTitle>
                        <p className="text-sm text-gray-500">{group.description}</p>
                      </div>
                    </div>
                    {preferences.preferredCurrency && (
                      <p className="text-lg font-medium">
                        {formatCurrencyWithCode(getGroupTotal(group.type), preferences.preferredCurrency)}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {(() => {
                        return Object.entries(currencyGroups).map(([currency, accounts]) => (
                          <div key={currency} className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h3 className="text-sm font-medium text-gray-500">
                                {currencyNames[currency] || currency}
                              </h3>
                              {preferences.preferredCurrency && (
                                <p className="text-sm font-medium">
                                  {formatCurrencyWithCode(getGroupTotal(group.type, currency), preferences.preferredCurrency)}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              {accounts.map((account) => {
                                if (!preferences.preferredCurrency) return null
                                
                                const convertedBalance = convertCurrency(
                                  account.current_balance,
                                  account.currency,
                                  preferences.preferredCurrency
                                )

                                return (
                                  <div
                                    key={account.id}
                                    className={cn(
                                      'group flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100',
                                      'transition-all duration-200 hover:shadow-sm hover:border-blue-100'
                                    )}
                                  >
                                    <div>
                                      <h3 className="font-medium text-gray-900">{account.name}</h3>
                                      <p className="text-sm text-gray-500">{account.institution || 'No institution'}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <div className="text-right">
                                        <p className={cn(
                                          "font-medium",
                                          account.type === 'credit_card' ? 'text-red-600' : 'text-gray-900'
                                        )}>
                                          {account.type === 'credit_card' ? '-' : ''}
                                          {formatCurrencyWithCode(convertedBalance, preferences.preferredCurrency)}
                                        </p>
                                        {account.currency !== preferences.preferredCurrency && (
                                          <p className="text-sm text-gray-500">
                                            {account.type === 'credit_card' ? '-' : ''}
                                            {formatCurrencyWithCode(account.current_balance, account.currency)}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedAccount(account)
                                            setIsEditModalOpen(true)
                                          }}
                                        >
                                          <PencilIcon className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (confirm('Are you sure you want to delete this account?')) {
                                              fetchAccounts()
                                            }
                                          }}
                                        >
                                          <TrashIcon className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      })()}
                      {getAccountsByType(group.type).length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No accounts in this category</p>
                          <Button
                            variant="link"
                            onClick={() => {
                              setSelectedAccount(null)
                              setIsEditModalOpen(true)
                            }}
                          >
                            Add one now
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <EditAccountModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={fetchAccounts}
          account={selectedAccount ?? undefined}
        />
      </div>
    </DashboardLayout>
  )
}
