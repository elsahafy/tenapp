'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { createReport, createSchedule, listReports } from '@/lib/services/reportService'

export interface ReportParameters {
  dateRange: {
    startDate: string
    endDate: string
  }
  filters: Record<string, any>
  groupBy?: string[]
  metrics: string[]
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  timezone: string
  recipients: string[]
}

export interface CustomReport {
  id: string
  user_id: string
  name: string
  description: string
  report_type: string
  parameters: ReportParameters
  schedule?: ReportSchedule
  last_generated: string | null
  created_at: string
  updated_at: string
}

interface NewReport {
  name: string
  description: string
  report_type: string
  parameters: ReportParameters
  schedule?: ReportSchedule
}

const reportTemplates = [
  {
    type: 'spending_analysis',
    name: 'Spending Analysis',
    description: 'Analyze your spending patterns across different categories',
    defaultParameters: {
      dateRange: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      filters: {},
      metrics: ['total_amount', 'category_breakdown', 'trend']
    }
  },
  {
    type: 'savings_report',
    name: 'Savings Report',
    description: 'Track your savings progress and growth over time',
    defaultParameters: {
      dateRange: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      filters: {},
      metrics: ['total_savings', 'growth_rate', 'goal_progress']
    }
  }
]

export default function CustomReporting() {
  const { user } = useUser()
  const [selectedTemplate, setSelectedTemplate] = useState(reportTemplates[0])
  const [reports, setReports] = useState<CustomReport[]>([])
  const [showNewReportModal, setShowNewReportModal] = useState(false)
  const [newReport, setNewReport] = useState<NewReport>({
    name: '',
    description: '',
    report_type: selectedTemplate.type,
    parameters: {
      dateRange: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      filters: {},
      metrics: selectedTemplate.defaultParameters.metrics
    }
  })

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const reportsData = await listReports(user.id)
        setReports(reportsData)
      } catch (error) {
        console.error('Error fetching reports data:', error)
      }
    }

    fetchData()
  }, [user])

  const handleCreateReport = async () => {
    if (!user) return

    try {
      const report = await createReport(user.id, {
        name: newReport.name,
        description: newReport.description,
        report_type: selectedTemplate.type,
        parameters: newReport.parameters,
        schedule: newReport.schedule,
        last_generated: null as string | null
      })
      
      if (newReport.schedule) {
        await createSchedule(user.id, {
          ...newReport.schedule,
          report_id: report.id
        })
      }

      setShowNewReportModal(false)
      setNewReport({
        name: '',
        description: '',
        report_type: selectedTemplate.type,
        parameters: {
          dateRange: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          },
          filters: {},
          metrics: selectedTemplate.defaultParameters.metrics
        }
      })
    } catch (error) {
      console.error('Error creating report:', error)
    }
  }

  if (!user) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Reports</h2>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage custom financial reports
          </p>
        </div>
        <button
          onClick={() => setShowNewReportModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          New Report
        </button>
      </div>

      {showNewReportModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create New Report
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={newReport.name}
                  onChange={(e) =>
                    setNewReport((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newReport.description}
                  onChange={(e) =>
                    setNewReport((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Report Type
                </label>
                <select
                  value={newReport.report_type}
                  onChange={(e) => {
                    const template = reportTemplates.find(t => t.type === e.target.value)!
                    setSelectedTemplate(template)
                    setNewReport(prev => ({
                      ...prev,
                      report_type: template.type,
                      parameters: {
                        ...template.defaultParameters,
                        dateRange: prev.parameters.dateRange
                      }
                    }))
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {reportTemplates.map(template => (
                    <option key={template.type} value={template.type}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newReport.parameters.dateRange.startDate}
                  onChange={(e) =>
                    setNewReport((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        dateRange: {
                          ...prev.parameters.dateRange,
                          startDate: e.target.value
                        }
                      }
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={newReport.parameters.dateRange.endDate}
                  onChange={(e) =>
                    setNewReport((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        dateRange: {
                          ...prev.parameters.dateRange,
                          endDate: e.target.value
                        }
                      }
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewReportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
