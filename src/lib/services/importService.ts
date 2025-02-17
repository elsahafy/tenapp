import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/types/database'
import Papa from 'papaparse'
import * as transactionService from './transactionService'
import { parse } from 'date-fns'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']
type TransactionInsert = Tables['transactions']['Insert']
type TransactionType = 'deposit' | 'withdrawal' | 'transfer'

export interface ImportOptions {
  account_id: string
  columnMap: {
    amount: string
    type: string
    description: string
    date: string
    category_id?: string
  }
  dateFormat: string
  skipFirstRow: boolean
}

export interface ImportError {
  row: number
  field: string
  message: string
}

export interface ImportPreviewData {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
}

export interface ImportResult {
  success: boolean
  message: string
  importedCount: number
  errors: string[]
}

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: Transaction['type']
  category?: string
}

export async function parseCSV(
  csvContent: string,
  options: ImportOptions
): Promise<ImportPreviewData> {
  const { data: parsedData, errors } = Papa.parse(csvContent, {
    header: options.skipFirstRow,
    skipEmptyLines: true,
    delimiter: ','
  })

  if (errors.length > 0) {
    throw new Error(`CSV parsing failed: ${errors[0].message}`)
  }

  const rows = parsedData as Record<string, string>[]
  const preview: ImportPreviewData = {
    headers: Object.keys(rows[0] || {}),
    rows: rows.slice(0, 5),
    totalRows: rows.length
  }

  return preview
}

export async function validateImportData(
  rows: Record<string, string>[],
  options: ImportOptions
): Promise<ImportError[]> {
  const errors: ImportError[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + (options.skipFirstRow ? 2 : 1)
    const amount = parseFloat(row[options.columnMap.amount] || '')

    if (isNaN(amount)) {
      errors.push({
        row: rowNumber,
        field: options.columnMap.amount,
        message: 'Invalid amount'
      })
    }

    const date = new Date(row[options.columnMap.date] || '')
    if (isNaN(date.getTime())) {
      errors.push({
        row: rowNumber,
        field: options.columnMap.date,
        message: 'Invalid date'
      })
    }
  })

  return errors
}

export async function importTransactions(
  userId: string,
  csvContent: string,
  options: ImportOptions
): Promise<ImportResult> {
  const { data: parsedData, errors } = Papa.parse(csvContent, {
    header: options.skipFirstRow,
    skipEmptyLines: true,
    delimiter: ','
  })

  if (errors.length > 0) {
    throw new Error(`CSV parsing failed: ${errors[0].message}`)
  }

  const rows = parsedData as Record<string, string>[]
  const transactions: Omit<TransactionInsert, 'id' | 'created_at'>[] = rows.map(row => {
    const amount = parseFloat(row[options.columnMap.amount] || '0')
    const rawType = (row[options.columnMap.type]?.toLowerCase() || 'withdrawal') as TransactionType
    const date = row[options.columnMap.date] || new Date().toISOString().split('T')[0]
    const description = row[options.columnMap.description] || ''

    // Handle category_id to ensure we never get undefined values
    const transaction = {
      user_id: userId,
      account_id: options.account_id,
      amount: Math.abs(amount),
      type: rawType,
      description,
      date,
      status: 'completed' as const
    }

    // Only add category_id if it exists and has a value
    const categoryId = options.columnMap.category_id && row[options.columnMap.category_id]?.trim()
    if (categoryId) {
      return { ...transaction, category_id: categoryId }
    }

    return transaction
  })

  const { error } = await supabase
    .from('transactions')
    .insert(transactions)

  if (error) {
    throw new Error(`Failed to import transactions: ${error.message}`)
  }

  return {
    success: true,
    message: 'Transactions imported successfully',
    importedCount: transactions.length,
    errors: []
  }
}

function parseTransactionLine(
  line: Record<string, string>,
  columnMap: ImportOptions['columnMap'],
  accountId: string,
  userId: string
): TransactionInsert {
  try {
    const amount = line[columnMap.amount]
    const rawType = line[columnMap.type]?.toLowerCase()
    const description = line[columnMap.description]
    const date = line[columnMap.date]
    const category = columnMap.category_id ? line[columnMap.category_id] : undefined

    if (!amount || !rawType || !description || !date) {
      throw new Error('Missing required fields')
    }

    if (!validateTransactionType(rawType)) {
      throw new Error(`Invalid transaction type: ${rawType}`)
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount)) {
      throw new Error('Invalid amount')
    }

    const baseTransaction: Omit<TransactionInsert, 'id' | 'created_at'> = {
      amount: parsedAmount,
      type: rawType,
      description,
      date,
      account_id: accountId,
      user_id: userId,
      currency: 'USD',
      status: 'completed' as const
    }

    if (category) {
      return { ...baseTransaction, category_id: category }
    }

    return baseTransaction
  } catch (error) {
    console.error('Parse error:', error)
    throw error
  }
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}

export async function validateImportFile(
  content: string,
  requiredColumns: string[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  
  try {
    const lines = content.split('\n')
    if (lines.length < 2) {
      errors.push('File must contain at least a header row and one data row')
      return { valid: false, errors }
    }

    const headers = lines[0].split(',').map(h => h.trim())
    
    // Check for required columns
    for (const required of requiredColumns) {
      if (!headers.includes(required)) {
        errors.push(`Required column "${required}" not found`)
      }
    }

    // Validate each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(',')
      if (values.length !== headers.length) {
        errors.push(`Line ${i + 1}: Expected ${headers.length} columns but found ${values.length}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  } catch (error) {
    return {
      valid: false,
      errors: ['Failed to parse file: ' + (error as Error).message]
    }
  }
}

function validateTransactionType(type: string): type is TransactionType {
  return ['deposit', 'withdrawal', 'transfer'].includes(type.toLowerCase())
}

function validateRow(row: Record<string, string>, rowIndex: number, options: ImportOptions): ImportError[] {
  const errors: ImportError[] = []
  const { columnMap } = options

  // Required fields
  if (!row[columnMap.amount]) {
    errors.push({ row: rowIndex, field: 'amount', message: 'Amount is required' })
  }
  if (!row[columnMap.date]) {
    errors.push({ row: rowIndex, field: 'date', message: 'Date is required' })
  }
  if (!row[columnMap.description]) {
    errors.push({ row: rowIndex, field: 'description', message: 'Description is required' })
  }
  if (!row[columnMap.type] || !validateTransactionType(row[columnMap.type].toLowerCase())) {
    errors.push({ row: rowIndex, field: 'type', message: 'Invalid transaction type. Must be one of: deposit, withdrawal, transfer' })
  }

  // Optional fields
  if (columnMap.category_id && row[columnMap.category_id]) {
    // Validate category if provided
    if (!validateCategory(row[columnMap.category_id])) {
      errors.push({ row: rowIndex, field: 'category_id', message: 'Invalid category' })
    }
  }

  return errors
}

function parseDate(dateStr: string, format: string): string {
  try {
    const date = parse(dateStr, format, new Date())
    return date.toISOString()
  } catch (error) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }
}

function validateCategory(categoryId: string): boolean {
  // Add your category validation logic here
  return true // Placeholder implementation
}

export class ImportService {
  static async validateImportData(rows: Record<string, string>[], options: ImportOptions): Promise<ImportError[]> {
    const errors: ImportError[] = []
    
    rows.forEach((row, index) => {
      const rowErrors = validateRow(row, index + 1, options)
      errors.push(...rowErrors)
    })
    
    return errors
  }

  static async importTransactions(userId: string, data: ImportPreviewData, options: ImportOptions): Promise<ImportResult> {
    const { rows } = data
    const { columnMap, dateFormat } = options

    const transactions: Omit<TransactionInsert, 'id' | 'created_at'>[] = rows.map(row => {
      const rawType = row[columnMap.type]?.toLowerCase() ?? ''
      if (!validateTransactionType(rawType)) {
        throw new Error(`Invalid transaction type: ${rawType}`)
      }

      const type: TransactionType = rawType

      const baseTransaction = {
        user_id: userId,
        account_id: options.account_id,
        amount: parseFloat(row[columnMap.amount]),
        type,
        description: row[columnMap.description],
        date: parseDate(row[columnMap.date], dateFormat),
        currency: 'USD', // Default currency
        status: 'completed' as const
      }

      // Only add category_id if it exists and has a value
      const categoryId = columnMap.category_id && row[columnMap.category_id]?.trim()
      if (categoryId) {
        return { ...baseTransaction, category_id: categoryId }
      }

      return baseTransaction
    })

    // Create transactions one by one since bulk create is not available
    await Promise.all(transactions.map(t => transactionService.createTransaction(t)))

    return {
      success: true,
      message: 'Transactions imported successfully',
      importedCount: transactions.length,
      errors: []
    }
  }
}
