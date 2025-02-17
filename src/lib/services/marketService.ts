import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface MarketData {
  id: string
  symbol: string
  name: string
  type: 'stock' | 'crypto' | 'forex' | 'commodity'
  price: number
  change_24h: number
  change_percentage_24h: number
  volume_24h: number
  market_cap: number
  additional_data?: Record<string, any>
  last_updated_at: string
  created_at: string
}

let marketSubscription: ReturnType<typeof supabase.channel> | null = null
const marketHandlers = new Set<(data: MarketData) => void>()

export class MarketService {
  private static instance: MarketService | null = null
  private static cache: Map<string, { data: MarketData; timestamp: number }> = new Map()
  private static CACHE_TTL = 60 * 1000 // 1 minute

  public static isValidMarketData(data: unknown): data is MarketData {
    if (!data || typeof data !== 'object') {
      return false
    }

    const record = data as Record<string, unknown>

    // Check all required fields exist
    const requiredFields: (keyof MarketData)[] = [
      'id', 'symbol', 'name', 'type', 'price',
      'change_24h', 'change_percentage_24h', 'volume_24h',
      'market_cap', 'last_updated_at', 'created_at'
    ]

    // First check if all fields exist
    if (!requiredFields.every(field => field in record)) {
      return false
    }

    // Then check field types
    const { type, price, change_24h, change_percentage_24h, volume_24h, market_cap,
            id, symbol, name, last_updated_at, created_at } = record

    // Check type field
    if (typeof type !== 'string' || !['stock', 'crypto', 'forex', 'commodity'].includes(type)) {
      return false
    }

    // Check numeric fields
    if ([price, change_24h, change_percentage_24h, volume_24h, market_cap].some(
      field => typeof field !== 'number'
    )) {
      return false
    }

    // Check string fields
    if ([id, symbol, name, last_updated_at, created_at].some(
      field => typeof field !== 'string'
    )) {
      return false
    }

    return true
  }

  // Get current market data for a symbol
  static async getMarketData(symbol: string): Promise<MarketData | null> {
    const cached = this.cache.get(symbol)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', symbol)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    // Early return if no data
    if (!data) {
      return null
    }

    // Type guard to ensure data matches MarketData interface
    if (!this.isValidMarketData(data)) {
      return null
    }

    // At this point we know data is valid MarketData
    const marketData: MarketData = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      type: data.type,
      price: data.price,
      change_24h: data.change_24h,
      change_percentage_24h: data.change_percentage_24h,
      volume_24h: data.volume_24h,
      market_cap: data.market_cap,
      additional_data: data.additional_data,
      last_updated_at: data.last_updated_at,
      created_at: data.created_at
    }

    this.cache.set(symbol, { data: marketData, timestamp: Date.now() })
    return marketData
  }

  // Get market data for multiple symbols
  static async getMarketDataBatch(symbols: string[]): Promise<MarketData[]> {
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .in('symbol', symbols)

    if (error) {
      throw error
    }

    if (!data) {
      return []
    }

    return data.filter(this.isValidMarketData)
  }

  // Subscribe to market updates for multiple symbols
  static subscribeToMarketUpdates(symbols: string[], handler: (data: MarketData) => void): () => void {
    if (!marketSubscription) {
      marketSubscription = supabase
        .channel('market_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'market_data',
            filter: `symbol=in.(${symbols.join(',')})`
          },
          (payload) => {
            const data = convertRealtimeUpdateToMarketData(payload)
            if (data) {
              marketHandlers.forEach(h => h(data))
            }
          }
        )
        .subscribe()
    }

    marketHandlers.add(handler)
    return () => {
      marketHandlers.delete(handler)
      if (marketHandlers.size === 0 && marketSubscription) {
        marketSubscription.unsubscribe()
        marketSubscription = null
      }
    }
  }

  // Get historical data for a symbol
  static async getHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<MarketData[]> {
    const { data, error } = await supabase
      .from('market_data_history')
      .select('*')
      .eq('symbol', symbol)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching historical data:', error)
      return []
    }

    return data.filter(this.isValidMarketData)
  }

  // Get market data by type
  static async getMarketDataByType(type: MarketData['type']): Promise<MarketData[]> {
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .eq('type', type)
      .order('market_cap', { ascending: false })

    if (error) {
      console.error('Error fetching market data by type:', error)
      return []
    }

    return data.filter(this.isValidMarketData)
  }

  // Get top performing assets
  static async getTopPerformers(
    type: MarketData['type'],
    limit: number = 10
  ): Promise<MarketData[]> {
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .eq('type', type)
      .order('change_percentage_24h', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching top performers:', error)
      return []
    }

    return data.filter(this.isValidMarketData)
  }

  // Get market statistics
  static async getMarketStats(type: MarketData['type']): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .eq('type', type)

    if (error) {
      console.error('Error fetching market stats:', error)
      return {}
    }

    const validData = data.filter(this.isValidMarketData)
    const totalMarketCap = validData.reduce((sum, item) => sum + (item.market_cap || 0), 0)
    const totalVolume = validData.reduce((sum, item) => sum + (item.volume_24h || 0), 0)
    const averageChange = validData.reduce((sum, item) => sum + (item.change_percentage_24h || 0), 0) / validData.length

    return {
      total_market_cap: totalMarketCap,
      total_volume_24h: totalVolume,
      average_change_24h: averageChange,
      asset_count: validData.length,
      gainers: validData.filter((item) => item.change_percentage_24h > 0).length,
      losers: validData.filter((item) => item.change_percentage_24h < 0).length,
    }
  }

  // Unsubscribe from market updates
  static unsubscribeFromMarketUpdates(
    handler: (data: MarketData) => void
  ): void {
    marketHandlers.delete(handler)
    
    if (marketHandlers.size === 0 && marketSubscription) {
      marketSubscription.unsubscribe()
      marketSubscription = null
    }
  }

  // Clear market data cache
  static clearCache(): void {
    this.cache.clear()
  }

  // Clear specific symbol from cache
  static clearSymbolCache(symbol: string): void {
    this.cache.delete(symbol)
  }

  // Get cached symbols
  static getCachedSymbols(): string[] {
    return Array.from(this.cache.keys())
  }

  // Check if symbol is cached
  static isSymbolCached(symbol: string): boolean {
    const cached = this.cache.get(symbol)
    return cached !== undefined && Date.now() - cached.timestamp < this.CACHE_TTL
  }

  // Get market summary
  static async getMarketSummary(): Promise<Record<string, any>> {
    const types: MarketData['type'][] = ['stock', 'crypto', 'forex', 'commodity']
    const summaries = await Promise.all(
      types.map(async (type) => ({
        type,
        stats: await this.getMarketStats(type),
      }))
    )

    return summaries.reduce(
      (acc, { type, stats }) => ({
        ...acc,
        [type]: stats,
      }),
      {}
    )
  }

  // Get price alerts for user's watchlist
  static async getPriceAlerts(
    userId: string,
    symbols: string[]
  ): Promise<Record<string, any>[]> {
    const marketData = await this.getMarketDataBatch(symbols)
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'price')
      .in('conditions->symbol', symbols)

    if (error) {
      console.error('Error fetching price alerts:', error)
      return []
    }

    return alerts.map((alert) => ({
      alert,
      market_data: marketData.find(
        (data) => data.symbol === alert.conditions[0].value
      ),
    }))
  }
}

function convertRealtimeUpdateToMarketData(update: RealtimePostgresChangesPayload<Record<string, unknown>>): MarketData | null {
  if (!update.new || !MarketService.isValidMarketData(update.new)) {
    return null
  }
  
  // At this point we know it's a valid MarketData
  const data = update.new
  return {
    id: data.id as string,
    symbol: data.symbol as string,
    name: data.name as string,
    type: data.type as MarketData['type'],
    price: data.price as number,
    change_24h: data.change_24h as number,
    change_percentage_24h: data.change_percentage_24h as number,
    volume_24h: data.volume_24h as number,
    market_cap: data.market_cap as number,
    additional_data: data.additional_data as Record<string, any> | undefined,
    last_updated_at: data.last_updated_at as string,
    created_at: data.created_at as string
  }
}
