import type { Database } from '@/lib/database.types'

export interface User {
  id: string
  email: string
  preferredCurrency: Database['public']['Enums']['currency_code']
  createdAt: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: Database['public']['Enums']['account_type']
  currency: Database['public']['Enums']['currency_code']
  current_balance: number
  credit_limit: number | null
  interest_rate: number | null
  due_date: number | null
  institution: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export type AccountType = Database['public']['Enums']['account_type']

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  subcategory_id: string | null
  amount: number
  currency: Database['public']['Enums']['currency_code']
  description: string | null
  date: string
  type: Database['public']['Enums']['transaction_type']
  status: string
  transfer_account_id: string | null
  created_at: string
  updated_at: string
  accounts: {
    name: string
    currency: Database['public']['Enums']['currency_code']
  } | null
  categories: {
    name: string
  } | null
}

export interface Goal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  category: string
  createdAt: string
}

export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

export interface Debt {
  id: string
  name: string
  type: Enums['debt_type']
  current_balance: number
  interest_rate: number
  minimum_payment: number
  due_date: string
  active: boolean
  created_at: string
  updated_at: string
  user_id: string
}

export type PaymentType = 'scheduled' | 'extra'

export type Payment = {
  id: string
  debt_id: string
  amount: number
  payment_date: string
  payment_type: PaymentType
  notes: string | null
  debt?: {
    name: string
  }
  created_at: string
  updated_at: string
  user_id: string
}

export type DebtPayment = Tables['debt_payments']['Row'] & {
  debt?: {
    name: string
  }
}

export interface ScenarioResults {
  projections: any[]
  metrics: {
    [key: string]: number
  }
  recommendations: string[]
}

export interface Scenario {
  id: string
  user_id: string
  name: string
  description: string | null
  scenario_type: string
  parameters: Record<string, any>
  results: ScenarioResults | null
  status: string | null
  created_at: string
  updated_at: string
}

export const SUPPORTED_CURRENCIES = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  KWD: 'Kuwaiti Dinar',
  BHD: 'Bahraini Dinar',
  OMR: 'Omani Rial',
  QAR: 'Qatari Riyal',
  EGP: 'Egyptian Pound',
  JOD: 'Jordanian Dinar',
  LBP: 'Lebanese Pound',
} as const

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES
