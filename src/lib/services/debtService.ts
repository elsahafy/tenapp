import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type BaseAccount = Tables['accounts']['Row']

// Extend the base Account type with all required fields
export type Account = BaseAccount & {
  collateral: string | null
  emi_enabled: boolean
  loan_end_date: string | null
  loan_purpose: string | null
  loan_start_date: string | null
  loan_term: number | null
  monthly_installment: number | null
  total_loan_amount: number | null
  min_payment_amount: number | null
  min_payment_percentage: number | null
}

type Debt = Tables['debts']['Row']

export async function getDebtAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .in('type', ['credit_card', 'loan'])
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data || []
}

export function calculateTotalDebt(accounts: Account[]): number {
  return accounts.reduce((total, account) => total + account.current_balance, 0)
}

export function calculateDebtPayoff(accounts: Account[], customPayment?: number) {
  const totalDebt = calculateTotalDebt(accounts)
  if (totalDebt <= 0) {
    return {
      monthlyPayment: 0,
      minimumPayment: 0,
      totalMonths: 0,
      totalInterestPaid: 0,
      accountPayoffs: [] as {
        account: Account,
        monthlyPayment: number,
        minimumPayment: number,
        monthsToPayoff: number,
        totalInterest: number
      }[]
    }
  }

  // Calculate minimum required payment for each account
  const accountMinPayments = accounts.map(acc => {
    let minPayment = 0
    if (acc.type === 'credit_card' && acc.min_payment_percentage) {
      minPayment = Math.max(
        (acc.min_payment_percentage / 100) * acc.current_balance,
        acc.min_payment_amount || 0
      )
    } else {
      minPayment = acc.min_payment_amount || 0
    }
    return { account: acc, minPayment }
  })

  const totalMinPayment = accountMinPayments.reduce((sum, { minPayment }) => sum + minPayment, 0)
  const monthlyPayment = customPayment || totalMinPayment

  // If payment is less than minimum required, return minimum payment plan
  if (monthlyPayment < totalMinPayment) {
    return {
      monthlyPayment: totalMinPayment,
      minimumPayment: totalMinPayment,
      totalMonths: -1, // Indicates insufficient payment
      totalInterestPaid: -1,
      accountPayoffs: accountMinPayments.map(({ account, minPayment }) => ({
        account,
        monthlyPayment: minPayment,
        minimumPayment: minPayment,
        monthsToPayoff: -1,
        totalInterest: -1
      }))
    }
  }

  // Sort accounts by interest rate (highest first) for debt avalanche method
  const sortedAccounts = [...accountMinPayments].sort((a, b) => 
    ((b.account.interest_rate || 0) - (a.account.interest_rate || 0))
  )

  let remainingPayment = monthlyPayment
  const accountPayoffs = sortedAccounts.map(({ account, minPayment }) => {
    const monthlyRate = (account.interest_rate || 0) / 100 / 12
    let paymentForAccount = minPayment

    // If there's remaining payment after covering minimums, allocate to highest interest debt
    if (remainingPayment > minPayment) {
      paymentForAccount = remainingPayment
      remainingPayment = 0
    } else {
      remainingPayment -= minPayment
    }

    let monthsToPayoff: number
    let totalInterest: number

    if (monthlyRate === 0 || paymentForAccount <= 0) {
      monthsToPayoff = paymentForAccount > 0 ? 
        Math.ceil(account.current_balance / paymentForAccount) : 
        Number.POSITIVE_INFINITY
      totalInterest = 0
    } else {
      // If monthly payment is >= balance, it will be paid off in 1 month with no interest
      if (paymentForAccount >= account.current_balance) {
        monthsToPayoff = 1
        totalInterest = 0
      } else {
        // Use amortization formula to calculate months to payoff with interest
        monthsToPayoff = Math.ceil(
          Math.log(paymentForAccount / (paymentForAccount - monthlyRate * account.current_balance)) /
          Math.log(1 + monthlyRate)
        )
        
        // Calculate total interest paid
        totalInterest = (paymentForAccount * monthsToPayoff) - account.current_balance
      }
    }

    return {
      account,
      monthlyPayment: paymentForAccount,
      minimumPayment: minPayment,
      monthsToPayoff: isFinite(monthsToPayoff) ? monthsToPayoff : -1,
      totalInterest: Math.max(totalInterest, 0)
    }
  })

  // Calculate total months and interest
  const maxMonths = Math.max(...accountPayoffs.map(a => a.monthsToPayoff))
  const totalInterest = accountPayoffs.reduce((sum, a) => sum + a.totalInterest, 0)

  return {
    monthlyPayment,
    minimumPayment: totalMinPayment,
    totalMonths: maxMonths,
    totalInterestPaid: totalInterest,
    accountPayoffs
  }
}

export interface DebtRecommendation {
  type: 'minimum_payment' | 'high_interest' | 'balance_transfer' | 'debt_to_income'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  accounts: string[]
  created_at: string
}

export function generateDebtRecommendations(accounts: Account[]): DebtRecommendation[] {
  const recommendations: DebtRecommendation[] = []
  const now = new Date().toISOString()

  // Sort accounts by interest rate (highest first)
  const sortedAccounts = [...accounts].sort((a, b) => {
    const rateA = a.interest_rate || 0
    const rateB = b.interest_rate || 0
    return rateB - rateA
  })

  // Recommend paying off highest interest rate first
  if (sortedAccounts.length > 0) {
    const highestRate = sortedAccounts[0]
    if (highestRate.interest_rate) {
      recommendations.push({
        type: 'high_interest',
        priority: 'high',
        title: 'Focus on High Interest Debt',
        description: `Prioritize paying off ${highestRate.name} first as it has the highest interest rate at ${highestRate.interest_rate}%.`,
        accounts: [highestRate.id],
        created_at: now
      })
    }
  }

  // Check for credit utilization
  const creditCards = accounts.filter(a => a.type === 'credit_card')
  creditCards.forEach(card => {
    if (card.credit_limit) {
      const utilization = (card.current_balance / card.credit_limit) * 100
      if (utilization > 30) {
        recommendations.push({
          type: 'minimum_payment',
          priority: 'high',
          title: 'High Credit Utilization',
          description: `Your ${card.name} is at ${utilization.toFixed(1)}% utilization. Try to keep it below 30% to maintain a good credit score.`,
          accounts: [card.id],
          created_at: now
        })
      }
    }
  })

  // Check for balance transfer opportunities
  if (creditCards.length > 1) {
    const highInterestCards = creditCards.filter(card => (card.interest_rate || 0) > 15)
    if (highInterestCards.length > 0) {
      recommendations.push({
        type: 'balance_transfer',
        priority: 'medium',
        title: 'Consider Balance Transfer',
        description: 'You may save money by transferring balances from high-interest cards to a card with a 0% intro APR.',
        accounts: highInterestCards.map(card => card.id),
        created_at: now
      })
    }
  }

  return recommendations
}

export async function getDebtPayoffHistory(
  userId: string,
  accountId: string
): Promise<{ date: string; balance: number }[]> {
  const { data, error } = await supabase
    .from('debt_payoff_history')
    .select('date, balance')
    .eq('user_id', userId)
    .eq('account_id', accountId)
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function trackDebtPayoff(
  userId: string,
  accountId: string,
  balance: number
): Promise<void> {
  const { error } = await supabase.from('debt_payoff_history').insert({
    user_id: userId,
    account_id: accountId,
    balance,
    date: new Date().toISOString()
  })

  if (error) throw error
}

export async function getDebts(userId: string): Promise<Debt[]> {
  const { data: debts, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return debts || []
}

export async function addDebt(
  userId: string,
  debt: Omit<Debt, 'id' | 'user_id' | 'created_at'>
): Promise<Debt> {
  const { data: newDebt, error } = await supabase
    .from('debts')
    .insert({
      user_id: userId,
      ...debt
    })
    .select()
    .single()

  if (error) throw error
  if (!newDebt) throw new Error('Failed to create debt')
  return newDebt
}

export async function updateDebt(
  debtId: string,
  updates: Partial<Omit<Debt, 'id' | 'user_id'>>
): Promise<void> {
  const { error } = await supabase
    .from('debts')
    .update(updates)
    .eq('id', debtId)

  if (error) throw error
}

export async function deleteDebt(debtId: string): Promise<void> {
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', debtId)

  if (error) throw error
}
