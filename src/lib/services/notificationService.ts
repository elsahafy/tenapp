import { supabase } from '@/lib/supabaseClient'
import { RealtimeService } from './realtimeService'
import type { Database } from '@/lib/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Tables = Database['public']['Tables']
export type Notification = Tables['notifications']['Row']
type NotificationInsert = Tables['notifications']['Insert']

let notificationSubscription: ReturnType<typeof supabase.channel> | null = null
const notificationHandlers = new Set<(notification: Notification) => void>()

function convertRealtimeUpdateToNotification(update: any): Notification {
  if (!update || !update.new) {
    throw new Error('Invalid update payload')
  }
  return update.new as Notification
}

export class NotificationService {
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY = 1000 // 1 second

  // Create a new notification
  static async createNotification(
    notification: Omit<Notification, 'id' | 'created_at' | 'delivered_at' | 'read_at'>
  ): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    // Attempt to deliver the notification
    await this.deliverNotification(data)
    return data
  }

  // Get user's notifications
  static async getUserNotifications(
    userId: string,
    options: {
      limit?: number
      offset?: number
      type?: Notification['type']
      unreadOnly?: boolean
    } = {}
  ): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options.type) {
      query = query.eq('type', options.type)
    }

    if (options.unreadOnly) {
      query = query.is('read_at', null)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data
  }

  // Mark notification as read
  static async markAsRead(
    userId: string,
    notificationId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }

    return true
  }

  // Delete a notification
  static async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting notification:', error)
      return false
    }

    return true
  }

  // Register a device for notifications
  static async registerDevice(device: Omit<NotificationDevice, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationDevice | null> {
    const { data, error } = await supabase
      .from('notification_devices')
      .upsert({
        ...device,
        last_used_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error registering device:', error)
      return null
    }

    return data
  }

  // Unregister a device
  static async unregisterDevice(
    userId: string,
    deviceToken: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('notification_devices')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('device_token', deviceToken)

    if (error) {
      console.error('Error unregistering device:', error)
      return false
    }

    return true
  }

  // Get user's devices
  static async getUserDevices(userId: string): Promise<NotificationDevice[]> {
    const { data, error } = await supabase
      .from('notification_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching user devices:', error)
      return []
    }

    return data
  }

  // Subscribe to notifications
  static async subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): Promise<void> {
    if (!notificationSubscription) {
      notificationSubscription = supabase
        .channel('notifications')
        .on<Notification>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload: RealtimePostgresChangesPayload<Notification>) => {
            const notification = convertRealtimeUpdateToNotification(payload)
            notificationHandlers.forEach(handler => handler(notification))
          }
        )
        .subscribe()
    }

    notificationHandlers.add(callback)
  }

  // Unsubscribe from notifications
  static unsubscribeFromNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): void {
    notificationHandlers.delete(callback)
    
    if (notificationHandlers.size === 0 && notificationSubscription) {
      notificationSubscription.unsubscribe()
      notificationSubscription = null
    }
  }

  // Private method to deliver notification
  private static async deliverNotification(
    notification: Notification,
    retryCount: number = 0
  ): Promise<void> {
    try {
      // Get user's active devices
      const devices = await this.getUserDevices(notification.user_id)

      // Deliver to each device
      await Promise.all(
        devices.map(async (device) => {
          try {
            await this.sendToDevice(notification, device)
          } catch (error) {
            console.error(
              `Failed to deliver notification to device ${device.id}:`,
              error
            )
          }
        })
      )
    } catch (error) {
      console.error('Error delivering notification:', error)

      // Retry logic
      if (retryCount < this.MAX_RETRIES) {
        setTimeout(() => {
          this.deliverNotification(notification, retryCount + 1)
        }, this.RETRY_DELAY * Math.pow(2, retryCount))
      }
    }
  }

  // Private method to send notification to a specific device
  private static async sendToDevice(
    notification: Notification,
    device: NotificationDevice
  ): Promise<void> {
    switch (device.device_type) {
      case 'web':
        await this.sendWebPushNotification(notification, device)
        break
      case 'android':
        await this.sendAndroidNotification(notification, device)
        break
      case 'ios':
        await this.sendIOSNotification(notification, device)
        break
    }
  }

  // Web Push notification
  private static async sendWebPushNotification(
    notification: Notification,
    device: NotificationDevice
  ): Promise<void> {
    // Implementation depends on web push service being used
    console.log('Sending web push notification:', {
      notification,
      deviceToken: device.device_token,
    })
  }

  // Android notification
  private static async sendAndroidNotification(
    notification: Notification,
    device: NotificationDevice
  ): Promise<void> {
    // Implementation depends on FCM or other Android push service
    console.log('Sending Android notification:', {
      notification,
      deviceToken: device.device_token,
    })
  }

  // iOS notification
  private static async sendIOSNotification(
    notification: Notification,
    device: NotificationDevice
  ): Promise<void> {
    // Implementation depends on APNS
    console.log('Sending iOS notification:', {
      notification,
      deviceToken: device.device_token,
    })
  }

  // Get notification statistics
  static async getNotificationStats(
    userId: string
  ): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching notification stats:', error)
      return {}
    }

    return {
      total: data.length,
      unread: data.filter((n) => !n.read_at).length,
      byType: data.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPriority: data.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }
  }
}

export interface NotificationDevice {
  id: string
  user_id: string
  device_token: string
  device_type: 'web' | 'android' | 'ios'
  is_active: boolean
  last_used_at?: string
  created_at: string
  updated_at: string
}
