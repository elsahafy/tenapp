import { supabase } from '@/lib/supabase'
import { Transaction } from '@/types/transactions'

export interface ExportOptions {
  startDate?: string
  endDate?: string
  categories?: string[]
  types?: ('income' | 'expense' | 'transfer')[]
  includeCategories?: boolean
  includeAccounts?: boolean
}

export async function exportTransactionsToCSV(
  userId: string,
  options: ExportOptions = {}
): Promise<string> {
  try {
    // Build the query
    let query = supabase
      .from('transactions')
      .select(
        `
        *,
        categories (
          name
        ),
        accounts (
          name,
          currency
        )
      `
      )
      .eq('user_id', userId)
      .order('date', { ascending: false })

    // Apply filters
    if (options.startDate) {
      query = query.gte('date', options.startDate)
    }
    if (options.endDate) {
      query = query.lte('date', options.endDate)
    }
    if (options.categories && options.categories.length > 0) {
      query = query.in('category_id', options.categories)
    }
    if (options.types && options.types.length > 0) {
      query = query.in('type', options.types)
    }

    const { data: transactions, error } = await query

    if (error) throw error

    // Transform data for CSV
    const headers = [
      'Date',
      'Type',
      'Amount',
      'Description',
      ...(options.includeCategories ? ['Category'] : []),
      ...(options.includeAccounts ? ['Account', 'Currency'] : []),
    ]

    const rows = transactions.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.amount,
      transaction.description || '',
      ...(options.includeCategories
        ? [transaction.categories?.name || 'Uncategorized']
        : []),
      ...(options.includeAccounts
        ? [
            transaction.accounts?.name || 'Unknown',
            transaction.accounts?.currency || '',
          ]
        : []),
    ])

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell}"`
              : String(cell)
          )
          .join(',')
      ),
    ].join('\n')

    return csvContent
  } catch (error) {
    console.error('Error exporting transactions:', error)
    throw error
  }
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
