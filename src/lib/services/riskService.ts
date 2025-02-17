import { supabase } from '../supabase'
import type { Database } from '../types/database'
import type { RiskFactor } from '../types/database'

type Tables = Database['public']['Tables']
type RiskProfileRow = Tables['risk_profiles']['Row']
type RiskMetricsRow = Tables['risk_metrics']['Row']
type RiskCategoryRow = Tables['risk_categories']['Row']

export interface Recommendation {
  category: string
  action: string
  priority: 'high' | 'medium' | 'low'
  impact: string
}

export interface RiskProfile {
  id: string
  profile_type: string
  risk_factors: RiskFactor[]
  risk_score: number
  recommendations: Recommendation[]
  created_at: string
  updated_at: string
  last_updated: string
}

export interface RiskAssessment {
  overall_risk_score: number
  risk_categories: {
    category: string
    score: number
    factors: RiskFactor[]
  }[]
  high_risk_areas: {
    area: string
    score: number
    recommendations: string[]
  }[]
  riskTrend: {
    date: string
    score: number
  }[]
}

export interface RiskMetrics extends Omit<RiskMetricsRow, 'user_id'> {
  categories: RiskCategory[]
}

export interface RiskCategory extends RiskCategoryRow {
  recommendations: string[]
}

export class RiskService {
  static async getRiskProfile(
    userId: string,
    profileType: string
  ): Promise<RiskProfile | null> {
    const { data, error } = await supabase
      .from('risk_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_type', profileType)
      .single()

    if (error) {
      console.error('Error fetching risk profile:', error)
      return null
    }
    return data
  }

  static async updateRiskProfile(
    userId: string,
    profileType: string,
    riskFactors: RiskFactor[]
  ): Promise<RiskProfile | null> {
    try {
      // Calculate risk score and generate recommendations
      const { data: profileData, error: rpcError } = await supabase.rpc('generate_risk_profile', {
        profile_data: {
          user_id: userId,
          profile_type: profileType,
          risk_factors: riskFactors,
        },
      })

      if (rpcError) throw rpcError

      const { data, error } = await supabase
        .from('risk_profiles')
        .upsert({
          user_id: userId,
          profile_type: profileType,
          risk_score: profileData.risk_score,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating risk profile:', error)
      return null
    }
  }

  static async assessPortfolioRisk(
    userId: string,
    portfolioData: Record<string, any>
  ): Promise<RiskAssessment | null> {
    try {
      // Get historical data for risk assessment
      const endDate = new Date()
      const startDate = new Date()
      startDate.setFullYear(startDate.getFullYear() - 1)

      const { data: historicalData, error: historicalError } = await supabase
        .from('portfolio_snapshots')
        .select('timestamp, risk_metrics')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp')

      if (historicalError) throw historicalError

      // Calculate risk metrics from historical data
      const riskTrend = historicalData.map((snapshot: { timestamp: string; risk_metrics: any }) => ({
        date: snapshot.timestamp,
        score: this.calculateRiskScore(snapshot.risk_metrics),
      }))

      const currentRiskMetrics = await this.getRiskMetrics(userId)
      if (!currentRiskMetrics) return null

      const highRiskAreas = currentRiskMetrics.categories
        .filter(category => category.score >= 7)
        .map(category => ({
          area: category.name,
          score: category.score,
          recommendations: category.recommendations,
        }))

      return {
        overall_risk_score: currentRiskMetrics.overall_score,
        risk_categories: currentRiskMetrics.categories.map(cat => ({
          category: cat.name,
          score: cat.score,
          factors: [], // Populate this based on your risk factor calculation logic
        })),
        high_risk_areas: highRiskAreas,
        riskTrend,
      }
    } catch (error) {
      console.error('Error assessing portfolio risk:', error)
      return null
    }
  }

  static async getRiskMetrics(userId: string): Promise<RiskMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('risk_metrics')
        .select('*, categories:risk_categories(*)')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting risk metrics:', error)
      return null
    }
  }

  static async updateRiskMetrics(
    userId: string,
    updates: Partial<Omit<RiskMetrics, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<RiskMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('risk_metrics')
        .update({
          ...updates,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select('*, categories:risk_categories(*)')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating risk metrics:', error)
      return null
    }
  }

  static async updateRiskCategory(
    categoryId: string,
    updates: Partial<Omit<RiskCategory, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<RiskCategory | null> {
    try {
      const { data, error } = await supabase
        .from('risk_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating risk category:', error)
      return null
    }
  }

  private static calculateRiskScore(metrics: any): number {
    // Implement your risk score calculation logic here
    return 0 // Placeholder
  }
}
