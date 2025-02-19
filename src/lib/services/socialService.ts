import { supabase } from '../supabase'
import type { Database } from '@/types/supabase'

// Database types
type Tables = Database['public']['Tables']
export type Profile = Tables['profiles']['Row']

type DbResult<T> = T extends PromiseLike<infer U> ? U : never
type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never

export class SocialService {
  // Profile Management
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  static async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Achievement Management
  static async getAchievement(achievementId: string) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single()

    if (error) throw error
    return data
  }

  static async updateAchievementProgress(
    userId: string,
    achievementId: string,
    newProgress: number,
    completed: boolean = false
  ) {
    const { data, error } = await supabase
      .from('user_achievements')
      .update({ progress: newProgress, completed })
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .select()
      .single()

    if (error) throw error

    if (completed) {
      const achievement = await this.getAchievement(achievementId)
      if (achievement) {
        await this.createNotification(userId, 'achievement', {
          title: 'Achievement Unlocked!',
          message: `You've earned the "${achievement.name}" achievement!`,
        })
      }
    }

    return data
  }

  // Connection Management
  static async getConnections(userId: string, status: 'pending' | 'accepted' = 'accepted') {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)

    if (error) throw error
    return data
  }

  static async sendConnectionRequest(userId: string, friendId: string) {
    const { data, error } = await supabase
      .from('connections')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Notify the recipient
    await this.createNotification(friendId, 'social', {
      title: 'New Connection Request',
      message: 'You have a new connection request.',
    })

    return data
  }

  static async respondToConnectionRequest(
    connectionId: string,
    accept: boolean
  ) {
    const { data, error } = await supabase
      .from('connections')
      .update({
        status: accept ? 'accepted' : 'declined',
      })
      .eq('id', connectionId)
      .select()
      .single()

    if (error) throw error

    // Notify the sender
    await this.createNotification(data.user_id, 'social', {
      title: accept ? 'Connection Accepted' : 'Connection Declined',
      message: accept
        ? 'Your connection request has been accepted.'
        : 'Your connection request has been declined.',
    })

    return data
  }

  // Insight Management
  static async getInsight(insightId: string) {
    const { data, error } = await supabase
      .from('shared_insights')
      .select('*')
      .eq('id', insightId)
      .single()

    if (error) throw error
    return data
  }

  static async shareInsight(userId: string, insight: any) {
    const { data, error } = await supabase
      .from('shared_insights')
      .insert({
        user_id: userId,
        ...insight,
      })
      .select()
      .single()

    if (error) throw error

    // Create social notification for followers
    const followers = await this.getConnections(userId, 'accepted')
    for (const follower of followers) {
      await this.createNotification(follower.friend_id, 'social', {
        title: 'New Insight Shared',
        message: 'Someone you follow has shared a new insight.',
        link: `/insights/${data.id}`,
      })
    }

    return data
  }

  static async getSharedInsights(options: {
    userId?: string
    category?: string
    visibility?: 'public' | 'private' | 'friends'
    limit?: number
  }): Promise<any[]> {
    let query = supabase.from('shared_insights').select('*')

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options.category) {
      query = query.eq('category', options.category)
    }

    if (options.visibility) {
      query = query.eq('visibility', options.visibility)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getSharedInsightsOld(options: {
    userId?: string
    category?: string
    limit?: number
  } = {}) {
    let query = supabase.from('shared_insights').select('*')

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options.category) {
      query = query.eq('category', options.category)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async createInsightInteraction(
    interaction: any
  ) {
    const { data, error } = await supabase
      .from('insight_interactions')
      .insert(interaction)
      .select()
      .single()

    if (error) throw error

    // Notify the insight owner
    const insight = await this.getInsight(interaction.insight_id)
    if (insight && insight.user_id !== interaction.user_id) {
      await this.createNotification(insight.user_id, 'social', {
        title: interaction.type === 'like' ? 'New Like' : 'New Comment',
        message:
          interaction.type === 'like'
            ? `Someone liked your insight "${insight.title}"`
            : `Someone commented on your insight "${insight.title}"`,
        link: `/insights/${insight.id}`,
      })
    }

    return data
  }

  // Insight Interactions
  static async getInsightInteractions(insightId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('insight_interactions')
      .select('*')
      .eq('insight_id', insightId)

    if (error) throw error
    return data || []
  }

  static async interactWithInsight(
    userId: string,
    insightId: string,
    type: 'like' | 'comment',
    data?: { comment?: string }
  ): Promise<any> {
    const { data: interaction, error } = await supabase
      .from('insight_interactions')
      .insert([{
        user_id: userId,
        insight_id: insightId,
        type,
        data
      }])
      .select()
      .single()

    if (error) throw error
    return interaction
  }

  // Notification Management
  static async createNotification(
    userId: string,
    type: string,
    data: any
  ) {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      data,
      read: false,
    })
    return !error
  }

  static async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}
