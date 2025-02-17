'use client'

import { useState } from 'react'
import type { Database } from '@/lib/types/database'
import { EditAccountModal } from './EditAccountModal'
import { DeleteAccountModal } from './DeleteAccountModal'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']
type Currency = 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'QAR' | 'BHD' | 'KWD' | 'OMR'

interface AccountListProps {
  accounts: Account[]
  onUpdate?: () => Promise<void>
}

export function AccountList({ accounts, onUpdate }: AccountListProps) {
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null)

  const handleAccountUpdated = async () => {
    setEditAccount(null)
    setDeleteAccount(null)
    await onUpdate?.()
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 hover:border-gray-400"
        >
          <div className="min-w-0 flex-1">
            <div className="focus:outline-none">
              <p className="text-sm font-medium text-gray-900">{account.name}</p>
              <p className="truncate text-sm text-gray-500">
                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: (account.currency as Currency) || 'USD'
                }).format(account.current_balance)}
              </p>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => setEditAccount(account)}
                  className="text-primary-600 hover:text-primary-900"
                >
                  <PencilIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Edit {account.name}</span>
                </button>
                <button
                  onClick={() => setDeleteAccount(account)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Delete {account.name}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {editAccount && (
        <EditAccountModal
          isOpen={!!editAccount}
          account={editAccount}
          onClose={() => setEditAccount(null)}
          onSave={handleAccountUpdated}
        />
      )}
      {deleteAccount && (
        <DeleteAccountModal
          isOpen={!!deleteAccount}
          account={deleteAccount}
          onClose={() => setDeleteAccount(null)}
          onDelete={handleAccountUpdated}
        />
      )}
    </div>
  )
}
