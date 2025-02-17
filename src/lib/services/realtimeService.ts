import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeUpdate {
  type: 'transaction' | 'alert' | 'market' | 'notification'
  status?: 'connected' | 'disconnected'
  data: any
  timestamp: string
}

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map()
  private static listeners: Map<string, ((update: RealtimeUpdate) => void)[]> = new Map()

  // Initialize real-time subscriptions for a user
  static async initializeForUser(userId: string): Promise<void> {
    // Subscribe to user-specific channels
    await Promise.all([
      this.subscribeToTransactions(userId),
      this.subscribeToAlerts(userId),
      this.subscribeToNotifications(userId),
    ])

    // Subscribe to market data (public channel)
    await this.subscribeToMarketData()
  }

  // Subscribe to real-time transaction updates
  private static async subscribeToTransactions(userId: string): Promise<void> {
    const channel = supabase
      .channel(`transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.broadcastUpdate({
            type: 'transaction',
            data: payload.new,
            timestamp: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    this.channels.set(`transactions:${userId}`, channel)
  }

  // Subscribe to alert triggers
  private static async subscribeToAlerts(userId: string): Promise<void> {
    const channel = supabase
      .channel(`alerts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.broadcastUpdate({
            type: 'alert',
            data: payload.new,
            timestamp: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    this.channels.set(`alerts:${userId}`, channel)
  }

  // Subscribe to notifications
  private static async subscribeToNotifications(userId: string): Promise<void> {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.broadcastUpdate({
            type: 'notification',
            data: payload.new,
            timestamp: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    this.channels.set(`notifications:${userId}`, channel)
  }

  // Subscribe to market data updates
  private static async subscribeToMarketData(): Promise<void> {
    const channel = supabase
      .channel('market_data')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_data',
        },
        (payload) => {
          this.broadcastUpdate({
            type: 'market',
            data: payload.new,
            timestamp: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    this.channels.set('market_data', channel)
  }

  // Add a listener for real-time updates
  static addListener(
    channelId: string,
    listener: (update: RealtimeUpdate) => void
  ): void {
    const existingListeners = this.listeners.get(channelId) || []
    this.listeners.set(channelId, [...existingListeners, listener])
  }

  // Remove a listener
  static removeListener(
    channelId: string,
    listener: (update: RealtimeUpdate) => void
  ): void {
    const existingListeners = this.listeners.get(channelId) || []
    this.listeners.set(
      channelId,
      existingListeners.filter((l) => l !== listener)
    )
  }

  // Broadcast an update to all listeners
  private static broadcastUpdate(update: RealtimeUpdate): void {
    this.listeners.forEach((listeners) => {
      listeners.forEach((listener) => {
        try {
          listener(update)
        } catch (error) {
          console.error('Error in realtime listener:', error)
        }
      })
    })
  }

  // Clean up subscriptions
  static async cleanup(userId?: string): Promise<void> {
    if (userId) {
      // Clean up user-specific channels
      const userChannels = [`transactions:${userId}`, `alerts:${userId}`, `notifications:${userId}`]
      userChannels.forEach((channelId) => {
        const channel = this.channels.get(channelId)
        if (channel) {
          channel.unsubscribe()
          this.channels.delete(channelId)
          this.listeners.delete(channelId)
        }
      })
    } else {
      // Clean up all channels
      this.channels.forEach((channel) => {
        channel.unsubscribe()
      })
      this.channels.clear()
      this.listeners.clear()
    }
  }

  // Reconnect all channels
  static async reconnect(): Promise<void> {
    const reconnectPromises = Array.from(this.channels.values()).map((channel) =>
      channel.subscribe()
    )
    await Promise.all(reconnectPromises)
  }

  // Check connection status
  static isConnected(): boolean {
    return Array.from(this.channels.values()).every(
      (channel) => channel.state === 'joined'
    )
  }

  // Get connection state for a specific channel
  static getChannelState(channelId: string): string | null {
    const channel = this.channels.get(channelId)
    return channel ? channel.state : null
  }

  // Utility method to handle connection errors
  static async handleConnectionError(error: any): Promise<void> {
    console.error('Realtime connection error:', error)
    
    // Attempt to reconnect
    try {
      await this.reconnect()
    } catch (reconnectError) {
      console.error('Failed to reconnect:', reconnectError)
      // Implement exponential backoff or other retry strategies here
    }
  }

  // Debug method to get connection status for all channels
  static getDebugInfo(): Record<string, any> {
    const channelStates: Record<string, any> = {}
    this.channels.forEach((channel, channelId) => {
      channelStates[channelId] = {
        state: channel.state,
        listenerCount: (this.listeners.get(channelId) || []).length,
      }
    })
    return channelStates
  }
}
