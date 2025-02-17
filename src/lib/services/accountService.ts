import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']

// Valid account types from database schema
type AccountType = Account['type']

// Summary type for aggregating account data
interface AccountTypeStats {
  count: number
  total_balance: number
}

interface AccountSummary {
  checking?: AccountTypeStats
  savings?: AccountTypeStats
  investment?: AccountTypeStats
  credit_card?: AccountTypeStats
  loan?: AccountTypeStats
  cash?: AccountTypeStats
  [key: string]: AccountTypeStats | undefined
}

export async function getAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data || []
}

export async function getAccount(accountId: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error) throw error
  return data
}

export async function createAccount(account: Omit<Tables['accounts']['Insert'], 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert(account)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAccount(
  accountId: string,
  updates: Tables['accounts']['Update']
): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAccount(accountId: string): Promise<void> {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', accountId)

  if (error) throw error
}

export async function getAccountTransactions(
  accountId: string,
  options: {
    startDate?: string
    endDate?: string
    type?: string
    limit?: number
    offset?: number
  } = {}
): Promise<any[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('date', { ascending: false })

  if (options.startDate) {
    query = query.gte('date', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('date', options.endDate)
  }
  if (options.type) {
    query = query.eq('type', options.type)
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getAccountSummary(userId: string): Promise<AccountSummary> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error

  const summary: AccountSummary = {}
  
  accounts?.forEach((account) => {
    const accountType = account.type
    if (!summary[accountType]) {
      summary[accountType] = {
        count: 0,
        total_balance: 0
      }
    }
    
    // We know the property exists since we just created it
    const stats = summary[accountType]!
    stats.count++
    stats.total_balance += account.balance
  })

  return summary
}

export async function getAccountsByType(
  userId: string,
  type: AccountType
): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)

  if (error) throw error
  return data || []
}
