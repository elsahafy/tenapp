import { RecurringTransactionWithDetails } from '@/types/recurring'
import { useRecurringTransactions } from '@/lib/hooks/useRecurringTransactions'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  transaction: RecurringTransactionWithDetails
}

export function DeleteRecurringTransactionModal({ open, onClose, transaction }: Props) {
  const { deleteRecurringTransaction } = useRecurringTransactions()

  const handleDelete = async () => {
    try {
      await deleteRecurringTransaction(transaction.id)
      onClose()
    } catch (error) {
      console.error('Error deleting recurring transaction:', error)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Recurring Transaction"
    >
      <div className="space-y-4">
        <p>
          Are you sure you want to delete this recurring transaction?
          This action cannot be undone.
        </p>
        <p className="font-medium">{transaction.description}</p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
