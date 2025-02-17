import { supabase } from '@/lib/supabase'

export interface PortfolioSettings {
  risk_tolerance: number
  investment_horizon: number
  rebalancing_frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually'
  target_allocation: Record<string, number>
  constraints: {
    min_allocation?: Record<string, number>
    max_allocation?: Record<string, number>
    excluded_assets?: string[]
  }
}

export interface PortfolioMetrics {
  returns: {
    total_return: number
    annualized_return: number
    risk_adjusted_return: number
  }
  risk_metrics: {
    volatility: number
    sharpe_ratio: number
    max_drawdown: number
  }
  diversification_metrics: {
    correlation_matrix: Record<string, Record<string, number>>
    concentration_index: number
  }
}

export interface OptimizationResult {
  optimal_allocation: Record<string, number>
  expected_metrics: PortfolioMetrics
  rebalancing_recommendations: {
    asset: string
    current_weight: number
    target_weight: number
    action: 'buy' | 'sell'
    amount: number
  }[]
}

export class PortfolioService {
  static async getSettings(userId: string): Promise<PortfolioSettings | null> {
    const { data, error } = await supabase
      .from('portfolio_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  static async updateSettings(
    userId: string,
    settings: Partial<PortfolioSettings>
  ): Promise<PortfolioSettings> {
    const { data, error } = await supabase
      .from('portfolio_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getHistoricalMetrics(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<PortfolioMetrics[]> {
    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('performance_metrics, risk_metrics')
      .eq('user_id', userId)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp')

    if (error) throw error
    return data.map((snapshot) => ({
      returns: snapshot.performance_metrics.returns,
      risk_metrics: snapshot.risk_metrics,
      diversification_metrics: snapshot.performance_metrics.diversification,
    }))
  }

  static async optimizePortfolio(
    userId: string,
    currentAllocation: Record<string, number>
  ): Promise<OptimizationResult> {
    const settings = await this.getSettings(userId)
    if (!settings) {
      throw new Error('Portfolio settings not found')
    }

    // Get historical data for optimization
    const endDate = new Date().toISOString()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    
    const historicalMetrics = await this.getHistoricalMetrics(
      userId,
      startDate.toISOString(),
      endDate
    )

    // Calculate optimal allocation using Modern Portfolio Theory
    const optimalAllocation = await this.calculateOptimalAllocation(
      currentAllocation,
      settings,
      historicalMetrics
    )

    // Generate rebalancing recommendations
    const recommendations = this.generateRebalancingRecommendations(
      currentAllocation,
      optimalAllocation.optimal_allocation
    )

    return {
      ...optimalAllocation,
      rebalancing_recommendations: recommendations,
    }
  }

  private static async calculateOptimalAllocation(
    currentAllocation: Record<string, number>,
    settings: PortfolioSettings,
    historicalMetrics: PortfolioMetrics[]
  ): Promise<Omit<OptimizationResult, 'rebalancing_recommendations'>> {
    // Call the database function for optimization calculations
    const { data, error } = await supabase.rpc('calculate_portfolio_metrics', {
      portfolio_data: {
        current_allocation: currentAllocation,
        settings: settings,
        historical_metrics: historicalMetrics,
      },
      start_date: new Date(
        new Date().setFullYear(new Date().getFullYear() - 1)
      ).toISOString(),
      end_date: new Date().toISOString(),
    })

    if (error) throw error

    // Process the optimization results
    const optimalAllocation = this.processOptimizationResults(data, settings)

    return {
      optimal_allocation: optimalAllocation,
      expected_metrics: {
        returns: data.returns,
        risk_metrics: data.risk_metrics,
        diversification_metrics: data.diversification_metrics,
      },
    }
  }

  private static processOptimizationResults(
    optimizationData: any,
    settings: PortfolioSettings
  ): Record<string, number> {
    const allocation: Record<string, number> = {}
    
    // Apply optimization results while respecting constraints
    Object.entries(optimizationData.optimal_weights).forEach(([asset, weight]) => {
      const minAllocation = settings.constraints.min_allocation?.[asset] || 0
      const maxAllocation = settings.constraints.max_allocation?.[asset] || 1
      
      allocation[asset] = Math.min(
        Math.max(Number(weight), minAllocation),
        maxAllocation
      )
    })

    // Normalize weights to ensure they sum to 1
    const totalWeight = Object.values(allocation).reduce((a, b) => a + b, 0)
    Object.keys(allocation).forEach((asset) => {
      allocation[asset] = allocation[asset] / totalWeight
    })

    return allocation
  }

  private static generateRebalancingRecommendations(
    currentAllocation: Record<string, number>,
    targetAllocation: Record<string, number>
  ) {
    const recommendations: OptimizationResult['rebalancing_recommendations'] = []

    // Calculate the total portfolio value (assuming it's 100 for percentage calculations)
    const totalValue = 100

    Object.keys({ ...currentAllocation, ...targetAllocation }).forEach((asset) => {
      const currentWeight = currentAllocation[asset] || 0
      const targetWeight = targetAllocation[asset] || 0
      const difference = targetWeight - currentWeight

      if (Math.abs(difference) > 0.001) { // 0.1% threshold for rebalancing
        recommendations.push({
          asset,
          current_weight: currentWeight,
          target_weight: targetWeight,
          action: difference > 0 ? 'buy' : 'sell',
          amount: Math.abs(difference * totalValue),
        })
      }
    })

    return recommendations.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  }

  static async saveSnapshot(
    userId: string,
    snapshot: {
      total_value: number
      allocation: Record<string, number>
      performance_metrics: PortfolioMetrics['returns']
      risk_metrics: PortfolioMetrics['risk_metrics']
    }
  ) {
    const { error } = await supabase.from('portfolio_snapshots').insert({
      user_id: userId,
      timestamp: new Date().toISOString(),
      ...snapshot,
    })

    if (error) throw error
  }

  static async getRebalancingSchedule(userId: string) {
    const settings = await this.getSettings(userId)
    if (!settings) return null

    const { data: lastSnapshot, error } = await supabase
      .from('portfolio_snapshots')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    const lastRebalance = lastSnapshot ? new Date(lastSnapshot.timestamp) : null
    const nextRebalance = this.calculateNextRebalanceDate(
      lastRebalance,
      settings.rebalancing_frequency
    )

    return {
      last_rebalance: lastRebalance,
      next_rebalance: nextRebalance,
      frequency: settings.rebalancing_frequency,
    }
  }

  private static calculateNextRebalanceDate(
    lastRebalance: Date | null,
    frequency: PortfolioSettings['rebalancing_frequency']
  ): Date {
    const now = new Date()
    if (!lastRebalance) return now

    const nextRebalance = new Date(lastRebalance)
    switch (frequency) {
      case 'monthly':
        nextRebalance.setMonth(nextRebalance.getMonth() + 1)
        break
      case 'quarterly':
        nextRebalance.setMonth(nextRebalance.getMonth() + 3)
        break
      case 'semi_annually':
        nextRebalance.setMonth(nextRebalance.getMonth() + 6)
        break
      case 'annually':
        nextRebalance.setFullYear(nextRebalance.getFullYear() + 1)
        break
    }

    return nextRebalance < now ? now : nextRebalance
  }
}
