import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

interface AnalysisOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export class OpenAIService {
  private static defaultOptions: AnalysisOptions = {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
  }

  static async analyze(
    prompt: string,
    options: AnalysisOptions = {}
  ): Promise<string> {
    const mergedOptions = { ...this.defaultOptions, ...options }

    try {
      const response = await openai.chat.completions.create({
        model: mergedOptions.model!,
        temperature: mergedOptions.temperature!,
        max_tokens: mergedOptions.maxTokens!,
        messages: [
          {
            role: 'system',
            content: `You are a financial analysis AI assistant. Analyze financial data and provide insights in JSON format. Focus on actionable recommendations and clear explanations.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      return response.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('OpenAI API Error:', error)
      throw new Error('Failed to analyze data')
    }
  }

  static async generateSpendingAnalysis(
    transactions: any[]
  ): Promise<string> {
    const prompt = `
      Analyze these transactions and identify spending patterns. Focus on:
      1. Category trends (increasing/decreasing/stable)
      2. Monthly averages
      3. Notable changes
      4. Potential areas of concern
      
      Return the analysis in this JSON format:
      [
        {
          "category": string,
          "trend": "increasing" | "decreasing" | "stable",
          "average_amount": number,
          "change_percentage": number,
          "timeframe": "week" | "month" | "year"
        }
      ]

      Transactions: ${JSON.stringify(transactions)}
    `

    return this.analyze(prompt)
  }

  static async generateBudgetRecommendations(
    transactions: any[],
    currentBudgets: any[]
  ): Promise<string> {
    const prompt = `
      Analyze spending patterns and current budgets to provide recommendations. Consider:
      1. Historical spending
      2. Current budget allocations
      3. Potential savings opportunities
      4. Industry benchmarks
      
      Return recommendations in this JSON format:
      [
        {
          "category": string,
          "current_spending": number,
          "recommended_budget": number,
          "potential_savings": number,
          "reasoning": string
        }
      ]

      Data:
      Transactions: ${JSON.stringify(transactions)}
      Current Budgets: ${JSON.stringify(currentBudgets)}
    `

    return this.analyze(prompt)
  }

  static async generateInvestmentSuggestions(
    financialProfile: any
  ): Promise<string> {
    const prompt = `
      Generate investment suggestions based on the financial profile. Consider:
      1. Risk tolerance
      2. Investment goals
      3. Current portfolio
      4. Market conditions
      
      Return suggestions in this JSON format:
      [
        {
          "type": string,
          "description": string,
          "potential_return": number,
          "risk_level": "low" | "medium" | "high",
          "timeframe": string,
          "reasoning": string
        }
      ]

      Financial Profile: ${JSON.stringify(financialProfile)}
    `

    return this.analyze(prompt)
  }

  static async generateSavingsOpportunities(
    financialData: any
  ): Promise<string> {
    const prompt = `
      Identify savings opportunities based on the financial data. Focus on:
      1. Recurring expenses
      2. Discretionary spending
      3. Service optimization
      4. Lifestyle adjustments
      
      Return opportunities in this JSON format:
      [
        {
          "category": string,
          "amount": number,
          "description": string,
          "implementation_steps": string[]
        }
      ]

      Financial Data: ${JSON.stringify(financialData)}
    `

    return this.analyze(prompt)
  }

  static async generateDebtStrategies(
    debtProfile: any
  ): Promise<string> {
    const prompt = `
      Generate debt reduction strategies based on the debt profile. Consider:
      1. Interest rates
      2. Current balances
      3. Monthly payments
      4. Income and expenses
      
      Return strategies in this JSON format:
      [
        {
          "debt_id": string,
          "strategy": string,
          "potential_savings": number,
          "timeline_reduction": number,
          "steps": string[]
        }
      ]

      Debt Profile: ${JSON.stringify(debtProfile)}
    `

    return this.analyze(prompt)
  }

  static async generateGoalRecommendations(
    userProfile: any
  ): Promise<string> {
    const prompt = `
      Generate personalized financial goal recommendations. Consider:
      1. Income level
      2. Current savings
      3. Life stage
      4. Financial priorities
      
      Return recommendations in this JSON format:
      [
        {
          "type": string,
          "name": string,
          "target_amount": number,
          "timeline": string,
          "priority": "low" | "medium" | "high",
          "reasoning": string,
          "milestones": [
            {
              "name": string,
              "amount": number,
              "timeline": string
            }
          ]
        }
      ]

      User Profile: ${JSON.stringify(userProfile)}
    `

    return this.analyze(prompt)
  }
}

export { OpenAIService as OpenAI }
