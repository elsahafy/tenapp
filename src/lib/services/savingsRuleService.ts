import { supabase } from '@/lib/supabase'

export interface SavingsRule {
  id: string
  user_id: string
  goal_id: string
  name: string
  type: 'percentage' | 'fixed'
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly'
  source_account_id: string
  condition_type: 'balance_above' | 'income_received' | 'always' | null
  condition_value: number | null
  active: boolean
  last_executed_at: string | null
  next_execution_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateSavingsRuleData
  extends Omit<
    SavingsRule,
    'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_executed_at' | 'next_execution_at'
  > {}

export async function getSavingsRules(userId: string): Promise<SavingsRule[]> {
  const { data, error } = await supabase
    .from('savings_rules')
    .select(
      `
      *,
      goals (
        name,
        target_amount,
        current_amount
      ),
      accounts (
        name,
        balance,
        currency
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getSavingsRule(ruleId: string): Promise<SavingsRule | null> {
  const { data, error } = await supabase
    .from('savings_rules')
    .select(
      `
      *,
      goals (
        name,
        target_amount,
        current_amount
      ),
      accounts (
        name,
        balance,
        currency
      )
    `
    )
    .eq('id', ruleId)
    .single()

  if (error) throw error
  return data
}

export async function createSavingsRule(
  userId: string,
  data: CreateSavingsRuleData
): Promise<SavingsRule> {
  const nextExecution = calculateNextExecution(data.frequency)

  const { data: rule, error } = await supabase
    .from('savings_rules')
    .insert({
      ...data,
      user_id: userId,
      next_execution_at: nextExecution.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return rule
}

export async function updateSavingsRule(
  ruleId: string,
  data: Partial<CreateSavingsRuleData>
): Promise<SavingsRule> {
  const updates: any = { ...data }

  // If frequency is updated, recalculate next execution
  if (data.frequency) {
    const nextExecution = calculateNextExecution(data.frequency)
    updates.next_execution_at = nextExecution.toISOString()
  }

  const { data: rule, error } = await supabase
    .from('savings_rules')
    .update(updates)
    .eq('id', ruleId)
    .select()
    .single()

  if (error) throw error
  return rule
}

export async function deleteSavingsRule(ruleId: string): Promise<void> {
  const { error } = await supabase.from('savings_rules').delete().eq('id', ruleId)
  if (error) throw error
}

export async function processSavingsRule(ruleId: string): Promise<void> {
  const { error } = await supabase.rpc('process_savings_rule', {
    p_rule_id: ruleId,
  })

  if (error) throw error
}

export async function processDueSavingsRules(userId: string): Promise<void> {
  const { data: rules, error: fetchError } = await supabase
    .from('savings_rules')
    .select('id')
    .eq('user_id', userId)
    .eq('active', true)
    .lte('next_execution_at', new Date().toISOString())

  if (fetchError) throw fetchError

  if (!rules?.length) return

  for (const rule of rules) {
    try {
      await processSavingsRule(rule.id)
    } catch (error) {
      console.error(`Error processing savings rule ${rule.id}:`, error)
    }
  }
}

function calculateNextExecution(frequency: string): Date {
  const now = new Date()

  switch (frequency) {
    case 'daily':
      return new Date(now.setDate(now.getDate() + 1))
    case 'weekly':
      return new Date(now.setDate(now.getDate() + 7))
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1))
    default:
      throw new Error(`Invalid frequency: ${frequency}`)
  }
}

// Analytics
export interface SavingsRuleAnalytics {
  total_contributions: number
  total_amount: number
  average_contribution: number
  success_rate: number
  monthly_average: number
  projected_yearly_savings: number
}

export async function getSavingsRuleAnalytics(
  ruleId: string
): Promise<SavingsRuleAnalytics> {
  const { data: contributions, error } = await supabase
    .from('goal_contributions')
    .select('amount, created_at')
    .eq('savings_rule_id', ruleId)
    .order('created_at', { ascending: false })

  if (error) throw error

  if (!contributions?.length) {
    return {
      total_contributions: 0,
      total_amount: 0,
      average_contribution: 0,
      success_rate: 0,
      monthly_average: 0,
      projected_yearly_savings: 0,
    }
  }

  const total_amount = contributions.reduce((sum, c) => sum + c.amount, 0)
  const average_contribution = total_amount / contributions.length

  // Calculate success rate (executed vs scheduled)
  const rule = await getSavingsRule(ruleId)
  if (!rule) throw new Error('Rule not found')

  const startDate = new Date(rule.created_at)
  const now = new Date()
  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  let expectedExecutions = 0
  switch (rule.frequency) {
    case 'daily':
      expectedExecutions = daysSinceStart
      break
    case 'weekly':
      expectedExecutions = Math.floor(daysSinceStart / 7)
      break
    case 'monthly':
      expectedExecutions = Math.floor(daysSinceStart / 30)
      break
  }

  const success_rate =
    expectedExecutions > 0
      ? (contributions.length / expectedExecutions) * 100
      : 0

  // Calculate monthly average
  const monthsSinceStart = Math.max(1, Math.floor(daysSinceStart / 30))
  const monthly_average = total_amount / monthsSinceStart

  // Project yearly savings
  const projected_yearly_savings = monthly_average * 12

  return {
    total_contributions: contributions.length,
    total_amount,
    average_contribution,
    success_rate,
    monthly_average,
    projected_yearly_savings,
  }
}
