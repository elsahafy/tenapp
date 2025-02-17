import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type ScenarioType = 'retirement' | 'debt' | 'investment' | 'savings'

export interface ScenarioParameters {
  [key: string]: any
}

export interface ScenarioResults {
  [key: string]: any
}

export interface Scenario {
  id: string
  user_id: string
  name: string
  description: string | null
  scenario_type: ScenarioType
  parameters: ScenarioParameters
  results: ScenarioResults | null
  status: string | null
  created_at: string
  updated_at: string
}

export async function createScenario(scenario: Omit<Scenario, 'id' | 'created_at' | 'updated_at' | 'results'>) {
  const { data, error } = await supabase
    .from('scenario_analyses')
    .insert({
      user_id: scenario.user_id,
      name: scenario.name,
      description: scenario.description,
      scenario_type: scenario.scenario_type,
      parameters: scenario.parameters,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data as Scenario
}

export async function updateScenario(
  id: string,
  updates: Partial<Omit<Scenario, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('scenario_analyses')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Scenario
}

export async function deleteScenario(id: string) {
  const { error } = await supabase
    .from('scenario_analyses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getScenarios(userId: string): Promise<Scenario[]> {
  const { data, error } = await supabase
    .from('scenario_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Scenario[]
}

export async function getScenario(id: string): Promise<Scenario> {
  const { data, error } = await supabase
    .from('scenario_analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Scenario
}

export async function calculateScenarioResults(scenario: Scenario): Promise<ScenarioResults> {
  // Implement your scenario calculation logic here
  // This is just a placeholder
  return {
    calculated: true,
    timestamp: new Date().toISOString(),
  }
}

export async function updateScenarioResults(id: string, results: ScenarioResults) {
  const { data, error } = await supabase
    .from('scenario_analyses')
    .update({
      results,
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Scenario
}
