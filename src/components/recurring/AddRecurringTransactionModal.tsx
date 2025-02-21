import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useCategories } from '@/lib/hooks/useCategories'
import { useRecurringTransactions } from '@/lib/hooks/useRecurringTransactions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { Modal } from '@/components/ui/Modal'
import { useUser } from '@supabase/auth-helpers-react'
import { RecurringFrequency, TransactionType } from '@/types/recurring'

const schema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  type: z.enum(['income', 'expense', 'transfer'] as const),
  account_id: z.string().min(1, 'Account is required'),
  transfer_account_id: z.string().optional(),
  category_id: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const),
  start_date: z.date(),
  end_date: z.date().optional().nullable(),
  day_of_month: z.number().min(1).max(31).optional(),
  day_of_week: z.number().min(0).max(6).optional(),
  week_of_month: z.number().min(1).max(5).optional()
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
}

export function AddRecurringTransactionModal({ open, onClose }: Props) {
  const user = useUser()
  const { accounts } = useAccounts()
  const { categories } = useCategories()
  const { addRecurringTransaction } = useRecurringTransactions()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      frequency: 'monthly',
      start_date: new Date()
    }
  })

  const transactionType = watch('type')

  const onSubmit = async (data: FormData) => {
    if (!user) return

    try {
      const {
        start_date,
        end_date,
        transfer_account_id,
        category_id,
        day_of_month,
        day_of_week,
        week_of_month,
        ...rest
      } = data
      
      await addRecurringTransaction({
        ...rest,
        user_id: user.id,
        active: true,
        last_generated: null,
        updated_at: new Date().toISOString(),
        start_date: start_date.toISOString(),
        end_date: end_date?.toISOString() || null,
        transfer_account_id: transfer_account_id || null,
        category_id: category_id || null,
        day_of_month: day_of_month || null,
        day_of_week: day_of_week || null,
        week_of_month: week_of_month || null
      })
      onClose()
    } catch (error) {
      console.error('Error adding recurring transaction:', error)
    }
  }

  const transactionTypes: { value: TransactionType; label: string }[] = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'transfer', label: 'Transfer' }
  ]

  const frequencies: { value: RecurringFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly (every 3 months)' },
    { value: 'yearly', label: 'Yearly' }
  ]

  return (
    <Modal open={open} onClose={onClose} title="Add Recurring Transaction">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <Select {...register('type')}>
            {transactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">From Account</label>
          <Select {...register('account_id')}>
            <option value="">Select account</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </div>

        {transactionType === 'transfer' && (
          <div>
            <label className="block text-sm font-medium mb-1">To Account</label>
            <Select {...register('transfer_account_id')}>
              <option value="">Select account</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input {...register('description')} />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <Input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
          )}
        </div>

        {transactionType !== 'transfer' && (
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select {...register('category_id')}>
              <option value="">Select category</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Frequency</label>
          <Select {...register('frequency')}>
            {frequencies.map((freq) => (
              <option key={freq.value} value={freq.value}>
                {freq.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <DatePicker
            selected={watch('start_date')}
            onChange={(date) => setValue('start_date', date || new Date())}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
          <DatePicker
            selected={watch('end_date')}
            onChange={(date) => setValue('end_date', date)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Transaction</Button>
        </div>
      </form>
    </Modal>
  )
}
