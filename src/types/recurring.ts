import { Database } from './database.types'
import { Account, Category, Subcategory } from './accounts'

export type RecurringTransaction = Database['public']['Tables']['recurring_transactions']['Row']
export type RecurringTransactionInsert = Database['public']['Tables']['recurring_transactions']['Insert']
export type RecurringTransactionUpdate = Database['public']['Tables']['recurring_transactions']['Update']

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface RecurringTransactionWithDetails extends Omit<RecurringTransaction, 'next_occurrence'> {
  account?: {
    id: string;
    name: string;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
  transfer_account?: {
    id: string;
    name: string;
  } | null;
  next_occurrence: string;
  active: boolean;
}
