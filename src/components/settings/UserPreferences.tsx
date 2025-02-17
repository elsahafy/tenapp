import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import type { UserPreferences as UserPreferencesType } from '@/lib/services/personalizationService'
import { PersonalizationService } from '@/lib/services/personalizationService'
import { Switch } from '@headlessui/react'
import { Slider } from '@/components/ui/Slider'
import { Select } from '@/components/ui/Select'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function UserPreferences() {
  const { user } = useUser()
  const [preferences, setPreferences] = useState<UserPreferencesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      setError(null)
      const userPrefs = await PersonalizationService.getUserPreferences(user!.id)
      setPreferences(userPrefs)
    } catch (err) {
      setError('Failed to load preferences')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user || !preferences) return
    
    setSaving(true)
    setError(null)
    
    try {
      await PersonalizationService.updateUserPreferences(user.id, preferences)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleInsight = (type: keyof UserPreferencesType['insight_preferences']) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      insight_preferences: {
        ...preferences.insight_preferences,
        [type]: !preferences.insight_preferences[type],
      },
    })
  }

  const handleToggleNotification = (type: keyof UserPreferencesType['notification_preferences']) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      notification_preferences: {
        ...preferences.notification_preferences,
        [type]: !preferences.notification_preferences[type],
      },
    })
  }

  const handleThresholdChange = (
    type: keyof UserPreferencesType['notification_preferences']['threshold'],
    value: number
  ) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      notification_preferences: {
        ...preferences.notification_preferences,
        threshold: {
          ...preferences.notification_preferences.threshold,
          [type]: value,
        },
      },
    })
  }

  const handleLearningPreferenceChange = (
    type: keyof UserPreferencesType['learning_preferences'],
    value: string
  ) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      learning_preferences: {
        ...preferences.learning_preferences,
        [type]: value,
      },
    })
  }

  if (!user) {
    return (
      <div className="text-center text-gray-600">
        Please log in to manage your preferences
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

  if (!preferences) {
    return (
      <div className="text-center text-red-600">
        {error || 'Failed to load preferences'}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
        {/* Header */}
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Personalization Preferences
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Customize your experience and notification settings
          </p>
        </div>

        {/* Insight Preferences */}
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Insight Types
          </h4>
          <div className="space-y-4">
            {Object.entries(preferences.insight_preferences).map(([type, enabled]) => (
              <Switch.Group key={type} as="div" className="flex items-center justify-between">
                <Switch.Label as="span" className="flex-grow flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {type.charAt(0).toUpperCase() + type.slice(1)} Insights
                  </span>
                  <span className="text-sm text-gray-500">
                    {`Receive insights about your ${type}`}
                  </span>
                </Switch.Label>
                <Switch
                  checked={enabled}
                  onChange={() => handleToggleInsight(type as keyof UserPreferencesType['insight_preferences'])}
                  className={classNames(
                    enabled ? 'bg-blue-600' : 'bg-gray-200',
                    'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  )}
                >
                  <span
                    className={classNames(
                      enabled ? 'translate-x-5' : 'translate-x-0',
                      'pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                    )}
                  />
                </Switch>
              </Switch.Group>
            ))}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Notifications
          </h4>
          <div className="space-y-4">
            <Switch.Group as="div" className="flex items-center justify-between">
              <Switch.Label as="span" className="flex-grow flex flex-col">
                <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                <span className="text-sm text-gray-500">
                  Receive insights and updates via email
                </span>
              </Switch.Label>
              <Switch
                checked={preferences.notification_preferences.email}
                onChange={() => handleToggleNotification('email')}
                className={classNames(
                  preferences.notification_preferences.email ? 'bg-blue-600' : 'bg-gray-200',
                  'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                )}
              >
                <span
                  className={classNames(
                    preferences.notification_preferences.email ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                  )}
                />
              </Switch>
            </Switch.Group>

            <Switch.Group as="div" className="flex items-center justify-between">
              <Switch.Label as="span" className="flex-grow flex flex-col">
                <span className="text-sm font-medium text-gray-900">Push Notifications</span>
                <span className="text-sm text-gray-500">
                  Receive real-time updates in your browser
                </span>
              </Switch.Label>
              <Switch
                checked={preferences.notification_preferences.push}
                onChange={() => handleToggleNotification('push')}
                className={classNames(
                  preferences.notification_preferences.push ? 'bg-blue-600' : 'bg-gray-200',
                  'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                )}
              >
                <span
                  className={classNames(
                    preferences.notification_preferences.push ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                  )}
                />
              </Switch>
            </Switch.Group>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notification Frequency
              </label>
              <Select
                value={preferences.notification_preferences.frequency}
                onChange={(value) =>
                  setPreferences({
                    ...preferences,
                    notification_preferences: {
                      ...preferences.notification_preferences,
                      frequency: value as 'daily' | 'weekly' | 'monthly',
                    },
                  })
                }
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Threshold Settings */}
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Insight Thresholds
          </h4>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anomaly Detection Confidence ({preferences.notification_preferences.threshold.anomaly_confidence}%)
              </label>
              <Slider
                value={preferences.notification_preferences.threshold.anomaly_confidence}
                onChange={(value) => handleThresholdChange('anomaly_confidence', value)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pattern Recognition Confidence ({preferences.notification_preferences.threshold.pattern_confidence}%)
              </label>
              <Slider
                value={preferences.notification_preferences.threshold.pattern_confidence}
                onChange={(value) => handleThresholdChange('pattern_confidence', value)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prediction Confidence ({preferences.notification_preferences.threshold.prediction_confidence}%)
              </label>
              <Slider
                value={preferences.notification_preferences.threshold.prediction_confidence}
                onChange={(value) => handleThresholdChange('prediction_confidence', value)}
                min={0}
                max={100}
                step={5}
              />
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Learning Preferences
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Tolerance
              </label>
              <Select
                value={preferences.learning_preferences.risk_tolerance}
                onChange={(value) =>
                  handleLearningPreferenceChange('risk_tolerance', value)
                }
                options={[
                  { value: 'conservative', label: 'Conservative' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'aggressive', label: 'Aggressive' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Style
              </label>
              <Select
                value={preferences.learning_preferences.investment_style}
                onChange={(value) =>
                  handleLearningPreferenceChange('investment_style', value)
                }
                options={[
                  { value: 'passive', label: 'Passive' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'active', label: 'Active' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Savings Priority
              </label>
              <Select
                value={preferences.learning_preferences.savings_priority}
                onChange={(value) =>
                  handleLearningPreferenceChange('savings_priority', value)
                }
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Strictness
              </label>
              <Select
                value={preferences.learning_preferences.budget_strictness}
                onChange={(value) =>
                  handleLearningPreferenceChange('budget_strictness', value)
                }
                options={[
                  { value: 'strict', label: 'Strict' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'flexible', label: 'Flexible' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          {error && (
            <p className="text-sm text-red-600 mb-2">{error}</p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={classNames(
              'inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              saving ? 'opacity-50 cursor-not-allowed' : ''
            )}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}
