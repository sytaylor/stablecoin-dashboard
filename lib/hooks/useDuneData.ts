'use client'

import { useQuery } from '@tanstack/react-query'
import type {
  MintBurnEvent,
  WhaleTransfer,
  ActiveAddressMetrics,
  TransferVolumeMetrics,
  PegStabilityMetrics,
  TopHolder,
} from '@/lib/api/dune'

// Fetch functions that call our API routes
async function fetchFromApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}

// Mint/Burn Activity
export function useMintBurnEvents(stablecoin?: string, days = 30) {
  return useQuery({
    queryKey: ['mintBurn', stablecoin, days],
    queryFn: () => fetchFromApi<MintBurnEvent[]>(
      `/api/dune/mint-burn?${stablecoin ? `stablecoin=${stablecoin}&` : ''}days=${days}`
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  })
}

// Whale Transfers
export function useWhaleTransfers(minAmount = 1000000, days = 7) {
  return useQuery({
    queryKey: ['whaleTransfers', minAmount, days],
    queryFn: () => fetchFromApi<WhaleTransfer[]>(
      `/api/dune/whale-transfers?minAmount=${minAmount}&days=${days}`
    ),
    staleTime: 2 * 60 * 1000, // 2 minutes for more real-time data
    refetchInterval: 2 * 60 * 1000,
  })
}

// Active Addresses
export function useActiveAddresses(stablecoin?: string, days = 30) {
  return useQuery({
    queryKey: ['activeAddresses', stablecoin, days],
    queryFn: () => fetchFromApi<ActiveAddressMetrics[]>(
      `/api/dune/active-addresses?${stablecoin ? `stablecoin=${stablecoin}&` : ''}days=${days}`
    ),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Transfer Volume
export function useTransferVolume(stablecoin?: string, days = 30) {
  return useQuery({
    queryKey: ['transferVolume', stablecoin, days],
    queryFn: () => fetchFromApi<TransferVolumeMetrics[]>(
      `/api/dune/transfer-volume?${stablecoin ? `stablecoin=${stablecoin}&` : ''}days=${days}`
    ),
    staleTime: 10 * 60 * 1000,
  })
}

// Peg Stability
export function usePegStability(stablecoin?: string, days = 30) {
  return useQuery({
    queryKey: ['pegStability', stablecoin, days],
    queryFn: () => fetchFromApi<PegStabilityMetrics[]>(
      `/api/dune/peg-stability?${stablecoin ? `stablecoin=${stablecoin}&` : ''}days=${days}`
    ),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

// Top Holders
export function useTopHolders(stablecoin: string, limit = 100) {
  return useQuery({
    queryKey: ['topHolders', stablecoin, limit],
    queryFn: () => fetchFromApi<TopHolder[]>(
      `/api/dune/top-holders?stablecoin=${stablecoin}&limit=${limit}`
    ),
    staleTime: 30 * 60 * 1000, // 30 minutes - holder data changes less frequently
  })
}

// Aggregate metrics for dashboard cards
export interface DuneMetricsSummary {
  totalDailyVolume: number
  dailyActiveAddresses: number
  dailyMints: number
  dailyBurns: number
  netSupplyChange: number
  largeTransfers24h: number
  avgPegDeviation: number
}

export function useDuneMetricsSummary() {
  return useQuery({
    queryKey: ['duneMetricsSummary'],
    queryFn: () => fetchFromApi<DuneMetricsSummary>('/api/dune/summary'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
