'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Amount } from '@/components/ui/amount'
import { EditAccountModal } from '@/components/accounts/EditAccountModal'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'
import { useState } from 'react'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']

interface AccountListProps {
  accounts: Account[];
  onRefresh: () => Promise<void>;
}

export default function AccountList({ accounts, onRefresh }: AccountListProps) {
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDelete = async (account: Account) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', account.id)

      if (error) throw error
      await onRefresh()
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="p-6">
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                {accounts.length === 0 ? (
                  <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-primary)] p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-50)]">
                      <svg
                        className="h-6 w-6 text-[var(--primary-600)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">No accounts</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Get started by creating a new account.
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Account
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Type
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Institution
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                          Balance
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {accounts.map((account) => (
                        <tr key={account.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {account.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                            {account.type.replace('_', ' ')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {account.institution || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                            <Amount value={account.current_balance} currency={account.currency} />
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              type="button"
                              onClick={() => setEditingAccount(account)}
                              className="text-primary-600 hover:text-primary-900 mr-4"
                              disabled={loading}
                            >
                              <PencilIcon className="h-5 w-5" />
                              <span className="sr-only">Edit {account.name}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(account)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading}
                            >
                              <TrashIcon className="h-5 w-5" />
                              <span className="sr-only">Delete {account.name}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingAccount && (
        <EditAccountModal
          isOpen={true}
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSave={async () => {
            await onRefresh()
            setEditingAccount(null)
          }}
        />
      )}
    </Card>
  )
}
