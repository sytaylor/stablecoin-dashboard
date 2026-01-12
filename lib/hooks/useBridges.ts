'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchAllBridges,
  fetchBridgeDetails,
  fetchBridgeVolumeHistory,
  fetchLargeTransactions,
  fetchBridgeFlowData,
  fetchNetworkGraphData,
  fetchBridgeMetrics,
} from '@/lib/api/bridges'

const STALE_TIME = 30 * 1000 // 30 seconds
const REFETCH_INTERVAL = 60 * 1000 // 1 minute

export function useBridges() {
  return useQuery({
    queryKey: ['bridges'],
    queryFn: fetchAllBridges,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useBridgeDetails(id: number) {
  return useQuery({
    queryKey: ['bridge', id],
    queryFn: () => fetchBridgeDetails(id),
    staleTime: STALE_TIME * 2,
    enabled: id > 0,
  })
}

export function useBridgeVolumeHistory(chain: string) {
  return useQuery({
    queryKey: ['bridge-volume', chain],
    queryFn: () => fetchBridgeVolumeHistory(chain),
    staleTime: STALE_TIME * 2,
    enabled: !!chain,
  })
}

export function useLargeTransactions(chain: string) {
  return useQuery({
    queryKey: ['large-transactions', chain],
    queryFn: () => fetchLargeTransactions(chain),
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL * 2,
    enabled: !!chain,
  })
}

export function useBridgeFlowData() {
  return useQuery({
    queryKey: ['bridge-flow-data'],
    queryFn: fetchBridgeFlowData,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useNetworkGraphData() {
  return useQuery({
    queryKey: ['network-graph-data'],
    queryFn: fetchNetworkGraphData,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useBridgeMetrics() {
  return useQuery({
    queryKey: ['bridge-metrics'],
    queryFn: fetchBridgeMetrics,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  })
}

// Hook to get top bridges by volume
export function useTopBridges(limit = 10) {
  const { data, ...rest } = useBridges()

  return {
    data: data?.slice(0, limit),
    ...rest,
  }
}

// Hook to get bridges supporting a specific chain
export function useBridgesByChain(chain: string) {
  const { data, ...rest } = useBridges()

  const filtered = data?.filter((bridge) => bridge.chains.includes(chain))

  return {
    data: filtered,
    ...rest,
  }
}
