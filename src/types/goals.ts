export type GoalType = 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'emergency_fund' | 'custom'
export type GoalStatus = 'not_started' | 'in_progress' | 'on_track' | 'behind' | 'achieved' | 'cancelled'
export type GoalPriority = 'low' | 'medium' | 'high'
export type ContributionFrequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'

export interface Goal {
  id: string
  user_id: string
  name: string
  description?: string
  type: GoalType
  target_amount: number
  current_amount: number
  currency: string
  start_date: string
  target_date: string
  status: GoalStatus
  priority: GoalPriority
  icon?: string
  color?: string
  linked_account_ids?: string[]
  contribution_frequency?: ContributionFrequency
  contribution_amount?: number
  auto_contribution: boolean
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface GoalMilestone {
  id: string
  goal_id: string
  name: string
  target_amount: number
  target_date: string
  achieved: boolean
  achieved_date: string | null
  created_at: string
  updated_at: string
}

export interface GoalProgress {
  id: string
  goal_id: string
  amount: number
  date: string
  type: 'contribution' | 'withdrawal' | 'interest' | 'adjustment'
  description?: string
  created_at: string
}

export interface GoalAnalytics {
  monthly_contribution_average: number
  trend: 'improving' | 'stable' | 'declining'
  is_on_track: boolean
  time_remaining_days: number
  required_monthly_contribution: number
  projected_completion_date: string
  completion_percentage: number
}

export interface GoalRecommendation {
  id: string
  user_id: string
  goal_id: string
  type: 'increase_contribution' | 'reduce_spending' | 'adjust_timeline' | 'milestone_reminder'
  title: string
  description: string
  priority: GoalPriority
  action_url?: string
  is_read: boolean
  created_at: string
}

export interface SavingsStrategy {
  id: string
  user_id: string
  goal_id: string
  name: string
  description: string
  recommended_monthly_contribution: number
  estimated_completion_date: string
  risk_level: 'low' | 'medium' | 'high'
  potential_savings: number
  implementation_steps: string[]
  created_at: string
  updated_at: string
}
