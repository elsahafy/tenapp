export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan' | 'cash'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  currency: string
  current_balance: number
  credit_limit?: number
  interest_rate?: number
  due_date?: number
  institution?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionStatus = 'pending' | 'completed' | 'cancelled'

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category: string
  subcategory?: string
  amount: number
  description?: string
  date: string
  type: TransactionType
  status: TransactionStatus
  transfer_account_id?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: 'income' | 'expense'
  icon?: string
  color?: string
  is_active: boolean
  created_at: string
  updated_at: string
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id: string
  category_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccountSummary {
  total_balance: number
  total_income: number
  total_expenses: number
  net_worth: number
  accounts_by_type: {
    [key in AccountType]?: {
      count: number
      total_balance: number
    }
  }
}
