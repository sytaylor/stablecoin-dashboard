// Artemis API client for labeled wallet and transaction data
// Docs: https://app.artemisanalytics.com/docs/snowflake-share/stablecoins
// Free tier: 100,000 API calls/month

const ARTEMIS_API_BASE = 'https://api.artemisanalytics.com'

// ============================================
// API CLIENT
// ============================================

interface ArtemisRequestOptions {
  endpoint: string
  params?: Record<string, string | number | boolean>
}

async function artemisRequest<T>(options: ArtemisRequestOptions): Promise<T> {
  const apiKey = process.env.ARTEMIS_API_KEY

  if (!apiKey) {
    throw new Error('ARTEMIS_API_KEY not configured')
  }

  const url = new URL(`${ARTEMIS_API_BASE}${options.endpoint}`)
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Artemis API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// ============================================
// ARTEMIS DATA TYPES
// ============================================

export interface ArtemisStablecoinMetrics {
  date: string
  chain: string
  symbol: string
  // Three types of volume
  transferVolume: number           // Raw unfiltered
  artemisTransferVolume: number    // Filtered (no CEX internal, no MEV)
  p2pTransferVolume: number        // EOA to EOA only
  // Transaction counts
  dailyTxns: number
  artemisDailyTxns: number
  p2pDailyTxns: number
  // Other metrics
  supply: number
  dau: number
}

export interface ArtemisAddressMetrics {
  date: string
  address: string
  chain: string
  symbol: string
  isWallet: boolean
  transferVolume: number
  artemisTransferVolume: number
  p2pTransferVolume: number
  txnCount: number
  supply: number
}

export interface ArtemisVolumeBreakdown {
  date: string
  // Volume by category
  rawVolume: number
  adjustedVolume: number      // Artemis-filtered
  p2pVolume: number
  // Derived categories (calculated)
  cexVolume: number           // rawVolume - adjustedVolume (roughly)
  defiVolume: number          // adjustedVolume - p2pVolume (roughly)
  paymentsVolume: number      // p2pVolume + estimated B2B
}

// ============================================
// API ENDPOINTS
// ============================================

// Fetch daily stablecoin metrics
export async function fetchArtemisStablecoinMetrics(
  symbol?: string,
  chain?: string,
  days = 30
): Promise<ArtemisStablecoinMetrics[]> {
  const apiKey = process.env.ARTEMIS_API_KEY

  // If no API key, return mock data
  if (!apiKey) {
    return getMockArtemisMetrics(symbol, chain, days)
  }

  try {
    // Artemis uses dash-separated identifiers like "usdc-eth"
    const assetId = symbol && chain ? `${symbol.toLowerCase()}-${chain.toLowerCase()}` : undefined

    const data = await artemisRequest<{ data: ArtemisStablecoinMetrics[] }>({
      endpoint: '/data/stablecoin/metrics',
      params: {
        ...(assetId && { asset: assetId }),
        days,
      },
    })

    return data.data
  } catch (error) {
    console.error('Artemis API error, falling back to mock:', error)
    return getMockArtemisMetrics(symbol, chain, days)
  }
}

// Fetch aggregated volume breakdown
export async function fetchArtemisVolumeBreakdown(days = 1): Promise<ArtemisVolumeBreakdown> {
  const apiKey = process.env.ARTEMIS_API_KEY

  if (!apiKey) {
    return getMockVolumeBreakdown()
  }

  try {
    const metrics = await fetchArtemisStablecoinMetrics(undefined, undefined, days)

    // Aggregate across all stablecoins and chains
    const totals = metrics.reduce(
      (acc, m) => ({
        rawVolume: acc.rawVolume + m.transferVolume,
        adjustedVolume: acc.adjustedVolume + m.artemisTransferVolume,
        p2pVolume: acc.p2pVolume + m.p2pTransferVolume,
      }),
      { rawVolume: 0, adjustedVolume: 0, p2pVolume: 0 }
    )

    return {
      date: new Date().toISOString().split('T')[0],
      rawVolume: totals.rawVolume,
      adjustedVolume: totals.adjustedVolume,
      p2pVolume: totals.p2pVolume,
      // Derived estimates
      cexVolume: totals.rawVolume - totals.adjustedVolume,
      defiVolume: totals.adjustedVolume - totals.p2pVolume,
      // Payments = P2P + estimated B2B (roughly 80% of adjusted non-P2P)
      paymentsVolume: totals.p2pVolume + (totals.adjustedVolume - totals.p2pVolume) * 0.8,
    }
  } catch (error) {
    console.error('Artemis API error:', error)
    return getMockVolumeBreakdown()
  }
}

// ============================================
// KNOWN ADDRESS CATEGORIES (for local filtering)
// ============================================

export const EXCLUDED_CATEGORIES = [
  'cex',           // Centralized exchanges
  'dex',           // DEX routers and pools
  'bridge',        // Bridge contracts
  'lending',       // Lending protocols
  'mev',           // MEV bots
  'mixer',         // Mixing services
] as const

// Major CEX hot wallet addresses (Ethereum mainnet)
export const CEX_ADDRESSES: Record<string, string[]> = {
  binance: [
    '0x28C6c06298d514Db089934071355E5743bf21d60',
    '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',
    '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d',
    '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F',
    '0xF977814e90dA44bFA03b6295A0616a897441aceC',
  ],
  coinbase: [
    '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3',
    '0x503828976D22510aad0201ac7EC88293211D23Da',
    '0xddfAbCdc4D8FfC6d5beaf154f18B778f892A0740',
    '0x3cD751E6b0078Be393132286c442345e5DC49699',
    '0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43',
  ],
  kraken: [
    '0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2',
    '0x0A869d79a7052C7f1b55a8EbAbbEa3420F0D1E13',
    '0xE853c56864A2ebe4576a807D26Fdc4A0adA51919',
  ],
  okx: [
    '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b',
    '0x236F9F97e0E62388479bf9E5BA4889e46B0273C3',
  ],
  bybit: [
    '0xf89d7b9c864f589bbF53a82105107622B35EaA40',
  ],
}

// Major DEX router addresses
export const DEX_ADDRESSES: Record<string, string[]> = {
  uniswap: [
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  ],
  sushiswap: [
    '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
  ],
  curve: [
    '0x99a58482BD75cbab83b27EC03CA68fF489b5788f',
  ],
  '1inch': [
    '0x1111111254fb6c44bAC0beD2854e76F90643097d',
    '0x1111111254EEB25477B68fb85Ed929f73A960582',
  ],
}

// Bridge contract addresses
export const BRIDGE_ADDRESSES: Record<string, string[]> = {
  stargate: ['0x8731d54E9D02c286767d56ac03e8037C07e01e98'],
  hop: ['0xb8901acB165ed027E32754E0FFe830802919727f'],
  across: ['0x4D9079Bb4165aeb4084c526a32695dCfd2F77381'],
}

// Get all addresses to exclude
export function getExcludedAddresses(): Set<string> {
  const addresses = new Set<string>()
  Object.values(CEX_ADDRESSES).forEach(addrs =>
    addrs.forEach(addr => addresses.add(addr.toLowerCase()))
  )
  Object.values(DEX_ADDRESSES).forEach(addrs =>
    addrs.forEach(addr => addresses.add(addr.toLowerCase()))
  )
  Object.values(BRIDGE_ADDRESSES).forEach(addrs =>
    addrs.forEach(addr => addresses.add(addr.toLowerCase()))
  )
  return addresses
}

// ============================================
// VOLUME CALCULATION (with or without Artemis)
// ============================================

export interface AdjustedVolumeMetrics {
  rawVolume: number
  adjustedVolume: number
  paymentsVolume: number
  p2pVolume: number
  breakdown: {
    category: string
    volume: number
    percentage: number
  }[]
  source: 'artemis' | 'estimated'
  methodology: string
  lastUpdated: string
}

// Calculate adjusted volume - uses Artemis if available, otherwise estimates
export async function calculateAdjustedVolume(rawVolume: number): Promise<AdjustedVolumeMetrics> {
  const apiKey = process.env.ARTEMIS_API_KEY

  if (apiKey) {
    try {
      const artemisData = await fetchArtemisVolumeBreakdown(1)

      // Scale to match our raw volume (in case of data timing differences)
      const scale = rawVolume / artemisData.rawVolume

      const adjustedVolume = artemisData.adjustedVolume * scale
      const p2pVolume = artemisData.p2pVolume * scale
      const paymentsVolume = artemisData.paymentsVolume * scale
      const cexVolume = artemisData.cexVolume * scale
      const defiVolume = artemisData.defiVolume * scale

      return {
        rawVolume,
        adjustedVolume,
        paymentsVolume,
        p2pVolume,
        breakdown: [
          { category: 'CEX Activity', volume: cexVolume, percentage: (cexVolume / rawVolume) * 100 },
          { category: 'DeFi/DEX', volume: defiVolume, percentage: (defiVolume / rawVolume) * 100 },
          { category: 'P2P Transfers', volume: p2pVolume, percentage: (p2pVolume / rawVolume) * 100 },
          { category: 'B2B Payments', volume: paymentsVolume - p2pVolume, percentage: ((paymentsVolume - p2pVolume) / rawVolume) * 100 },
        ],
        source: 'artemis',
        methodology: 'Artemis labeled wallet data: ARTEMIS_STABLECOIN_TRANSFER_VOLUME excludes CEX internal transfers and MEV. P2P_STABLECOIN_TRANSFER_VOLUME tracks EOA-to-EOA transfers.',
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Artemis API error, falling back to estimates:', error)
    }
  }

  // Fallback to estimates (Visa/Allium + Artemis research percentages)
  return getEstimatedVolumeBreakdown(rawVolume)
}

// Estimated breakdown when Artemis API is not available
function getEstimatedVolumeBreakdown(rawVolume: number): AdjustedVolumeMetrics {
  // Based on Artemis 2025 report and Visa/Allium research
  const breakdown = [
    { category: 'CEX Activity', volume: rawVolume * 0.28, percentage: 28 },
    { category: 'DeFi/DEX', volume: rawVolume * 0.22, percentage: 22 },
    { category: 'Bridges', volume: rawVolume * 0.08, percentage: 8 },
    { category: 'B2B Payments', volume: rawVolume * 0.18, percentage: 18 },
    { category: 'P2P Transfers', volume: rawVolume * 0.10, percentage: 10 },
    { category: 'P2B/B2P', volume: rawVolume * 0.10, percentage: 10 },
    { category: 'Other/Unknown', volume: rawVolume * 0.04, percentage: 4 },
  ]

  return {
    rawVolume,
    adjustedVolume: rawVolume * 0.42,
    paymentsVolume: rawVolume * 0.38,
    p2pVolume: rawVolume * 0.10,
    breakdown,
    source: 'estimated',
    methodology: 'Estimated based on Visa/Allium & Artemis 2025 research. Add ARTEMIS_API_KEY for real labeled data.',
    lastUpdated: new Date().toISOString(),
  }
}

// ============================================
// MOCK DATA (when no API key)
// ============================================

function getMockArtemisMetrics(symbol?: string, chain?: string, days = 30): ArtemisStablecoinMetrics[] {
  const data: ArtemisStablecoinMetrics[] = []
  const symbols = symbol ? [symbol] : ['USDT', 'USDC', 'DAI']
  const chains = chain ? [chain] : ['ethereum', 'tron', 'arbitrum', 'polygon']

  // Seeded random for consistency
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const daySeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()

    symbols.forEach((sym, symIdx) => {
      chains.forEach((ch, chIdx) => {
        const seed = daySeed + symIdx * 100 + chIdx * 10
        const baseVolume = sym === 'USDT' ? 20000000000 : sym === 'USDC' ? 12000000000 : 800000000
        const chainMultiplier = ch === 'ethereum' ? 0.4 : ch === 'tron' ? 0.35 : 0.125

        const rawVolume = baseVolume * chainMultiplier * (0.8 + seededRandom(seed) * 0.4)
        const artemisVolume = rawVolume * 0.65  // ~65% passes Artemis filter
        const p2pVolume = rawVolume * 0.25      // ~25% is P2P

        data.push({
          date: dateStr,
          chain: ch,
          symbol: sym,
          transferVolume: rawVolume,
          artemisTransferVolume: artemisVolume,
          p2pTransferVolume: p2pVolume,
          dailyTxns: Math.floor(rawVolume / 50000),
          artemisDailyTxns: Math.floor(artemisVolume / 45000),
          p2pDailyTxns: Math.floor(p2pVolume / 30000),
          supply: sym === 'USDT' ? 140000000000 : sym === 'USDC' ? 50000000000 : 5000000000,
          dau: Math.floor((rawVolume / 1000000) * (0.8 + seededRandom(seed + 1) * 0.4)),
        })
      })
    })
  }

  return data
}

function getMockVolumeBreakdown(): ArtemisVolumeBreakdown {
  // Use today's date for seed
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000
    return x - Math.floor(x)
  }

  const rawVolume = 82000000000 * (0.9 + seededRandom(seed) * 0.2)
  const adjustedVolume = rawVolume * 0.65
  const p2pVolume = rawVolume * 0.25

  return {
    date: today.toISOString().split('T')[0],
    rawVolume,
    adjustedVolume,
    p2pVolume,
    cexVolume: rawVolume - adjustedVolume,
    defiVolume: adjustedVolume - p2pVolume,
    paymentsVolume: p2pVolume + (adjustedVolume - p2pVolume) * 0.8,
  }
}
