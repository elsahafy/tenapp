import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Tables = Database['public']['Tables']
export type Alert = Tables['alerts']['Row']
type AlertInsert = Tables['alerts']['Insert']
type AlertCondition = Tables['alert_conditions']['Row']
type AlertConditionInsert = Tables['alert_conditions']['Insert']

interface RealtimeUpdate {
  id: string
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  [key: string]: any
}

let alertSubscription: ReturnType<typeof supabase.channel> | null = null
const alertHandlers = new Set<(alert: Alert) => void>()

function convertRealtimeUpdateToAlert(update: any): Alert {
  if (!update || !update.new) {
    throw new Error('Invalid update payload')
  }
  
  const alert: Alert = {
    id: update.new.id,
    user_id: update.new.user_id,
    title: update.new.title,
    message: update.new.message,
    link: update.new.link,
    read: update.new.read,
    created_at: update.new.created_at
  }
  return alert
}

export class AlertService {
  static async getUserAlerts(userId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async subscribeToAlerts(userId: string, onAlert: (alert: Alert) => void) {
    alertHandlers.add(onAlert)

    if (!alertSubscription) {
      alertSubscription = supabase
        .channel('alerts')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          try {
            const alert = convertRealtimeUpdateToAlert(payload)
            alertHandlers.forEach(handler => handler(alert))
          } catch (error) {
            console.error('Error processing alert update:', error)
          }
        })
        .subscribe()
    }
  }

  static unsubscribeFromAlerts(handler: (alert: Alert) => void) {
    alertHandlers.delete(handler)

    if (alertHandlers.size === 0 && alertSubscription) {
      alertSubscription.unsubscribe()
      alertSubscription = null
    }
  }

  static async markAlertAsRead(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('id', alertId)

    if (error) throw error
  }

  static async deleteAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)

    if (error) throw error
  }

  static async createAlert(userId: string, data: Omit<AlertInsert, 'id' | 'user_id' | 'created_at' | 'read'>): Promise<Alert> {
    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        ...data,
        user_id: userId,
        read: false
      })
      .select()
      .single()

    if (error) throw error
    if (!alert) throw new Error('Failed to create alert')
    
    return alert
  }

  static async setupAlertConditions(userId: string, conditions: Array<Omit<AlertConditionInsert, 'id' | 'user_id' | 'created_at'>>): Promise<void> {
    for (const condition of conditions) {
      const { error } = await supabase
        .from('alert_conditions')
        .insert({
          ...condition,
          user_id: userId
        })

      if (error) throw error
    }
  }

  static async checkAlertConditions(userId: string): Promise<void> {
    const { data: conditions, error: conditionsError } = await supabase
      .from('alert_conditions')
      .select('*')
      .eq('user_id', userId)

    if (conditionsError) throw conditionsError
    if (!conditions) return

    for (const condition of conditions) {
      const exceeded = await AlertService.checkCondition(userId, condition)
      
      if (exceeded) {
        await AlertService.createAlert(userId, {
          title: `Alert: ${condition.type}`,
          message: condition.message
        })
      }
    }
  }

  static async checkCondition(userId: string, condition: AlertCondition): Promise<boolean> {
    // Implementation will vary based on condition type
    // This is a placeholder that always returns false
    return false
  }
}
