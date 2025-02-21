'use client'

import type { Database } from '@/lib/database.types'
import { ChartBarIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { DeleteAccountModal } from '../accounts/DeleteAccountModal'
import { EditAccountModal } from '../accounts/EditAccountModal'
import DebtPayoffHistory from './DebtPayoffHistory'

type Tables = Database['public']['Tables']
type BaseAccount = Tables['accounts']['Row']

// Extend the base Account type with all required fields
type Account = BaseAccount & {
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

interface DebtAccountListProps {
  accounts: Account[]
  onAccountsChange: () => Promise<void>
}

export function DebtAccountList({ accounts, onAccountsChange }: DebtAccountListProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPayoffHistory, setShowPayoffHistory] = useState(false)

  const handleClose = () => {
    setShowEditModal(false)
    setShowDeleteModal(false)
    setShowPayoffHistory(false)
    setSelectedAccount(null)
  }

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Debt Accounts</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage your credit cards and loans
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {accounts.length === 0 ? (
            <li className="px-4 py-5 sm:px-6">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No debt accounts</h3>
                <p className="mt-1 text-sm text-gray-500">Add a credit card or loan to get started.</p>
              </div>
            </li>
          ) : (
            accounts.map((account) => (
              <li key={account.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {account.type === 'credit_card' ? (
                        <svg
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{account.name}</div>
                      <div className="text-sm text-gray-500">
                        Balance: {account.current_balance.toLocaleString('en-US', {
                          style: 'currency',
                          currency: account.currency,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccount(account)
                        setShowPayoffHistory(true)
                      }}
                      className="inline-flex items-center rounded-full border border-gray-300 bg-white p-2 text-gray-400 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccount(account)
                        setShowEditModal(true)
                      }}
                      className="inline-flex items-center rounded-full border border-gray-300 bg-white p-2 text-gray-400 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      <PencilIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccount(account)
                        setShowDeleteModal(true)
                      }}
                      className="inline-flex items-center rounded-full border border-gray-300 bg-white p-2 text-gray-400 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {selectedAccount && (
        <>
          <EditAccountModal
            isOpen={showEditModal}
            onClose={handleClose}
            account={selectedAccount}
            onSave={async () => {
              await onAccountsChange()
              handleClose()
            }}
          />
          <DeleteAccountModal
            isOpen={showDeleteModal}
            onClose={handleClose}
            account={selectedAccount}
            onDelete={async () => {
              await onAccountsChange()
              handleClose()
            }}
          />
          <DebtPayoffHistory
            open={showPayoffHistory}
            onClose={handleClose}
            accountId={selectedAccount.id}
          />
        </>
      )}
    </div>
  )
}
