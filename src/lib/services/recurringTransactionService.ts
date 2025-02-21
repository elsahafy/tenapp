import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/types/database'
import { addDays, addMonths, addWeeks, addYears } from 'date-fns'

type Tables = Database['public']['Tables']
export type RecurringTransaction = Tables['recurring_transactions']['Row']
type RecurringTransactionInsert = Tables['recurring_transactions']['Insert']
type RecurringTransactionUpdate = Tables['recurring_transactions']['Update']

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface RecurringTransactionWithNextDate extends RecurringTransaction {
  next_date: string
}

function calculateNextDate(
  currentDate: Date,
  frequency: RecurringTransaction['frequency'],
  interval: number
): Date {
  switch (frequency) {
    case 'daily':
      return addDays(currentDate, interval)
    case 'weekly':
      return addWeeks(currentDate, interval)
    case 'monthly':
      return addMonths(currentDate, interval)
    case 'yearly':
      return addYears(currentDate, interval)
    default:
      throw new Error(`Invalid frequency: ${frequency}`)
  }
}

export async function getRecurringTransactions(
  userId: string
): Promise<RecurringTransactionWithNextDate[]> {
  const { data: transactions, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  if (error) throw error

  return (transactions || []).map(transaction => ({
    ...transaction,
    next_date: calculateNextDate(
      new Date(transaction.last_date || transaction.start_date),
      transaction.frequency,
      transaction.interval
    ).toISOString()
  }))
}

export async function createRecurringTransaction(
  userId: string,
  data: Omit<RecurringTransactionInsert, 'id' | 'user_id' | 'created_at'>
): Promise<RecurringTransaction> {
  const { data: transaction, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: userId,
      ...data,
      active: true
    })
    .select()
    .single()

  if (error) throw error
  if (!transaction) throw new Error('Failed to create recurring transaction')

  return transaction
}

export async function updateRecurringTransaction(
  id: string,
  data: RecurringTransactionUpdate
): Promise<void> {
  const { error } = await supabase
    .from('recurring_transactions')
    .update(data)
    .eq('id', id)

  if (error) throw error
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_transactions')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
}

export async function processRecurringTransactions(): Promise<void> {
  const { data: transactions, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('active', true)

  if (error) throw error
  if (!transactions) return

  const now = new Date()
  const processedTransactions: any[] = []

  for (const transaction of transactions) {
    const nextDate = calculateNextDate(
      new Date(transaction.last_date || transaction.start_date),
      transaction.frequency,
      transaction.interval
    )

    if (nextDate <= now) {
      // Create the transaction
      processedTransactions.push({
        user_id: transaction.user_id,
        account_id: transaction.account_id,
        category_id: transaction.category_id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: nextDate.toISOString().split('T')[0],
        recurring_transaction_id: transaction.id
      })

      // Update last_date
      await supabase
        .from('recurring_transactions')
        .update({ last_date: nextDate.toISOString() })
        .eq('id', transaction.id)
    }
  }

  if (processedTransactions.length > 0) {
    const { error: insertError } = await supabase
      .from('transactions')
      .insert(processedTransactions)

    if (insertError) throw insertError
  }
}
