import { create } from 'zustand'
import type { TimeRange } from '@/lib/types'

export const TIME_RANGES: TimeRange[] = [
  { label: '24H', value: '24h', days: 1 },
  { label: '7D', value: '7d', days: 7 },
  { label: '30D', value: '30d', days: 30 },
  { label: '90D', value: '90d', days: 90 },
  { label: '1Y', value: '1y', days: 365 },
  { label: 'All', value: 'all', days: 9999 },
]

interface DashboardState {
  // Time range
  timeRange: TimeRange
  setTimeRange: (range: TimeRange) => void

  // Selected chains for filtering
  selectedChains: string[]
  setSelectedChains: (chains: string[]) => void
  toggleChain: (chain: string) => void

  // Selected stablecoins for filtering
  selectedStablecoins: string[]
  setSelectedStablecoins: (stablecoins: string[]) => void
  toggleStablecoin: (stablecoin: string) => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Comparison mode
  comparisonChains: string[]
  setComparisonChains: (chains: string[]) => void
  addComparisonChain: (chain: string) => void
  removeComparisonChain: (chain: string) => void

  // Last updated timestamp
  lastUpdated: number | null
  setLastUpdated: (timestamp: number) => void

  // Reset filters
  resetFilters: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Time range - default to 30 days
  timeRange: TIME_RANGES[2],
  setTimeRange: (range) => set({ timeRange: range }),

  // Selected chains
  selectedChains: [],
  setSelectedChains: (chains) => set({ selectedChains: chains }),
  toggleChain: (chain) =>
    set((state) => ({
      selectedChains: state.selectedChains.includes(chain)
        ? state.selectedChains.filter((c) => c !== chain)
        : [...state.selectedChains, chain],
    })),

  // Selected stablecoins
  selectedStablecoins: [],
  setSelectedStablecoins: (stablecoins) => set({ selectedStablecoins: stablecoins }),
  toggleStablecoin: (stablecoin) =>
    set((state) => ({
      selectedStablecoins: state.selectedStablecoins.includes(stablecoin)
        ? state.selectedStablecoins.filter((s) => s !== stablecoin)
        : [...state.selectedStablecoins, stablecoin],
    })),

  // UI state
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Comparison mode - max 4 chains
  comparisonChains: [],
  setComparisonChains: (chains) => set({ comparisonChains: chains.slice(0, 4) }),
  addComparisonChain: (chain) =>
    set((state) => ({
      comparisonChains:
        state.comparisonChains.length < 4 && !state.comparisonChains.includes(chain)
          ? [...state.comparisonChains, chain]
          : state.comparisonChains,
    })),
  removeComparisonChain: (chain) =>
    set((state) => ({
      comparisonChains: state.comparisonChains.filter((c) => c !== chain),
    })),

  // Last updated
  lastUpdated: null,
  setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),

  // Reset
  resetFilters: () =>
    set({
      selectedChains: [],
      selectedStablecoins: [],
      timeRange: TIME_RANGES[2],
      comparisonChains: [],
    }),
}))
