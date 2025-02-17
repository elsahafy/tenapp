import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/types/database'
import { SocialService } from './socialService'

export interface AchievementProgress {
  achievementId: string
  currentProgress: number
  requiredProgress: number
  isComplete: boolean
}

type Achievement = Database['public']['Tables']['achievements']['Row']
type UserAchievement = Database['public']['Tables']['user_achievements']['Row']

export class AchievementService {
  private static achievements: Achievement[] | null = null

  // Initialize achievements in the database
  static async initializeAchievements(): Promise<void> {
    const defaultAchievements: Omit<Achievement, 'id' | 'created_at'>[] = [
      {
        name: 'Budget Master',
        description: 'Create and maintain a budget for 3 consecutive months',
        category: 'budgeting',
        points: 100,
        icon_url: '/icons/achievements/budget-master.svg',
        requirements: {
          type: 'duration',
          target: 3,
          metric: 'months_with_budget',
        },
      },
      {
        name: 'Savings Champion',
        description: 'Save 20% of income for 6 months',
        category: 'savings',
        points: 200,
        icon_url: '/icons/achievements/savings-champion.svg',
        requirements: {
          type: 'streak',
          target: 6,
          metric: 'months_saving_20_percent',
        },
      },
      {
        name: 'Debt Destroyer',
        description: 'Pay off a debt completely',
        category: 'debt',
        points: 300,
        icon_url: '/icons/achievements/debt-destroyer.svg',
        requirements: {
          type: 'milestone',
          target: 1,
          metric: 'debts_paid_off',
        },
      },
      {
        name: 'Investment Guru',
        description: 'Maintain a diversified investment portfolio for 1 year',
        category: 'investing',
        points: 400,
        icon_url: '/icons/achievements/investment-guru.svg',
        requirements: {
          type: 'duration',
          target: 12,
          metric: 'months_with_diverse_portfolio',
        },
      },
      {
        name: 'Goal Getter',
        description: 'Achieve 5 financial goals',
        category: 'goals',
        points: 250,
        icon_url: '/icons/achievements/goal-getter.svg',
        requirements: {
          type: 'count',
          target: 5,
          metric: 'goals_achieved',
        },
      },
      {
        name: 'Expense Tracker',
        description: 'Track expenses daily for 30 days',
        category: 'tracking',
        points: 150,
        icon_url: '/icons/achievements/expense-tracker.svg',
        requirements: {
          type: 'streak',
          target: 30,
          metric: 'days_tracking_expenses',
        },
      },
      {
        name: 'Community Leader',
        description: 'Share 10 financial insights that help others',
        category: 'social',
        points: 200,
        icon_url: '/icons/achievements/community-leader.svg',
        requirements: {
          type: 'count',
          target: 10,
          metric: 'insights_shared',
        },
      },
      {
        name: 'Market Maven',
        description: 'Successfully predict market trends 5 times',
        category: 'market',
        points: 350,
        icon_url: '/icons/achievements/market-maven.svg',
        requirements: {
          type: 'count',
          target: 5,
          metric: 'successful_predictions',
        },
      },
    ]

    const { error } = await supabase
      .from('achievements')
      .upsert(
        defaultAchievements.map((achievement) => ({
          ...achievement,
          requirements: JSON.stringify(achievement.requirements),
        }))
      )

    if (error) {
      console.error('Error initializing achievements:', error)
    }
  }

  // Get all achievements
  static async getAchievements(): Promise<Achievement[]> {
    if (this.achievements) {
      return this.achievements
    }

    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: false })

    if (error) {
      console.error('Error fetching achievements:', error)
      return []
    }

    this.achievements = data
    return data
  }

  // Get achievement by ID
  static async getAchievement(id: string): Promise<Achievement | null> {
    return SocialService.getAchievement(id)
  }

  // Get user's achievement progress
  static async getUserProgress(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  // Update achievement progress
  static async updateProgress(
    userId: string,
    metric: string,
    value: number
  ): Promise<void> {
    const achievements = await this.getAchievements()
    const relevantAchievements = achievements.filter(
      (a) => a.requirements.metric === metric
    )

    await Promise.all(
      relevantAchievements.map((achievement) =>
        SocialService.updateAchievementProgress(userId, achievement.id, value)
      )
    )
  }

  // Check if user has completed an achievement
  static async hasCompletedAchievement(
    userId: string,
    achievementId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single()

    if (error || !data) {
      return false
    }

    return !!data.completed_at
  }

  // Get user's achievement stats
  static async getUserStats(userId: string): Promise<Record<string, any>> {
    const achievements = await this.getUserProgress(userId)
    const totalAchievements = await this.getAchievements()

    return {
      total_achievements: totalAchievements.length,
      completed_achievements: achievements.filter((a) => a.completed_at).length,
      total_points_earned: achievements.reduce((sum, a) => {
        const achievement = totalAchievements.find(
          (ta) => ta.id === a.achievement_id
        )
        return sum + (a.completed_at && achievement ? achievement.points : 0)
      }, 0),
      achievements_by_category: achievements.reduce((acc, a) => {
        const achievement = totalAchievements.find(
          (ta) => ta.id === a.achievement_id
        )
        if (achievement) {
          acc[achievement.category] = (acc[achievement.category] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
    }
  }

  // Get next achievements to work on
  static async getNextAchievements(
    userId: string,
    limit: number = 3
  ): Promise<(Achievement & { progress: number })[]> {
    const [achievements, userProgress] = await Promise.all([
      this.getAchievements(),
      this.getUserProgress(userId),
    ])

    const achievementsWithProgress = achievements.map((achievement) => {
      const progress = userProgress.find(
        (up) => up.achievement_id === achievement.id
      )
      return {
        ...achievement,
        progress: progress
          ? (progress.progress.current / progress.progress.required) * 100
          : 0,
      }
    })

    return achievementsWithProgress
      .filter((a) => a.progress < 100)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, limit)
  }

  // Track an achievement event
  static async trackEvent(
    userId: string,
    eventType: string,
    value: number = 1
  ): Promise<void> {
    switch (eventType) {
      case 'budget_maintained':
        await this.updateProgress(userId, 'months_with_budget', value)
        break
      case 'savings_goal_met':
        await this.updateProgress(userId, 'months_saving_20_percent', value)
        break
      case 'debt_paid_off':
        await this.updateProgress(userId, 'debts_paid_off', value)
        break
      case 'portfolio_maintained':
        await this.updateProgress(userId, 'months_with_diverse_portfolio', value)
        break
      case 'goal_achieved':
        await this.updateProgress(userId, 'goals_achieved', value)
        break
      case 'expenses_tracked':
        await this.updateProgress(userId, 'days_tracking_expenses', value)
        break
      case 'insight_shared':
        await this.updateProgress(userId, 'insights_shared', value)
        break
      case 'market_prediction':
        await this.updateProgress(userId, 'successful_predictions', value)
        break
    }
  }

  // Get achievement leaderboard
  static async getLeaderboard(
    category?: string,
    limit: number = 10
  ): Promise<Array<{ user_id: string; points: number; rank: number }>> {
    let query = supabase
      .from('user_profiles')
      .select('id, display_name, total_points')
      .order('total_points', { ascending: false })
      .limit(limit)

    if (category) {
      // Add category-specific filtering if needed
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return []
    }

    return data.map((user, index) => ({
      user_id: user.id,
      points: user.total_points,
      rank: index + 1,
    }))
  }
}
