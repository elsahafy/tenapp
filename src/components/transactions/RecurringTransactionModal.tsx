import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'
import { Dialog, Transition } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']
type Category = Tables['categories']['Row']

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
  onSuccess: () => void
  accounts: Account[]
  categories: Category[]
  refetchTransactions: () => void
}

export function RecurringTransactionModal({
  open,
  onClose,
  onSuccess,
  accounts,
  categories,
  refetchTransactions,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'income',
      start_date: new Date(),
      frequency: 'monthly'
    }
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      console.log('Form data:', data)

      const recurringData = {
        description: data.description,
        amount: data.amount,
        type: data.type,
        account_id: data.account_id,
        category_id: data.category_id || null,
        transfer_account_id: data.transfer_account_id || null,
        user_id: user.id,
        frequency: data.frequency,
        start_date: data.start_date.toISOString(),
        next_occurrence: data.start_date.toISOString(),
        end_date: data.end_date?.toISOString() || null,
        day_of_month: data.day_of_month || null,
        day_of_week: data.day_of_week || null,
        week_of_month: data.week_of_month || null,
        active: true
      }

      console.log('Recurring transaction data:', recurringData)

      const { data: result, error: insertError } = await supabase
        .from('recurring_transactions')
        .insert(recurringData)
        .select()

      if (insertError) {
        console.error('Error inserting recurring transaction:', insertError)
        throw insertError
      }

      console.log('Recurring transaction created:', result)

      await refetchTransactions()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating recurring transaction:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const transactionType = watch('type')
  const filteredCategories = categories.filter(c => c.type === transactionType)

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly (every 3 months)' },
    { value: 'yearly', label: 'Yearly' }
  ]

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Add Recurring Transaction
                    </Dialog.Title>
                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                      <div className="space-y-4">
                        <FormField label="Type" error={errors.type?.message}>
                          <Select {...register('type')}>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="transfer">Transfer</option>
                          </Select>
                        </FormField>

                        <FormField label="Description" error={errors.description?.message}>
                          <Input {...register('description')} />
                        </FormField>

                        <FormField label="Amount" error={errors.amount?.message}>
                          <Input
                            type="number"
                            step="0.01"
                            {...register('amount', { valueAsNumber: true })}
                          />
                        </FormField>

                        <FormField label="Account" error={errors.account_id?.message}>
                          <Select {...register('account_id')}>
                            <option value="">Select account</option>
                            {accounts.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))}
                          </Select>
                        </FormField>

                        {transactionType === 'transfer' && (
                          <FormField label="Transfer To" error={errors.transfer_account_id?.message}>
                            <Select {...register('transfer_account_id')}>
                              <option value="">Select account</option>
                              {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.name}
                                </option>
                              ))}
                            </Select>
                          </FormField>
                        )}

                        {transactionType !== 'transfer' && (
                          <FormField label="Category" error={errors.category_id?.message}>
                            <Select {...register('category_id')}>
                              <option value="">Select category</option>
                              {filteredCategories.map(category => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </Select>
                          </FormField>
                        )}

                        <FormField label="Frequency" error={errors.frequency?.message}>
                          <Select {...register('frequency')}>
                            {frequencies.map(freq => (
                              <option key={freq.value} value={freq.value}>
                                {freq.label}
                              </option>
                            ))}
                          </Select>
                        </FormField>

                        <FormField label="Start Date" error={errors.start_date?.message}>
                          <DatePicker
                            onChange={(date: Date | null) => setValue('start_date', date || new Date())}
                            selected={watch('start_date')}
                            placeholderText="Select start date"
                          />
                        </FormField>

                        <FormField label="End Date (Optional)" error={errors.end_date?.message}>
                          <DatePicker
                            onChange={(date: Date | null) => setValue('end_date', date)}
                            selected={watch('end_date')}
                            placeholderText="Optional end date"
                          />
                        </FormField>
                      </div>

                      {error && (
                        <div className="mt-4 text-sm text-red-600">
                          {error}
                        </div>
                      )}

                      <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                          Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                          Create
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
