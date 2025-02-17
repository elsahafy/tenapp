export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Transaction {
  id: string
  account_id: string
  category_id: string
  amount: number
  type: TransactionType
  description?: string
  date: string
  created_at: string
}

export interface TransactionAnalytics {
  total_income: number
  total_expenses: number
  net_income: number
  expense_by_category: {
    category_id: string
    category_name: string
    amount: number
    percentage: number
  }[]
  income_by_category: {
    category_id: string
    category_name: string
    amount: number
    percentage: number
  }[]
  monthly_trend: {
    month: string
    income: number
    expenses: number
    net: number
  }[]
  top_spending_categories: {
    category_id: string
    category_name: string
    amount: number
    percentage: number
  }[]
  spending_insights: {
    type: 'overspending' | 'savings_opportunity' | 'unusual_activity'
    title: string
    description: string
    amount: number
    category_id?: string
  }[]
}

export interface TransactionFilter {
  startDate?: string
  endDate?: string
  type?: TransactionType
  categoryIds?: string[]
  accountIds?: string[]
  minAmount?: number
  maxAmount?: number
  searchTerm?: string
}
