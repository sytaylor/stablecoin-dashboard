const DUNE_API_BASE = 'https://api.dune.com/api/v1'

interface DuneQueryResult {
  execution_id: string
  state: 'QUERY_STATE_PENDING' | 'QUERY_STATE_EXECUTING' | 'QUERY_STATE_COMPLETED' | 'QUERY_STATE_FAILED'
  result?: {
    rows: Record<string, unknown>[]
    metadata: {
      column_names: string[]
      column_types: string[]
      row_count: number
    }
  }
}

interface DuneExecuteResponse {
  execution_id: string
  state: string
}

// Cache for query results (5 minute TTL)
const queryCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

function getCached<T>(key: string): T | null {
  const cached = queryCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  return null
}

function setCache(key: string, data: unknown) {
  queryCache.set(key, { data, timestamp: Date.now() })
}

async function duneRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = process.env.DUNE_API_KEY
  if (!apiKey) {
    throw new Error('DUNE_API_KEY not configured')
  }

  const response = await fetch(`${DUNE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'X-Dune-API-Key': apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Dune API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Execute a saved query by ID
async function executeQuery(queryId: number, params?: Record<string, unknown>): Promise<string> {
  const body = params ? { query_parameters: params } : undefined
  const result = await duneRequest<DuneExecuteResponse>(
    `/query/${queryId}/execute`,
    { method: 'POST', body: body ? JSON.stringify(body) : undefined }
  )
  return result.execution_id
}

// Get execution results (with polling)
async function getExecutionResults(executionId: string, maxWaitMs = 30000): Promise<DuneQueryResult> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const result = await duneRequest<DuneQueryResult>(`/execution/${executionId}/results`)

    if (result.state === 'QUERY_STATE_COMPLETED') {
      return result
    }

    if (result.state === 'QUERY_STATE_FAILED') {
      throw new Error('Query execution failed')
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  throw new Error('Query execution timeout')
}

// Execute query and wait for results
async function runQuery<T>(queryId: number, params?: Record<string, unknown>): Promise<T[]> {
  const cacheKey = `query-${queryId}-${JSON.stringify(params || {})}`
  const cached = getCached<T[]>(cacheKey)
  if (cached) return cached

  const executionId = await executeQuery(queryId, params)
  const result = await getExecutionResults(executionId)

  const rows = (result.result?.rows || []) as T[]
  setCache(cacheKey, rows)
  return rows
}

// ============================================
// STABLECOIN-SPECIFIC QUERIES
// ============================================

// Pre-built query IDs (you can create these on Dune and reference them)
const QUERY_IDS = {
  STABLECOIN_MINTS: 3500000,      // Placeholder - create query on Dune
  STABLECOIN_BURNS: 3500001,
  WHALE_TRANSFERS: 3500002,
  ACTIVE_ADDRESSES: 3500003,
  TRANSFER_VOLUME: 3500004,
  PEG_DEVIATIONS: 3500005,
  TOP_HOLDERS: 3500006,
  BLACKLISTED_ADDRESSES: 3500007,
}

// Types for enterprise-friendly data
export interface MintBurnEvent {
  timestamp: string
  stablecoin: string
  type: 'mint' | 'burn'
  amount: number
  amountUsd: number
  chain: string
  txHash: string
  issuer?: string
}

export interface WhaleTransfer {
  timestamp: string
  stablecoin: string
  fromAddress: string
  toAddress: string
  fromLabel?: string
  toLabel?: string
  amount: number
  amountUsd: number
  chain: string
  txHash: string
}

export interface ActiveAddressMetrics {
  date: string
  stablecoin: string
  dailyActive: number
  weeklyActive: number
  monthlyActive: number
  newAddresses: number
  chain: string
}

export interface TransferVolumeMetrics {
  date: string
  stablecoin: string
  volume: number
  txCount: number
  avgTxSize: number
  medianTxSize: number
  chain: string
}

export interface PegStabilityMetrics {
  timestamp: string
  stablecoin: string
  price: number
  deviation: number  // % from $1.00
  source: string
}

export interface TopHolder {
  address: string
  label?: string
  balance: number
  balanceUsd: number
  percentOfSupply: number
  stablecoin: string
  chain: string
  lastActivity: string
}

// Fetch mint/burn events (supply changes)
export async function fetchMintBurnEvents(
  stablecoin?: string,
  days = 30
): Promise<MintBurnEvent[]> {
  // For now, return mock data until Dune queries are set up
  // This will be replaced with actual Dune query
  return getMockMintBurnData(stablecoin, days)
}

// Fetch whale transfers (>$1M)
export async function fetchWhaleTransfers(
  minAmount = 1000000,
  days = 7
): Promise<WhaleTransfer[]> {
  return getMockWhaleData(minAmount, days)
}

// Fetch active address metrics
export async function fetchActiveAddresses(
  stablecoin?: string,
  days = 30
): Promise<ActiveAddressMetrics[]> {
  return getMockActiveAddressData(stablecoin, days)
}

// Fetch transfer volume
export async function fetchTransferVolume(
  stablecoin?: string,
  days = 30
): Promise<TransferVolumeMetrics[]> {
  return getMockTransferVolumeData(stablecoin, days)
}

// Fetch peg stability data
export async function fetchPegStability(
  stablecoin?: string,
  days = 30
): Promise<PegStabilityMetrics[]> {
  return getMockPegStabilityData(stablecoin, days)
}

// Fetch top holders
export async function fetchTopHolders(
  stablecoin: string,
  limit = 100
): Promise<TopHolder[]> {
  return getMockTopHoldersData(stablecoin, limit)
}

// ============================================
// MOCK DATA (Replace with real Dune queries)
// ============================================

function getMockMintBurnData(stablecoin?: string, days = 30): MintBurnEvent[] {
  const events: MintBurnEvent[] = []
  const stables = stablecoin ? [stablecoin] : ['USDT', 'USDC', 'DAI', 'USDS']

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    stables.forEach(stable => {
      // Random mint/burn events
      if (Math.random() > 0.3) {
        const isMint = Math.random() > 0.4
        const amount = Math.floor(Math.random() * 500000000) + 10000000
        events.push({
          timestamp: date.toISOString(),
          stablecoin: stable,
          type: isMint ? 'mint' : 'burn',
          amount,
          amountUsd: amount,
          chain: ['Ethereum', 'Tron', 'BSC', 'Solana'][Math.floor(Math.random() * 4)],
          txHash: `0x${Math.random().toString(16).slice(2)}`,
          issuer: stable === 'USDT' ? 'Tether Treasury' : stable === 'USDC' ? 'Circle' : undefined,
        })
      }
    })
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function getMockWhaleData(minAmount: number, days: number): WhaleTransfer[] {
  const transfers: WhaleTransfer[] = []
  const labels = ['Binance', 'Coinbase', 'Jump Trading', 'Wintermute', 'Cumberland', 'Unknown Wallet', 'DeFi Protocol']

  for (let i = 0; i < 50; i++) {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * days))
    const amount = Math.floor(Math.random() * 50000000) + minAmount

    transfers.push({
      timestamp: date.toISOString(),
      stablecoin: ['USDT', 'USDC', 'DAI'][Math.floor(Math.random() * 3)],
      fromAddress: `0x${Math.random().toString(16).slice(2, 10)}...`,
      toAddress: `0x${Math.random().toString(16).slice(2, 10)}...`,
      fromLabel: labels[Math.floor(Math.random() * labels.length)],
      toLabel: labels[Math.floor(Math.random() * labels.length)],
      amount,
      amountUsd: amount,
      chain: ['Ethereum', 'Tron', 'Arbitrum'][Math.floor(Math.random() * 3)],
      txHash: `0x${Math.random().toString(16).slice(2)}`,
    })
  }

  return transfers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function getMockActiveAddressData(stablecoin?: string, days = 30): ActiveAddressMetrics[] {
  const data: ActiveAddressMetrics[] = []
  const stables = stablecoin ? [stablecoin] : ['USDT', 'USDC', 'DAI']

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    stables.forEach(stable => {
      const baseDaily = stable === 'USDT' ? 800000 : stable === 'USDC' ? 400000 : 50000
      data.push({
        date: date.toISOString().split('T')[0],
        stablecoin: stable,
        dailyActive: Math.floor(baseDaily * (0.9 + Math.random() * 0.2)),
        weeklyActive: Math.floor(baseDaily * 3 * (0.9 + Math.random() * 0.2)),
        monthlyActive: Math.floor(baseDaily * 8 * (0.9 + Math.random() * 0.2)),
        newAddresses: Math.floor(baseDaily * 0.05 * (0.8 + Math.random() * 0.4)),
        chain: 'all',
      })
    })
  }

  return data
}

function getMockTransferVolumeData(stablecoin?: string, days = 30): TransferVolumeMetrics[] {
  const data: TransferVolumeMetrics[] = []
  const stables = stablecoin ? [stablecoin] : ['USDT', 'USDC', 'DAI']

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    stables.forEach(stable => {
      const baseVolume = stable === 'USDT' ? 50000000000 : stable === 'USDC' ? 30000000000 : 2000000000
      const volume = Math.floor(baseVolume * (0.7 + Math.random() * 0.6))
      const txCount = Math.floor(volume / 50000)

      data.push({
        date: date.toISOString().split('T')[0],
        stablecoin: stable,
        volume,
        txCount,
        avgTxSize: Math.floor(volume / txCount),
        medianTxSize: Math.floor(volume / txCount * 0.3),
        chain: 'all',
      })
    })
  }

  return data
}

function getMockPegStabilityData(stablecoin?: string, days = 30): PegStabilityMetrics[] {
  const data: PegStabilityMetrics[] = []
  const stables = stablecoin ? [stablecoin] : ['USDT', 'USDC', 'DAI', 'USDS']

  for (let i = 0; i < days * 24; i += 4) { // Every 4 hours
    const date = new Date()
    date.setHours(date.getHours() - i)

    stables.forEach(stable => {
      const baseDeviation = stable === 'DAI' ? 0.002 : 0.0005
      const price = 1 + (Math.random() - 0.5) * baseDeviation * 2

      data.push({
        timestamp: date.toISOString(),
        stablecoin: stable,
        price,
        deviation: (price - 1) * 100,
        source: 'CoinGecko',
      })
    })
  }

  return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function getMockTopHoldersData(stablecoin: string, limit: number): TopHolder[] {
  const holders: TopHolder[] = []
  const labels = ['Binance', 'Coinbase Custody', 'Jump Trading', 'Wintermute', 'Cumberland DRW',
                  'Tether Treasury', 'Circle Reserve', 'MakerDAO', 'Aave', 'Compound',
                  'Unknown Whale', 'OKX', 'Kraken', 'BitFinex']

  let remainingSupply = 100

  for (let i = 0; i < Math.min(limit, 50); i++) {
    const percent = i < 5 ? Math.random() * 5 + 2 : Math.random() * 2
    const actualPercent = Math.min(percent, remainingSupply)
    remainingSupply -= actualPercent

    const totalSupply = stablecoin === 'USDT' ? 140000000000 : stablecoin === 'USDC' ? 50000000000 : 5000000000
    const balance = Math.floor(totalSupply * actualPercent / 100)

    holders.push({
      address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      label: i < 14 ? labels[i] : undefined,
      balance,
      balanceUsd: balance,
      percentOfSupply: actualPercent,
      stablecoin,
      chain: 'Ethereum',
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return holders.sort((a, b) => b.balance - a.balance)
}

export { runQuery, QUERY_IDS }
