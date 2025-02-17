import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { RealtimeService, type RealtimeUpdate } from '@/lib/services/realtimeService'
import { MarketService, type MarketData } from '@/lib/services/marketService'
import { AlertService, type Alert } from '@/lib/services/alertService'
import { NotificationService, type Notification } from '@/lib/services/notificationService'
import { formatCurrency, formatPercentage, formatTimeAgo } from '@/lib/utils/format'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { LineChart } from '@/components/charts/LineChart'

interface LiveDataState {
  marketData: ExtendedMarketData[]
  alerts: Alert[]
  notifications: Notification[]
  isConnected: boolean
}

interface ExtendedMarketData extends Omit<MarketData, 'additional_data'> {
  priceHistory: { time: string; price: number }[]
  additional_data?: Record<string, any>
}

export default function LiveDataDashboard() {
  const { user } = useAuth()
  const [state, setState] = useState<LiveDataState>({
    marketData: [],
    alerts: [],
    notifications: [],
    isConnected: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSymbols] = useState(['BTC', 'ETH', 'SPY', 'AAPL']) // Example symbols

  useEffect(() => {
    if (user) {
      initializeDashboard()
      return () => cleanup()
    }
  }, [user])

  const initializeDashboard = async () => {
    try {
      setLoading(true)
      setError(null)

      // Initialize real-time service
      await RealtimeService.initializeForUser(user!.id)

      // Load initial data
      const [marketData, alerts, notifications] = await Promise.all([
        MarketService.getMarketDataBatch(selectedSymbols),
        AlertService.getUserAlerts(user!.id),
        NotificationService.getUserNotifications(user!.id, { limit: 10 }),
      ])

      setState({
        marketData: marketData.map(data => ({
          ...data,
          priceHistory: generateMockPriceHistory(),
        })),
        alerts,
        notifications,
        isConnected: RealtimeService.isConnected(),
      })

      // Subscribe to updates
      subscribeToUpdates()
    } catch (err) {
      console.error('Error initializing dashboard:', err)
      setError('Failed to initialize dashboard')
    } finally {
      setLoading(false)
    }
  }

  const generateMockPriceHistory = () => {
    // Generate mock price history data for demo purposes
    const history: { time: string; price: number }[] = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      history.push({
        time: time.toISOString(),
        price: Math.random() * 100,
      })
    }
    return history
  }

  const subscribeToUpdates = () => {
    // Market data updates
    const unsubscribe = MarketService.subscribeToMarketUpdates(selectedSymbols, (newData) => {
      setState((prev) => {
        const index = prev.marketData.findIndex(item => item.symbol === newData.symbol)
        if (index === -1) {
          return {
            ...prev,
            marketData: [...prev.marketData, { ...newData, priceHistory: generateMockPriceHistory() }]
          }
        }
        const updated = { ...prev }
        updated.marketData[index] = { ...newData, priceHistory: updated.marketData[index].priceHistory }
        return updated
      })
    })

    // Alert updates
    AlertService.subscribeToAlerts(user!.id, (alert: Alert) => {
      setState((prev) => ({
        ...prev,
        alerts: [alert, ...prev.alerts.filter((a) => a.id !== alert.id)],
      }))
    })

    // Notification updates
    NotificationService.subscribeToNotifications(user!.id, (notification: Notification) => {
      setState((prev) => ({
        ...prev,
        notifications: [notification, ...prev.notifications.slice(0, 9)],
      }))
    })

    // Connection status updates
    RealtimeService.addListener('connection', (update: RealtimeUpdate) => {
      setState((prev) => ({
        ...prev,
        isConnected: update.status === 'connected',
      }))
    })

    return unsubscribe
  }

  const cleanup = () => {
    RealtimeService.cleanup(user!.id)
  }

  if (!user) {
    return (
      <div className="text-center text-gray-600">
        Please log in to view live data
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-lg ${
          state.isConnected ? 'bg-green-50' : 'bg-red-50'
        }`}
      >
        <span
          className={`text-sm font-medium ${
            state.isConnected ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {state.isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <div
          className={`h-2 w-2 rounded-full ${
            state.isConnected ? 'bg-green-600' : 'bg-red-600'
          }`}
        />
      </div>

      {/* Market Data */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
          <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-500" />
          Live Market Data
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {state.marketData.map((data) => (
            <div
              key={data.symbol}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {data.name}
                  </h4>
                  <p className="text-xs text-gray-500">{data.symbol}</p>
                </div>
                {data.change_percentage_24h > 0 ? (
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="mt-2">
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(data.price)}
                </p>
                <p
                  className={`text-sm ${
                    data.change_percentage_24h > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatPercentage(data.change_percentage_24h)}
                </p>
              </div>
              <div className="mt-4 h-20">
                <LineChart
                  data={data.priceHistory.map(p => p.price)}
                  labels={data.priceHistory.map(p => p.time)}
                  color={data.change_percentage_24h > 0 ? '#22c55e' : '#ef4444'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
          <BellIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Recent Alerts
        </h3>
        <div className="space-y-4">
          {state.alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {alert.title}
                </h4>
                <p className="text-sm text-gray-500 mt-1">{alert.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimeAgo(alert.created_at)}
                </p>
              </div>
              {!alert.read && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  New
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
          <BellIcon className="h-5 w-5 mr-2 text-blue-500" />
          Recent Notifications
        </h3>
        <div className="space-y-4">
          {state.notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {notification.data.title}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {notification.data.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimeAgo(notification.created_at)}
                </p>
              </div>
              {!notification.read && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  New
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
