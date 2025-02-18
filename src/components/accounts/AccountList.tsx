'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useState } from 'react'

export default function AccountList() {
  const [accounts, setAccounts] = useState([])

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Accounts</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Manage your financial accounts and track balances
            </p>
          </div>
          <Button>
            Add Account
          </Button>
        </div>

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
            <h3 className="mt-4 text-sm font-medium text-[var(--text-primary)]">No accounts yet</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Get started by adding your first account.
            </p>
            <Button className="mt-4">
              Add Account
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
