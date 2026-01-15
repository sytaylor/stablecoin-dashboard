import { useQuery } from '@tanstack/react-query'
import type { ArtemisUserMetrics } from '@/lib/api/artemis'

// Fetch DAU (Daily Active Users) for a stablecoin
export function useArtemisDAU(symbol: string, days = 30) {
  return useQuery({
    queryKey: ['artemis', 'dau', symbol, days],
    queryFn: async () => {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const response = await fetch(
        `/api/artemis/dau?symbol=${symbol}&startDate=${startDate}&endDate=${endDate}`
      )
      if (!response.ok) throw new Error('Failed to fetch DAU')
      return response.json() as Promise<Array<{ date: string; value: number }>>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!symbol,
  })
}

// Fetch Daily Transactions for a stablecoin
export function useArtemisDailyTxns(symbol: string, days = 30) {
  return useQuery({
    queryKey: ['artemis', 'daily-txns', symbol, days],
    queryFn: async () => {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const response = await fetch(
        `/api/artemis/daily-txns?symbol=${symbol}&startDate=${startDate}&endDate=${endDate}`
      )
      if (!response.ok) throw new Error('Failed to fetch daily transactions')
      return response.json() as Promise<Array<{ date: string; value: number }>>
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!symbol,
  })
}

// Fetch comprehensive user metrics for a stablecoin
export function useArtemisUserMetrics(symbol: string, days = 30) {
  return useQuery({
    queryKey: ['artemis', 'user-metrics', symbol, days],
    queryFn: async () => {
      const response = await fetch(
        `/api/artemis/user-metrics?symbol=${symbol}&days=${days}`
      )
      if (!response.ok) throw new Error('Failed to fetch user metrics')
      return response.json() as Promise<ArtemisUserMetrics>
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!symbol,
  })
}

// Fetch user metrics for multiple stablecoins (for comparison)
export function useArtemisMultiCoinMetrics(symbols: string[], days = 30) {
  return useQuery({
    queryKey: ['artemis', 'multi-coin-metrics', symbols.join(','), days],
    queryFn: async () => {
      const promises = symbols.map(async (symbol) => {
        const response = await fetch(
          `/api/artemis/user-metrics?symbol=${symbol}&days=${days}`
        )
        if (!response.ok) throw new Error(`Failed to fetch metrics for ${symbol}`)
        return response.json() as Promise<ArtemisUserMetrics>
      })
      return Promise.all(promises)
    },
    staleTime: 5 * 60 * 1000,
    enabled: symbols.length > 0,
  })
}

// Calculate user efficiency metrics
export interface UserEfficiencyMetrics {
  symbol: string
  avgTransactionsPerUser: number
  usersPerMillionSupply: number
  transactionsPerMillionSupply: number
  userGrowth30d: number // percentage
  txnGrowth30d: number // percentage
}

export function useUserEfficiencyMetrics(symbol: string): {
  data: UserEfficiencyMetrics | undefined
  isLoading: boolean
} {
  const { data: metrics, isLoading } = useArtemisUserMetrics(symbol, 30)

  if (!metrics || metrics.dau.length === 0) {
    return { data: undefined, isLoading }
  }

  // Get latest and oldest data points
  const latest = {
    dau: metrics.dau[metrics.dau.length - 1]?.value || 0,
    txns: metrics.dailyTxns[metrics.dailyTxns.length - 1]?.value || 0,
    supply: metrics.supply[metrics.supply.length - 1]?.value || 1,
  }

  const oldest = {
    dau: metrics.dau[0]?.value || latest.dau,
    txns: metrics.dailyTxns[0]?.value || latest.txns,
  }

  // Calculate metrics
  const avgTransactionsPerUser = latest.dau > 0 ? latest.txns / latest.dau : 0
  const usersPerMillionSupply = (latest.dau / latest.supply) * 1000000
  const transactionsPerMillionSupply = (latest.txns / latest.supply) * 1000000

  const userGrowth30d = oldest.dau > 0 ? ((latest.dau - oldest.dau) / oldest.dau) * 100 : 0
  const txnGrowth30d = oldest.txns > 0 ? ((latest.txns - oldest.txns) / oldest.txns) * 100 : 0

  return {
    data: {
      symbol,
      avgTransactionsPerUser,
      usersPerMillionSupply,
      transactionsPerMillionSupply,
      userGrowth30d,
      txnGrowth30d,
    },
    isLoading,
  }
}
