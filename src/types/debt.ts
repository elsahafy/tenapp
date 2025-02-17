export interface DebtPayoffStrategy {
  strategy: 'avalanche' | 'snowball'
  total_debt: number
  average_interest_rate: number
  monthly_payment: number
  total_months: number
  total_interest: number
  total_payment: number
  accounts: {
    account_id: string
    account_name: string
    original_balance: number
    minimum_payment: number
    months_to_payoff: number
    total_interest: number
    total_payment: number
  }[]
}

export interface DebtRecommendation {
  type: 'high_interest' | 'debt_to_income' | 'minimum_payment' | 'balance_transfer'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  accounts: string[]
  created_at: string
}

export interface DebtReminder {
  id: string
  user_id: string
  account_id: string
  type: 'payment_due' | 'minimum_payment' | 'high_balance' | 'interest_rate_change'
  title: string
  message: string
  due_date?: string
  amount?: number
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface DebtBalanceChange {
  id: string
  user_id: string
  account_id: string
  balance: number
  date: string
  created_at: string
}
