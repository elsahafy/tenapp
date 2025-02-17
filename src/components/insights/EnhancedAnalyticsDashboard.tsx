import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { MLService } from '@/lib/services/mlService'
import type { TransactionFilter } from '@/lib/services/mlService'
import type { AnomalyDetectionResult } from '@/lib/services/mlService'
import type { PredictionResult } from '@/lib/services/mlService'
import type { PatternResult } from '@/lib/services/mlService'
import { formatCurrency } from '@/lib/utils/format'
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

export default function EnhancedAnalyticsDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyDetectionResult | null>(null)
  const [predictions, setPredictions] = useState<PredictionResult | null>(null)
  const [patterns, setPatterns] = useState<PatternResult[]>([])
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())

  const fetchData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      const filter: TransactionFilter = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'expense'
      }

      const [anomaliesData, predictionsData, patternsData] = await Promise.all([
        MLService.detectAnomaliesWithFilter(user.id, filter),
        MLService.predictFutureSpending(user.id, filter),
        MLService.recognizePatterns(user.id, filter)
      ])

      setAnomalies(anomaliesData)
      setPredictions(predictionsData)
      setPatterns(patternsData)
    } catch (error) {
      console.error('Error fetching ML insights:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id, startDate, endDate])

  const renderFactors = (factor: { metric: string; impact: number }, factorIndex: number) => (
    <div key={factorIndex} className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{factor.metric}</span>
      <span className="text-sm font-medium">
        {(factor.impact * 100).toFixed(1)}% impact
      </span>
    </div>
  )

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please sign in to view analytics</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <p className="text-sm text-red-700 mt-2">{error}</p>
          </div>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0">
          <button
            onClick={fetchData}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Refresh Analytics
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Anomalies Section */}
      {anomalies && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 inline-block mr-2 text-yellow-500" />
            Spending Anomalies
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {anomalies.isAnomaly ? 'Anomaly detected' : 'No anomalies detected'}
                  </p>
                  <p className="mt-2 text-sm text-yellow-700">
                    Score: {(anomalies.score * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            {anomalies.factors.map((factor, index) => (
              <div key={index} className="mt-3">
                <p className="text-sm text-gray-500">
                  {factor.metric}: Expected ${factor.expected.toFixed(2)}, 
                  Actual ${factor.actual.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictions Section */}
      {predictions && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <ChartBarIcon className="h-5 w-5 inline-block mr-2 text-blue-500" />
            Spending Predictions
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                Predicted spending: ${predictions.amount.toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-blue-700">
                Confidence: {(predictions.confidence * 100).toFixed(1)}%
              </p>
              <p className="mt-2 text-sm text-blue-700">
                Trend: {predictions.trend}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Patterns Section */}
      {patterns.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <ArrowTrendingUpIcon className="h-5 w-5 inline-block mr-2 text-green-500" />
            Spending Patterns
          </h2>
          <div className="space-y-4">
            {patterns.map((pattern, index) => (
              <div key={index} className="border-l-4 border-green-400 bg-green-50 p-4">
                <p className="text-sm text-green-700">
                  {pattern.type}: {pattern.description}
                </p>
                <p className="mt-2 text-sm text-green-700">
                  Confidence: {(pattern.confidence * 100).toFixed(1)}%
                </p>
                <p className="mt-2 text-sm text-green-700">
                  Impact: {(pattern.impact * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
