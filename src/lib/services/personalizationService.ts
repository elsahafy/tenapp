import { supabase } from '@/lib/supabase'

export interface UserPreferences {
  id: string
  user_id: string
  category_preferences: string[]
  insight_preferences: {
    spending: boolean
    budget: boolean
    investment: boolean
    savings: boolean
    debt: boolean
    anomalies: boolean
    patterns: boolean
    predictions: boolean
  }
  notification_preferences: {
    email: boolean
    push: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    threshold: {
      anomaly_confidence: number
      pattern_confidence: number
      prediction_confidence: number
    }
  }
  learning_preferences: {
    risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
    investment_style: 'passive' | 'balanced' | 'active'
    savings_priority: 'low' | 'medium' | 'high'
    budget_strictness: 'strict' | 'balanced' | 'flexible'
  }
}

export interface InsightFeedback {
  id: string
  user_id: string
  insight_id: string
  is_helpful: boolean
  feedback_type: 'accuracy' | 'relevance' | 'actionability' | 'clarity'
  rating: number
  comment?: string
}

export interface LearningHistory {
  id: string
  user_id: string
  interaction_type: 'insight_view' | 'action_taken' | 'goal_achieved' | 'recommendation_followed'
  interaction_data: Record<string, any>
}

export class PersonalizationService {
  // User Preferences
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user preferences:', error)
      return null
    }

    return data
  }

  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return null
    }

    return data
  }

  // Insight Feedback
  static async submitInsightFeedback(feedback: Omit<InsightFeedback, 'id'>): Promise<InsightFeedback | null> {
    const { data, error } = await supabase
      .from('insight_feedback')
      .insert(feedback)
      .select()
      .single()

    if (error) {
      console.error('Error submitting insight feedback:', error)
      return null
    }

    return data
  }

  static async getInsightFeedback(insightId: string): Promise<InsightFeedback[]> {
    const { data, error } = await supabase
      .from('insight_feedback')
      .select('*')
      .eq('insight_id', insightId)

    if (error) {
      console.error('Error fetching insight feedback:', error)
      return []
    }

    return data
  }

  // Learning History
  static async recordInteraction(
    userId: string,
    type: LearningHistory['interaction_type'],
    data: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('user_learning_history')
      .insert({
        user_id: userId,
        interaction_type: type,
        interaction_data: data,
      })

    if (error) {
      console.error('Error recording interaction:', error)
    }
  }

  static async getLearningHistory(userId: string): Promise<LearningHistory[]> {
    const { data, error } = await supabase
      .from('user_learning_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching learning history:', error)
      return []
    }

    return data
  }

  // Adaptive Learning
  static async getPersonalizedInsightThresholds(userId: string): Promise<Record<string, number>> {
    const preferences = await this.getUserPreferences(userId)
    if (!preferences) {
      return {
        anomaly_confidence: 70,
        pattern_confidence: 80,
        prediction_confidence: 75,
      }
    }

    return preferences.notification_preferences.threshold
  }

  static async getRelevantCategories(userId: string): Promise<string[]> {
    const preferences = await this.getUserPreferences(userId)
    return preferences?.category_preferences || []
  }

  static async shouldShowInsightType(
    userId: string,
    type: keyof UserPreferences['insight_preferences']
  ): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId)
    return preferences?.insight_preferences[type] ?? true
  }

  // Personalization Logic
  static async getPersonalizationFactors(userId: string): Promise<Record<string, any>> {
    const [preferences, history] = await Promise.all([
      this.getUserPreferences(userId),
      this.getLearningHistory(userId),
    ])

    if (!preferences) {
      return {}
    }

    // Calculate engagement scores
    const engagementScores = this.calculateEngagementScores(history)

    return {
      preferences: preferences.learning_preferences,
      engagement: engagementScores,
      relevantCategories: preferences.category_preferences,
    }
  }

  private static calculateEngagementScores(history: LearningHistory[]): Record<string, number> {
    const scores: Record<string, number> = {
      insightViews: 0,
      actionsTaken: 0,
      goalsAchieved: 0,
      recommendationsFollowed: 0,
    }

    history.forEach(item => {
      switch (item.interaction_type) {
        case 'insight_view':
          scores.insightViews++
          break
        case 'action_taken':
          scores.actionsTaken++
          break
        case 'goal_achieved':
          scores.goalsAchieved++
          break
        case 'recommendation_followed':
          scores.recommendationsFollowed++
          break
      }
    })

    // Convert to percentages based on total interactions
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0)
    if (total > 0) {
      Object.keys(scores).forEach(key => {
        scores[key] = (scores[key] / total) * 100
      })
    }

    return scores
  }

  // Feedback Analysis
  static async analyzeInsightEffectiveness(insightId: string): Promise<Record<string, number>> {
    const feedback = await this.getInsightFeedback(insightId)
    const metrics: Record<string, number> = {
      helpfulnessRate: 0,
      averageRating: 0,
      accuracyScore: 0,
      relevanceScore: 0,
      actionabilityScore: 0,
      clarityScore: 0,
    }

    if (feedback.length === 0) {
      return metrics
    }

    // Calculate helpfulness rate
    metrics.helpfulnessRate =
      (feedback.filter(f => f.is_helpful).length / feedback.length) * 100

    // Calculate average rating
    metrics.averageRating =
      feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length

    // Calculate scores by feedback type
    const typeScores: Record<string, number[]> = {
      accuracy: [],
      relevance: [],
      actionability: [],
      clarity: [],
    }

    feedback.forEach(f => {
      if (f.rating) {
        typeScores[f.feedback_type].push(f.rating)
      }
    })

    Object.entries(typeScores).forEach(([type, ratings]) => {
      if (ratings.length > 0) {
        metrics[`${type}Score`] =
          ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      }
    })

    return metrics
  }
}
