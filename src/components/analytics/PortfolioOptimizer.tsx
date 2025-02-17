import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { useA11y, useAriaAnnounce } from '@/lib/hooks/useA11y'
import {
  PortfolioService,
  PortfolioSettings,
  OptimizationResult,
} from '@/lib/services/portfolioService'
import {
  ChartBarIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import Tooltip from '@/components/common/Tooltip'
import LoadingState from '@/components/common/LoadingState'
import ErrorBoundary from '@/components/common/ErrorBoundary'

export default function PortfolioOptimizer() {
  const { user } = useUser()
  const [settings, setSettings] = useState<PortfolioSettings | null>(null)
  const [currentAllocation, setCurrentAllocation] = useState<Record<string, number>>({})
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(
    null
  )
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { announce } = useAriaAnnounce()
  const { a11yProps } = useA11y({
    role: 'main',
    ariaLabel: 'Portfolio Optimizer',
  })

  useEffect(() => {
    if (user) {
      loadPortfolioData()
    }
  }, [user])

  useEffect(() => {
    if (error) {
      announce(error, 'assertive')
    }
  }, [error, announce])

  const loadPortfolioData = async () => {
    setIsLoading(true)
    try {
      const settings = await PortfolioService.getSettings(user!.id)
      if (settings) {
        setSettings(settings)
        setCurrentAllocation(settings.target_allocation)
      }
    } catch (err) {
      console.error('Error loading portfolio data:', err)
      setError('Failed to load portfolio data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimize = async () => {
    if (!user || !currentAllocation) return

    try {
      setIsOptimizing(true)
      setError(null)
      const result = await PortfolioService.optimizePortfolio(
        user.id,
        currentAllocation
      )
      setOptimizationResult(result)
    } catch (err) {
      console.error('Error optimizing portfolio:', err)
      setError('Failed to optimize portfolio')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleUpdateSettings = async (updates: Partial<PortfolioSettings>) => {
    if (!user) return

    try {
      const updatedSettings = await PortfolioService.updateSettings(user.id, updates)
      setSettings(updatedSettings)
    } catch (err) {
      console.error('Error updating settings:', err)
      setError('Failed to update settings')
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading portfolio data..." />
  }

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto py-8 px-4" {...a11yProps}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-8 w-8 mr-2 text-blue-600" />
            Portfolio Optimizer
            <Tooltip
              content="Optimize your portfolio allocation based on your risk tolerance and investment goals"
              position="right"
            />
          </h1>
          <p className="mt-2 text-gray-600">
            Optimize your portfolio allocation based on your risk tolerance and investment goals.
          </p>
        </div>

        {/* Settings Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Optimization Settings
            <Tooltip
              content="Configure your portfolio optimization preferences"
              position="right"
            />
          </h2>

          {settings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Risk Tolerance
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.risk_tolerance}
                  onChange={(e) =>
                    handleUpdateSettings({
                      risk_tolerance: parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Investment Horizon (months)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.investment_horizon}
                  onChange={(e) =>
                    handleUpdateSettings({
                      investment_horizon: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rebalancing Frequency
                </label>
                <select
                  value={settings.rebalancing_frequency}
                  onChange={(e) =>
                    handleUpdateSettings({
                      rebalancing_frequency: e.target.value as PortfolioSettings['rebalancing_frequency'],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semi_annually">Semi-Annually</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Investment Constraints
                </label>
                <button
                  onClick={() => {
                    // Open constraints modal
                  }}
                  className="mt-1 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Configure Constraints
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading settings...</p>
          )}
        </div>

        {/* Current Allocation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            Current Allocation
            <Tooltip
              content="Your current portfolio allocation across different assets"
              position="right"
            />
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(currentAllocation).map(([asset, weight]) => (
              <div key={asset} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900">{asset}</div>
                <div className="mt-1 text-2xl font-semibold text-blue-600">
                  {(weight * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optimization Results */}
        {optimizationResult && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              Optimization Results
              <Tooltip
                content="Results of the portfolio optimization analysis"
                position="right"
              />
            </h2>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-800">
                  Expected Return
                </div>
                <div className="mt-1 text-2xl font-semibold text-green-900">
                  {optimizationResult.expected_metrics.returns.annualized_return.toFixed(2)}%
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-800">
                  Sharpe Ratio
                </div>
                <div className="mt-1 text-2xl font-semibold text-blue-900">
                  {optimizationResult.expected_metrics.risk_metrics.sharpe_ratio.toFixed(2)}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-800">
                  Diversification Score
                </div>
                <div className="mt-1 text-2xl font-semibold text-purple-900">
                  {(
                    1 - optimizationResult.expected_metrics.diversification_metrics.concentration_index
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Rebalancing Recommendations */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Recommended Changes
              </h3>
              <div className="space-y-4">
                {optimizationResult.rebalancing_recommendations.map((rec) => (
                  <div
                    key={rec.asset}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{rec.asset}</div>
                      <div className="text-sm text-gray-500">
                        Current: {(rec.current_weight * 100).toFixed(1)}% →{' '}
                        Target: {(rec.target_weight * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div
                      className={`flex items-center ${
                        rec.action === 'buy'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {rec.action === 'buy' ? (
                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
                      )}
                      <span className="font-medium">
                        {rec.action.toUpperCase()}: {rec.amount.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={loadPortfolioData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            aria-label="Refresh portfolio data"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            aria-label={isOptimizing ? 'Optimizing portfolio...' : 'Optimize portfolio'}
          >
            {isOptimizing ? (
              <>
                <LoadingState size="small" type="spinner" className="mr-2" />
                Optimizing...
              </>
            ) : (
              <>
                <ChartBarIcon className="h-4 w-4 mr-1" />
                Optimize Portfolio
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="mt-4 bg-red-50 border border-red-200 rounded-md p-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
