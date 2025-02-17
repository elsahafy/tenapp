'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import {
  createScenario,
  updateScenario,
  deleteScenario,
  getScenarios,
  calculateScenarioResults,
  updateScenarioResults,
  type Scenario,
  type ScenarioType,
  type ScenarioParameters,
  type ScenarioResults
} from '@/lib/services/scenarioService'

interface NewScenario {
  name: string
  description: string
  scenario_type: ScenarioType
  parameters: ScenarioParameters
}

export default function ScenarioAnalysis() {
  const { user } = useUser()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewScenarioModal, setShowNewScenarioModal] = useState(false)
  const [newScenario, setNewScenario] = useState<NewScenario>({
    name: '',
    description: '',
    scenario_type: 'retirement',
    parameters: {
      initialBalance: 100000,
      monthlyContribution: 1000,
      targetRetirementAge: 65,
      currentAge: 30,
      riskTolerance: 'moderate',
      expectedReturn: 0.07,
      inflationRate: 0.03
    }
  })

  useEffect(() => {
    if (!user) return

    const fetchScenarios = async () => {
      try {
        setLoading(true)
        const data = await getScenarios(user.id)
        setScenarios(data)
      } catch (error) {
        console.error('Error fetching scenarios:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchScenarios()
  }, [user])

  const handleCreateScenario = async () => {
    if (!user) return

    try {
      const scenario = await createScenario({
        user_id: user.id,
        name: newScenario.name,
        description: newScenario.description,
        scenario_type: newScenario.scenario_type,
        parameters: newScenario.parameters,
        status: 'pending'
      })
      setScenarios(prev => [...prev, scenario])
      setShowNewScenarioModal(false)
      setNewScenario({
        name: '',
        description: '',
        scenario_type: 'retirement',
        parameters: {
          initialBalance: 100000,
          monthlyContribution: 1000,
          targetRetirementAge: 65,
          currentAge: 30,
          riskTolerance: 'moderate',
          expectedReturn: 0.07,
          inflationRate: 0.03
        }
      })
    } catch (error) {
      console.error('Error creating scenario:', error)
    }
  }

  const handleDeleteScenario = async (scenarioId: string) => {
    if (!user) return

    try {
      await deleteScenario(scenarioId)
      setScenarios(prev => prev.filter(s => s.id !== scenarioId))
    } catch (error) {
      console.error('Error deleting scenario:', error)
    }
  }

  const handleRunScenario = async (scenario: Scenario) => {
    if (!user) return

    try {
      const results = await calculateScenarioResults(scenario)
      const updatedScenario = await updateScenarioResults(scenario.id, results)
      setScenarios(prev =>
        prev.map(s => (s.id === scenario.id ? updatedScenario : s))
      )
    } catch (error) {
      console.error('Error running scenario:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  if (!user || loading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Scenario Analysis</h2>
          <p className="mt-1 text-sm text-gray-500">
            Create and analyze different financial scenarios
          </p>
        </div>
        <button
          onClick={() => setShowNewScenarioModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          New Scenario
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <div>
                <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                <p className="text-sm text-gray-500">{scenario.description}</p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900">Initial Balance</h4>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatCurrency(scenario.parameters.initialBalance)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900">Monthly Contribution</h4>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatCurrency(scenario.parameters.monthlyContribution)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900">Target Retirement Age</h4>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {scenario.parameters.targetRetirementAge}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => handleRunScenario(scenario)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Run
                </button>
                <button
                  onClick={() => handleDeleteScenario(scenario.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNewScenarioModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create New Scenario
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={newScenario.name}
                  onChange={(e) =>
                    setNewScenario((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newScenario.description}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Scenario Type
                </label>
                <select
                  value={newScenario.scenario_type}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      scenario_type: e.target.value as ScenarioType,
                      parameters: {
                        ...prev.parameters,
                        type: e.target.value as ScenarioType
                      }
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="retirement">Retirement</option>
                  <option value="college_fund">College Fund</option>
                  <option value="emergency_fund">Emergency Fund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Initial Balance
                </label>
                <input
                  type="number"
                  value={newScenario.parameters.initialBalance}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        initialBalance: parseInt(e.target.value, 10)
                      }
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Monthly Contribution
                </label>
                <input
                  type="number"
                  value={newScenario.parameters.monthlyContribution}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        monthlyContribution: parseInt(e.target.value, 10)
                      }
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Retirement Age
                </label>
                <input
                  type="number"
                  value={newScenario.parameters.targetRetirementAge}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        targetRetirementAge: parseInt(e.target.value, 10)
                      }
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewScenarioModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateScenario}
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
