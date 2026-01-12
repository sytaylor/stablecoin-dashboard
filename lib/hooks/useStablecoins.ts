'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAllStablecoins, fetchStablecoinHistory, fetchChainData, fetchHistoricalCharts, fetchTotalMetrics } from '@/lib/api/stablecoins'

const STALE_TIME = 30 * 1000 // 30 seconds
const REFETCH_INTERVAL = 60 * 1000 // 1 minute

export function useStablecoins() {
  return useQuery({
    queryKey: ['stablecoins'],
    queryFn: fetchAllStablecoins,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useStablecoinHistory(id: number) {
  return useQuery({
    queryKey: ['stablecoin', id, 'history'],
    queryFn: () => fetchStablecoinHistory(id),
    staleTime: STALE_TIME * 2,
    enabled: id > 0,
  })
}

export function useChains() {
  return useQuery({
    queryKey: ['chains'],
    queryFn: fetchChainData,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useHistoricalCharts(chain?: string) {
  return useQuery({
    queryKey: ['historical-charts', chain || 'all'],
    queryFn: () => fetchHistoricalCharts(chain),
    staleTime: STALE_TIME * 2,
  })
}

export function useTotalMetrics() {
  return useQuery({
    queryKey: ['total-metrics'],
    queryFn: fetchTotalMetrics,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  })
}

// Hook to get top N stablecoins
export function useTopStablecoins(limit = 10) {
  const { data, ...rest } = useStablecoins()

  return {
    data: data?.slice(0, limit),
    ...rest,
  }
}

// Hook to get stablecoins filtered by chain
export function useStablecoinsByChain(chain: string) {
  const { data, ...rest } = useStablecoins()

  const filtered = data?.filter((coin) => coin.chains.includes(chain))

  return {
    data: filtered,
    ...rest,
  }
}
