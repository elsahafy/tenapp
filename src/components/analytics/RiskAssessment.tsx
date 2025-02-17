import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { useA11y, useAriaAnnounce } from '@/lib/hooks/useA11y'
import {
  type RiskMetrics,
  type RiskCategory,
  RiskService,
} from '@/lib/services/riskService'
import {
  ShieldExclamationIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import Tooltip from '@/components/common/Tooltip'
import LoadingState from '@/components/common/LoadingState'
import ErrorBoundary from '@/components/common/ErrorBoundary'

export default function RiskAssessment() {
  const { user } = useUser()
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { announce } = useAriaAnnounce()
  const { a11yProps } = useA11y({
    role: 'main',
    ariaLabel: 'Risk Assessment',
  })

  useEffect(() => {
    if (user) {
      loadRiskData()
    }
  }, [user])

  useEffect(() => {
    if (error) {
      announce(error, 'assertive')
    }
  }, [error, announce])

  const loadRiskData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const metrics = await RiskService.getRiskMetrics(user!.id)
      setRiskMetrics(metrics)
    } catch (err) {
      console.error('Error loading risk data:', err)
      setError('Failed to load risk assessment data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingState message="Analyzing risk factors..." />
  }

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto py-8 px-4" {...a11yProps}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldExclamationIcon className="h-8 w-8 mr-2 text-blue-600" />
            Risk Assessment
            <Tooltip
              content="Comprehensive analysis of your portfolio's risk factors"
              position="right"
            />
          </h1>
          <p className="mt-2 text-gray-600">
            Analyze and understand your portfolio's risk factors and get recommendations for improvement.
          </p>
        </div>

        {riskMetrics && (
          <>
            {/* Overall Risk Score */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                Overall Risk Score
                <Tooltip
                  content="Your portfolio's aggregate risk score on a scale of 1-100"
                  position="right"
                />
              </h2>
              <div className="relative pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {riskMetrics.overall_score}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">/ 100</span>
                  </div>
                  <span
                    className={`px-2 py-1 text-sm font-medium rounded ${
                      riskMetrics.overall_score < 33
                        ? 'bg-green-100 text-green-800'
                        : riskMetrics.overall_score < 66
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {riskMetrics.overall_score < 33
                      ? 'Low Risk'
                      : riskMetrics.overall_score < 66
                      ? 'Moderate Risk'
                      : 'High Risk'}
                  </span>
                </div>
                <div className="overflow-hidden h-2 mt-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${riskMetrics.overall_score}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      riskMetrics.overall_score < 33
                        ? 'bg-green-500'
                        : riskMetrics.overall_score < 66
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    role="progressbar"
                    aria-valuenow={riskMetrics.overall_score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </div>

            {/* Risk Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                Risk Categories
                <Tooltip
                  content="Breakdown of risk factors by category"
                  position="right"
                />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {riskMetrics.categories.map((category: RiskCategory) => (
                  <div
                    key={category.id}
                    className="bg-gray-50 rounded-lg p-4"
                    role="region"
                    aria-label={`${category.name} risk category`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {category.name}
                      </span>
                      <span
                        className={`px-2 py-1 text-sm font-medium rounded ${
                          category.score < 33
                            ? 'bg-green-100 text-green-800'
                            : category.score < 66
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {category.score}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{category.description}</p>
                    {category.recommendations && (
                      <div className="mt-2 text-sm">
                        <strong className="text-gray-900">Recommendation:</strong>
                        <p className="text-gray-600">{category.recommendations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Trends */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                Risk Trends
                <Tooltip
                  content="Historical trend of your portfolio's risk levels"
                  position="right"
                />
              </h2>
              <div className="h-64">
                {/* Risk trend chart component would go here */}
                <div className="flex items-center justify-center h-full text-gray-500">
                  Chart component placeholder
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={loadRiskData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            aria-label="Refresh risk assessment data"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
          <button
            onClick={() => {
              // Export or share risk report
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            aria-label="Export risk assessment report"
          >
            <ChartBarIcon className="h-4 w-4 mr-1" />
            Export Report
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
