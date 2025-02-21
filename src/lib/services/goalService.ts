import { supabase } from '@/lib/supabase'
import {
  Goal,
  GoalMilestone,
  GoalProgress,
  GoalAnalytics,
  GoalRecommendation,
  SavingsStrategy,
} from '@/types/goals'

// Goals
export async function getGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single()

  if (error) throw error
  return data
}

export async function createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert([goal])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateGoal(goal: Goal): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update(goal)
    .eq('id', goal.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', goalId)
  if (error) throw error
}

// Milestones
export async function getGoalMilestones(goalId: string): Promise<GoalMilestone[]> {
  const { data, error } = await supabase
    .from('goal_milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('target_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createMilestone(
  milestone: Omit<GoalMilestone, 'id' | 'created_at' | 'updated_at'>
): Promise<GoalMilestone> {
  const { data, error } = await supabase
    .from('goal_milestones')
    .insert([milestone])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMilestone(milestone: GoalMilestone): Promise<GoalMilestone> {
  const { data, error } = await supabase
    .from('goal_milestones')
    .update(milestone)
    .eq('id', milestone.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  const { error } = await supabase.from('goal_milestones').delete().eq('id', milestoneId)
  if (error) throw error
}

// Progress
export async function getGoalProgress(goalId: string): Promise<GoalProgress[]> {
  const { data, error } = await supabase
    .from('goal_progress')
    .select('*')
    .eq('goal_id', goalId)
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addProgress(
  progress: Omit<GoalProgress, 'id' | 'created_at'>
): Promise<GoalProgress> {
  const { data, error } = await supabase
    .from('goal_progress')
    .insert([progress])
    .select()
    .single()

  if (error) throw error

  // Update goal current amount
  const goal = await getGoal(progress.goal_id)
  if (goal) {
    const newAmount = goal.current_amount + progress.amount
    await updateGoal({ ...goal, current_amount: newAmount })
  }

  return data
}

// Analytics
export async function getGoalAnalytics(goalId: string): Promise<GoalAnalytics> {
  const goal = await getGoal(goalId)
  if (!goal) throw new Error('Goal not found')

  const progress = await getGoalProgress(goalId)
  const milestones = await getGoalMilestones(goalId)

  // Calculate monthly contribution average
  const contributions = progress.filter((p) => p.type === 'contribution')
  const monthlyContributionAverage =
    contributions.reduce((sum, p) => sum + p.amount, 0) /
    (contributions.length || 1)

  // Calculate trend
  const recentContributions = contributions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
  const trend = calculateTrend(recentContributions)

  // Calculate time remaining
  const now = new Date()
  const targetDate = new Date(goal.target_date)
  const timeRemainingDays = Math.max(
    0,
    Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  )

  // Calculate required monthly contribution
  const remainingAmount = goal.target_amount - goal.current_amount
  const monthsRemaining = Math.max(1, timeRemainingDays / 30)
  const requiredMonthlyContribution = remainingAmount / monthsRemaining

  // Calculate if on track
  const isOnTrack =
    monthlyContributionAverage >= requiredMonthlyContribution ||
    goal.current_amount >= goal.target_amount

  // Calculate completion percentage
  const completionPercentage = (goal.current_amount / goal.target_amount) * 100

  // Calculate projected completion date
  const projectedCompletionDate = calculateProjectedCompletionDate(
    goal,
    monthlyContributionAverage
  )

  return {
    monthly_contribution_average: monthlyContributionAverage,
    trend,
    is_on_track: isOnTrack,
    time_remaining_days: timeRemainingDays,
    required_monthly_contribution: requiredMonthlyContribution,
    projected_completion_date: projectedCompletionDate.toISOString(),
    completion_percentage: completionPercentage,
  }
}

// Recommendations
export async function getGoalRecommendations(
  userId: string,
  goalId: string
): Promise<GoalRecommendation[]> {
  const { data, error } = await supabase
    .from('goal_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function generateRecommendations(
  userId: string,
  goalId: string
): Promise<GoalRecommendation[]> {
  const goal = await getGoal(goalId)
  if (!goal) throw new Error('Goal not found')

  const analytics = await getGoalAnalytics(goalId)
  const recommendations: Omit<GoalRecommendation, 'id' | 'created_at'>[] = []

  // Check if behind schedule
  if (!analytics.is_on_track) {
    recommendations.push({
      user_id: userId,
      goal_id: goalId,
      type: 'increase_contribution',
      title: 'Increase Your Monthly Contribution',
      description: `To reach your goal on time, consider increasing your monthly contribution to ${analytics.required_monthly_contribution.toFixed(
        2
      )}`,
      priority: 'high',
      is_read: false,
    })
  }

  // Generate other recommendations based on goal performance
  // ... Add more recommendation logic here

  // Save recommendations to database
  const { data, error } = await supabase
    .from('goal_recommendations')
    .insert(recommendations)
    .select()

  if (error) throw error
  return data || []
}

// Savings Strategies
export async function getSavingsStrategies(
  userId: string,
  goalId: string
): Promise<SavingsStrategy[]> {
  const { data, error } = await supabase
    .from('savings_strategies')
    .select('*')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function generateSavingsStrategy(
  userId: string,
  goalId: string
): Promise<SavingsStrategy> {
  const goal = await getGoal(goalId)
  if (!goal) throw new Error('Goal not found')

  const analytics = await getGoalAnalytics(goalId)

  // Generate a savings strategy based on goal type and analytics
  const strategy: Omit<SavingsStrategy, 'id' | 'created_at' | 'updated_at'> = {
    user_id: userId,
    goal_id: goalId,
    name: 'Optimized Savings Plan',
    description: 'A balanced approach to reaching your financial goal',
    recommended_monthly_contribution: analytics.required_monthly_contribution,
    estimated_completion_date: analytics.projected_completion_date,
    risk_level: 'medium',
    potential_savings: goal.target_amount,
    implementation_steps: [
      'Set up automatic monthly contributions',
      'Review and adjust budget to accommodate savings goal',
      'Track progress weekly and adjust as needed',
      'Consider additional income sources if needed',
    ],
  }

  const { data, error } = await supabase
    .from('savings_strategies')
    .insert([strategy])
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper functions
function calculateTrend(recentContributions: GoalProgress[]): 'improving' | 'stable' | 'declining' {
  if (recentContributions.length < 2) return 'stable'

  const amounts = recentContributions.map((c) => c.amount)
  const trend =
    amounts[0] > amounts[amounts.length - 1]
      ? 'declining'
      : amounts[0] < amounts[amounts.length - 1]
      ? 'improving'
      : 'stable'

  return trend
}

function calculateProjectedCompletionDate(goal: Goal, monthlyContribution: number): Date {
  const remainingAmount = goal.target_amount - goal.current_amount
  const monthsToComplete = monthlyContribution > 0 ? remainingAmount / monthlyContribution : 0
  const projectedDate = new Date()
  projectedDate.setMonth(projectedDate.getMonth() + Math.ceil(monthsToComplete))
  return projectedDate
}
