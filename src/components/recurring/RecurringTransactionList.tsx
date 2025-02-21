import { useState } from 'react'
import { format } from 'date-fns'
import { useRecurringTransactions } from '@/lib/hooks/useRecurringTransactions'
import { formatCurrency } from '@/lib/utils/currency'
import { RecurringTransactionWithDetails } from '@/types/recurring'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AddRecurringTransactionModal } from './AddRecurringTransactionModal'
import { DeleteRecurringTransactionModal } from './DeleteRecurringTransactionModal'

export function RecurringTransactionList() {
  const { recurringTransactions, toggleRecurringTransaction } = useRecurringTransactions()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransactionWithDetails | null>(null)

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly (every 3 months)',
      yearly: 'Yearly'
    }
    return labels[frequency as keyof typeof labels] || frequency
  }

  const getStatusVariant = (active: boolean) => {
    return active ? 'success' : 'secondary'
  }

  const getStatusLabel = (active: boolean) => {
    return active ? 'Active' : 'Paused'
  }

  const handleToggle = async (transaction: RecurringTransactionWithDetails) => {
    await toggleRecurringTransaction(transaction.id, !transaction.active)
  }

  const handleDelete = (transaction: RecurringTransactionWithDetails) => {
    setSelectedTransaction(transaction)
    setShowDeleteModal(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recurring Transactions</h2>
        <Button onClick={() => setShowAddModal(true)}>Add New</Button>
      </div>

      <div className="space-y-4">
        {recurringTransactions?.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{transaction.description}</h3>
                <p className="text-sm text-gray-500">
                  {getFrequencyLabel(transaction.frequency)} •{' '}
                  {transaction.next_occurrence && format(new Date(transaction.next_occurrence), 'MMM d, yyyy')}
                </p>
                <p className="text-sm">
                  From: {transaction.account?.name}
                  {transaction.transfer_account && ` To: ${transaction.transfer_account.name}`}
                </p>
                <p className="font-medium mt-1">
                  {formatCurrency(transaction.amount, 'USD')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusVariant(transaction.active)}>
                  {getStatusLabel(transaction.active)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggle(transaction)}
                >
                  {transaction.active ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(transaction)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddRecurringTransactionModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showDeleteModal && selectedTransaction && (
        <DeleteRecurringTransactionModal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedTransaction(null)
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  )
}
