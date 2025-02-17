'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { EditDebtModal } from './EditDebtModal'
import { DeleteDebtModal } from './DeleteDebtModal'
import { Debt } from '@/types'

export function DebtList() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [editDebt, setEditDebt] = useState<Debt | null>(null)
  const [deleteDebt, setDeleteDebt] = useState<Debt | null>(null)

  useEffect(() => {
    fetchDebts()
  }, [])

  async function fetchDebts() {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('current_balance', { ascending: false })

      if (error) throw error
      if (data) {
        const typedDebts: Debt[] = data.map(debt => ({
          ...debt,
          active: debt.active ?? true
        }))
        setDebts(typedDebts)
      }
    } catch (error) {
      console.error('Error fetching debts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDebtUpdated = () => {
    fetchDebts()
    setEditDebt(null)
  }

  const handleDebtDeleted = () => {
    fetchDebts()
    setDeleteDebt(null)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
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
        <h2 className="text-base font-semibold text-gray-900 mb-4">Active Debts</h2>
        <div className="space-y-4">
          {debts.length > 0 ? (
            debts.map((debt) => (
              <div
                key={debt.id}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {debt.name}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                        debt.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {debt.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-x-2">
                    <span>
                      Due: {format(new Date(debt.due_date), 'MMM d, yyyy')}
                    </span>
                    <span>•</span>
                    <span>{debt.interest_rate}% APR</span>
                    <span>•</span>
                    <span>
                      Min Payment: ${debt.minimum_payment.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${debt.current_balance.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditDebt(debt)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeleteDebt(debt)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No active debts found.</p>
              <p className="text-sm text-gray-400 mt-1">
                Add a debt to start tracking your payments and progress.
              </p>
            </div>
          )}
        </div>
      </div>

      {editDebt && (
        <EditDebtModal
          debt={editDebt}
          onClose={() => setEditDebt(null)}
          onSave={handleDebtUpdated}
        />
      )}

      {deleteDebt && (
        <DeleteDebtModal
          debt={deleteDebt}
          onClose={() => setDeleteDebt(null)}
          onDelete={handleDebtDeleted}
        />
      )}
    </div>
  )
}
