// Stablecoin Types
export interface Stablecoin {
  id: number
  name: string
  symbol: string
  gecko_id: string | null
  pegType: string
  pegMechanism: string
  circulating: ChainCirculating
  price: number | null
  priceSource: string | null
  chains: string[]
}

export interface ChainCirculating {
  [chain: string]: {
    current: number
    circulatingPrevDay?: number
    circulatingPrevWeek?: number
    circulatingPrevMonth?: number
  }
}

export interface StablecoinWithMetrics extends Stablecoin {
  totalCirculating: number
  change24h: number
  change7d: number
  change30d: number
  dominance: number
}

export interface StablecoinHistorical {
  date: number
  totalCirculating: {
    peggedUSD: number
  }
  totalCirculatingUSD: {
    peggedUSD: number
  }
}

// Chain Types
export interface ChainStablecoinData {
  gecko_id: string | null
  totalCirculatingUSD: {
    peggedUSD: number
    peggedEUR?: number
    peggedVAR?: number
    [key: string]: number | undefined
  }
  tokenSymbol: string | null
  name: string
}

export interface ChainWithMetrics {
  name: string
  totalStablecoinUSD: number
  stablecoinCount: number
  change24h: number
  change7d: number
  topStablecoins: { name: string; symbol: string; amount: number }[]
}

export interface ChainHistorical {
  date: number
  totalCirculatingUSD: {
    peggedUSD: number
    peggedEUR?: number
    peggedVAR?: number
  }
}

// Bridge Types
export interface Bridge {
  id: number
  name: string
  displayName: string
  icon: string | null
  volumePrevDay: number
  volumePrev2Day: number
  lastHourlyVolume: number
  currentDayVolume: number
  lastDailyVolume: number
  dayBeforeLastVolume: number
  weeklyVolume: number
  monthlyVolume: number
  chains: string[]
  destinationChain: string | null
}

export interface BridgeWithMetrics extends Bridge {
  change24h: number
  change7d: number
}

export interface BridgeVolume {
  date: number
  depositUSD: number
  withdrawUSD: number
  depositTxs: number
  withdrawTxs: number
}

export interface BridgeTransaction {
  tx_hash: string
  ts: string
  tx_block: number
  tx_from: string
  tx_to: string
  token: string
  amount: string
  is_deposit: boolean
  chain: string
  usd_value: string | null
}

export interface LargeTransaction {
  date: string
  txHash: string
  from: string
  to: string
  token: string
  symbol: string
  amount: number
  usdValue: number
  chain: string
  bridge: string
}

// Flow Types for Sankey Diagram
export interface FlowNode {
  id: string
  name: string
  color: string
  value?: number
}

export interface FlowLink {
  source: string
  target: string
  value: number
  color?: string
}

export interface FlowData {
  nodes: FlowNode[]
  links: FlowLink[]
}

// Network Graph Types
export interface NetworkNode {
  id: string
  name: string
  value: number
  color: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface NetworkLink {
  source: string | NetworkNode
  target: string | NetworkNode
  value: number
}

export interface NetworkData {
  nodes: NetworkNode[]
  links: NetworkLink[]
}

// Dashboard State Types
export interface TimeRange {
  label: string
  value: '24h' | '7d' | '30d' | '90d' | '1y' | 'all'
  days: number
}

export interface DashboardFilters {
  timeRange: TimeRange
  selectedChains: string[]
  selectedStablecoins: string[]
  minMarketCap: number
}

// API Response Types
export interface StablecoinsResponse {
  peggedAssets: Stablecoin[]
}

export interface BridgesResponse {
  bridges: Bridge[]
}

export interface ChainBridgeVolumeResponse {
  [date: string]: BridgeVolume
}

// Metric Card Types
export interface MetricCardData {
  title: string
  value: number
  change?: number
  changeLabel?: string
  format: 'currency' | 'number' | 'percentage'
  prefix?: string
  suffix?: string
}

// Chart Types
export interface ChartDataPoint {
  date: number | string
  value: number
  [key: string]: number | string
}

export interface StackedChartData {
  date: number | string
  [key: string]: number | string
}

// Color mapping types
export type ChainColorMap = {
  [chain: string]: string
}

export type StablecoinColorMap = {
  [symbol: string]: string
}
