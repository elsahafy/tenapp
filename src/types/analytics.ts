// Risk Assessment Types
export interface RiskMetrics {
  overall_score: number
  categories: RiskCategory[]
  trend_data?: RiskTrendData[]
}

export interface RiskCategory {
  name: string
  score: number
  description: string
  recommendations?: string
}

export interface RiskTrendData {
  date: string
  score: number
}

// Portfolio Types
export interface PortfolioSettings {
  risk_tolerance: number
  investment_horizon: number
  rebalancing_frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually'
  constraints?: PortfolioConstraints
}

export interface PortfolioConstraints {
  min_allocation?: Record<string, number>
  max_allocation?: Record<string, number>
  excluded_assets?: string[]
}

// Scenario Analysis Types
export interface ScenarioParameters {
  type: 'custom' | 'market_crash' | 'recession' | 'interest_rate_shock'
  duration: number
  severity: 'mild' | 'moderate' | 'severe'
  custom_parameters?: Record<string, any>
}

export interface ScenarioAnalysis {
  id: string
  name: string
  description: string
  scenario_type: ScenarioParameters['type']
  parameters: ScenarioParameters
  status: 'pending' | 'running' | 'completed' | 'failed'
  results?: ScenarioResults
  created_at: string
  updated_at: string
}

export interface ScenarioResults {
  portfolio_value: {
    initial_value: number
    final_value: number
    change_percentage: number
  }
  risk_metrics: {
    volatility: number
    sharpe_ratio: number
    max_drawdown: number
  }
}

// Custom Reporting Types
export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'performance' | 'risk' | 'allocation' | 'custom'
  parameters: ReportParameters
}

export interface ReportParameters {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  timeframe: {
    start_date?: string
    end_date?: string
    period?: number
  }
  metrics: string[]
}

export interface ReportSchedule {
  id: string
  report_id: string
  frequency: 'daily' | 'weekly' | 'monthly'
  day: number
  time: string
  recipients: string[]
  last_run?: string
  next_run?: string
}

export interface CustomReport {
  id: string
  name: string
  description: string
  template_id: string
  parameters: ReportParameters
  created_at: string
  last_generated: string
  status: 'active' | 'inactive'
}

// Chart Types
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}
