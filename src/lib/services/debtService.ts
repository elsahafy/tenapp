import { supabase } from '@/lib/supabaseClient'
import { DebtPayoffStrategy } from '@/types/debt'
import type { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']
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

export function calculateDebtPayoff(accounts: Account[]) {
  const totalDebt = calculateTotalDebt(accounts)
  const monthlyPayment = totalDebt * 0.03 // Default to 3% of total debt

  // Sort accounts by interest rate (highest first)
  const sortedAccounts = [...accounts].sort((a, b) => {
    const rateA = a.interest_rate || 0
    const rateB = b.interest_rate || 0
    return rateB - rateA
  })

  const payoffPlan = sortedAccounts.map(account => {
    const monthsToPayoff = account.current_balance / monthlyPayment
    return {
      account,
      monthsToPayoff: Math.ceil(monthsToPayoff),
      monthlyPayment,
      totalInterest: (account.interest_rate || 0) * account.current_balance * (monthsToPayoff / 12)
    }
  })

  return {
    totalMonths: Math.max(...payoffPlan.map(p => p.monthsToPayoff)),
    monthlyPayment,
    accountPayoffs: payoffPlan
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
