import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Switch } from '@headlessui/react'
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline'

// Database types
interface DbNotificationSettings {
  user_id: string
  created_at: string
  updated_at: string
  payment_reminders: boolean
  high_priority_recommendations: boolean
  balance_alerts: boolean
  weekly_summary: boolean
  email_frequency: 'instant' | 'daily' | 'weekly'
  bill_reminders: boolean | null
  budget_alerts: boolean | null
  debt_reminders: boolean | null
  email_notifications: boolean | null
  goal_reminders: boolean | null
}

// UI state type
interface NotificationSettings {
  payment_reminders: boolean
  high_priority_recommendations: boolean
  balance_alerts: boolean
  weekly_summary: boolean
  email_frequency: 'instant' | 'daily' | 'weekly'
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function NotificationPreferences() {
  const [settings, setSettings] = useState<NotificationSettings>({
    payment_reminders: true,
    high_priority_recommendations: true,
    balance_alerts: true,
    weekly_summary: true,
    email_frequency: 'daily',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          await createDefaultSettings(userData.user.id)
        } else {
          throw error
        }
      } else if (data) {
        const dbData = data as DbNotificationSettings
        const uiSettings: NotificationSettings = {
          payment_reminders: dbData.payment_reminders ?? true,
          high_priority_recommendations: dbData.high_priority_recommendations ?? true,
          balance_alerts: dbData.balance_alerts ?? true,
          weekly_summary: dbData.weekly_summary ?? true,
          email_frequency: dbData.email_frequency || 'daily'
        }
        setSettings(uiSettings)
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
      setError('Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }

  async function createDefaultSettings(userId: string) {
    try {
      const defaultSettings: Omit<DbNotificationSettings, 'created_at' | 'updated_at'> & {
        created_at?: string
        updated_at?: string
      } = {
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_reminders: settings.payment_reminders,
        high_priority_recommendations: settings.high_priority_recommendations,
        balance_alerts: settings.balance_alerts,
        weekly_summary: settings.weekly_summary,
        email_frequency: settings.email_frequency,
        bill_reminders: null,
        budget_alerts: null,
        debt_reminders: null,
        email_notifications: null,
        goal_reminders: null
      }

      const { error } = await supabase
        .from('user_notification_settings')
        .insert([defaultSettings])

      if (error) throw error
    } catch (error) {
      console.error('Error creating default settings:', error)
      setError('Failed to create default settings')
    }
  }

  async function updateSettings(
    key: keyof NotificationSettings,
    value: boolean | string
  ) {
    setSaving(true)
    setError('')

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const updateData: Partial<DbNotificationSettings> = {
        [key]: value,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_notification_settings')
        .update(updateData)
        .eq('user_id', userData.user.id)

      if (error) throw error

      setSettings((prev) => ({ ...prev, [key]: value }))
    } catch (error) {
      console.error('Error updating notification settings:', error)
      setError('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Notification Preferences
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Choose how and when you want to receive notifications.</p>
        </div>

        <div className="mt-6">
          <Switch.Group as="div" className="flex items-center justify-between">
            <Switch.Label as="span" className="flex flex-grow flex-col" passive>
              <span className="text-sm font-medium text-gray-900">Payment Reminders</span>
              <span className="text-sm text-gray-500">
                Get notified when payments are due
              </span>
            </Switch.Label>
            <Switch
              checked={settings.payment_reminders}
              onChange={(checked) => updateSettings('payment_reminders', checked)}
              className={classNames(
                settings.payment_reminders ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
              )}
            >
              <span
                className={classNames(
                  settings.payment_reminders ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )}
              >
                <span
                  className={classNames(
                    settings.payment_reminders
                      ? 'opacity-0 duration-100 ease-out'
                      : 'opacity-100 duration-200 ease-in',
                    'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
                  )}
                  aria-hidden="true"
                >
                  <BellSlashIcon className="h-3 w-3 text-gray-400" />
                </span>
                <span
                  className={classNames(
                    settings.payment_reminders
                      ? 'opacity-100 duration-200 ease-in'
                      : 'opacity-0 duration-100 ease-out',
                    'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
                  )}
                  aria-hidden="true"
                >
                  <BellIcon className="h-3 w-3 text-indigo-600" />
                </span>
              </span>
            </Switch>
          </Switch.Group>

          <Switch.Group as="div" className="mt-6 flex items-center justify-between">
            <Switch.Label as="span" className="flex flex-grow flex-col" passive>
              <span className="text-sm font-medium text-gray-900">
                High Priority Recommendations
              </span>
              <span className="text-sm text-gray-500">
                Get notified about important debt recommendations
              </span>
            </Switch.Label>
            <Switch
              checked={settings.high_priority_recommendations}
              onChange={(checked) =>
                updateSettings('high_priority_recommendations', checked)
              }
              className={classNames(
                settings.high_priority_recommendations ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
              )}
            >
              <span
                className={classNames(
                  settings.high_priority_recommendations
                    ? 'translate-x-5'
                    : 'translate-x-0',
                  'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )}
              >
                <span
                  className={classNames(
                    settings.high_priority_recommendations
                      ? 'opacity-0 duration-100 ease-out'
                      : 'opacity-100 duration-200 ease-in',
                    'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
                  )}
                  aria-hidden="true"
                >
                  <BellSlashIcon className="h-3 w-3 text-gray-400" />
                </span>
                <span
                  className={classNames(
                    settings.high_priority_recommendations
                      ? 'opacity-100 duration-200 ease-in'
                      : 'opacity-0 duration-100 ease-out',
                    'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
                  )}
                  aria-hidden="true"
                >
                  <BellIcon className="h-3 w-3 text-indigo-600" />
                </span>
              </span>
            </Switch>
          </Switch.Group>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
