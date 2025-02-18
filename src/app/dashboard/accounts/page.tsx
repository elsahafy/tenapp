'use client'

import { AccountList } from '@/components/accounts/AccountList'
import { CreateAccountModal } from '@/components/accounts/CreateAccountModal'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Suspense, useState } from 'react'

export default function AccountsPage() {
  const { accounts, loading, error } = useAccounts()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">Accounts</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your financial accounts and track your balances
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

        <div className="mt-8">
          {error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading accounts</h3>
                  <p className="mt-2 text-sm text-red-700">{error.message}</p>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-32 rounded-lg border border-gray-300 bg-gray-100"
                  />
                ))}
              </div>
            </div>
          ) : (
            <Suspense fallback={<div>Loading...</div>}>
              <AccountList accounts={accounts || []} />
            </Suspense>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false)
          }}
        />
      )}
    </DashboardLayout>
  )
}
