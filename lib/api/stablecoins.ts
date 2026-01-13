import { getStablecoins, getStablecoin, getStablecoinChains, getStablecoinCharts } from './defillama'
import type { StablecoinWithMetrics, ChainWithMetrics, StablecoinHistorical } from '../types'

// The actual API response structure - circulating values are keyed by peg type
interface ApiStablecoin {
  id: number
  name: string
  symbol: string
  gecko_id: string | null
  pegType: string
  pegMechanism: string
  circulating: Record<string, number>
  circulatingPrevDay: Record<string, number>
  circulatingPrevWeek: Record<string, number>
  circulatingPrevMonth: Record<string, number>
  chainCirculating: {
    [chain: string]: {
      current: Record<string, number>
      circulatingPrevDay?: Record<string, number>
      circulatingPrevWeek?: Record<string, number>
      circulatingPrevMonth?: Record<string, number>
    }
  }
  chains: string[]
  price: number | null
}

// Helper to get the circulating value regardless of peg type
function getCirculatingValue(obj: Record<string, number> | undefined): number {
  if (!obj) return 0
  // Get the first (and usually only) value from the object
  const values = Object.values(obj)
  return values[0] || 0
}

export async function fetchAllStablecoins(): Promise<StablecoinWithMetrics[]> {
  const data = await getStablecoins(true)
  const peggedAssets: ApiStablecoin[] = data.peggedAssets || []

  // Calculate total market cap for dominance (using helper for all peg types)
  const totalMarketCap = peggedAssets.reduce((sum, coin) => {
    return sum + getCirculatingValue(coin.circulating)
  }, 0)

  return peggedAssets.map(coin => {
    const totalCirculating = getCirculatingValue(coin.circulating)
    const totalPrevDay = getCirculatingValue(coin.circulatingPrevDay) || totalCirculating
    const totalPrevWeek = getCirculatingValue(coin.circulatingPrevWeek) || totalCirculating
    const totalPrevMonth = getCirculatingValue(coin.circulatingPrevMonth) || totalCirculating

    const change24h = totalPrevDay > 0 ? ((totalCirculating - totalPrevDay) / totalPrevDay) * 100 : 0
    const change7d = totalPrevWeek > 0 ? ((totalCirculating - totalPrevWeek) / totalPrevWeek) * 100 : 0
    const change30d = totalPrevMonth > 0 ? ((totalCirculating - totalPrevMonth) / totalPrevMonth) * 100 : 0
    const dominance = totalMarketCap > 0 ? (totalCirculating / totalMarketCap) * 100 : 0

    // Convert chainCirculating to our expected format
    const circulating: { [chain: string]: { current: number; circulatingPrevDay?: number; circulatingPrevWeek?: number; circulatingPrevMonth?: number } } = {}
    if (coin.chainCirculating) {
      Object.entries(coin.chainCirculating).forEach(([chain, chainData]) => {
        const current = getCirculatingValue(chainData.current)
        if (current > 0) {
          circulating[chain] = {
            current,
            circulatingPrevDay: getCirculatingValue(chainData.circulatingPrevDay),
            circulatingPrevWeek: getCirculatingValue(chainData.circulatingPrevWeek),
            circulatingPrevMonth: getCirculatingValue(chainData.circulatingPrevMonth),
          }
        }
      })
    }

    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      gecko_id: coin.gecko_id,
      pegType: coin.pegType,
      pegMechanism: coin.pegMechanism,
      circulating,
      price: coin.price,
      priceSource: null,
      chains: coin.chains || [],
      totalCirculating,
      change24h,
      change7d,
      change30d,
      dominance,
    }
  }).sort((a, b) => b.totalCirculating - a.totalCirculating)
}

export async function fetchStablecoinHistory(id: number): Promise<StablecoinHistorical[]> {
  const data = await getStablecoin(id)
  return data.tokens || []
}

export async function fetchChainData(): Promise<ChainWithMetrics[]> {
  const [chainsData, stablecoinsData] = await Promise.all([
    getStablecoinChains(),
    getStablecoins(true),
  ])

  const stablecoins: ApiStablecoin[] = stablecoinsData.peggedAssets || []

  // Build chain metrics from stablecoin data
  const chainMap = new Map<string, {
    total: number
    prevDay: number
    prevWeek: number
    stablecoins: { name: string; symbol: string; amount: number }[]
  }>()

  stablecoins.forEach(coin => {
    const chainCirculating = coin.chainCirculating || {}
    Object.entries(chainCirculating).forEach(([chain, data]) => {
      const current = getCirculatingValue(data.current)
      if (current > 0) {
        const existing = chainMap.get(chain) || {
          total: 0,
          prevDay: 0,
          prevWeek: 0,
          stablecoins: [],
        }

        existing.total += current
        existing.prevDay += getCirculatingValue(data.circulatingPrevDay) || current
        existing.prevWeek += getCirculatingValue(data.circulatingPrevWeek) || current
        existing.stablecoins.push({
          name: coin.name,
          symbol: coin.symbol,
          amount: current,
        })

        chainMap.set(chain, existing)
      }
    })
  })

  return Array.from(chainMap.entries())
    .map(([name, data]) => ({
      name,
      totalStablecoinUSD: data.total,
      stablecoinCount: data.stablecoins.length,
      change24h: data.prevDay > 0 ? ((data.total - data.prevDay) / data.prevDay) * 100 : 0,
      change7d: data.prevWeek > 0 ? ((data.total - data.prevWeek) / data.prevWeek) * 100 : 0,
      topStablecoins: data.stablecoins
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    }))
    .sort((a, b) => b.totalStablecoinUSD - a.totalStablecoinUSD)
}

export async function fetchHistoricalCharts(chain?: string) {
  const data = await getStablecoinCharts(chain)
  return data.map((item: { date: number; totalCirculatingUSD: { peggedUSD: number } }) => ({
    date: item.date * 1000, // Convert to milliseconds
    value: item.totalCirculatingUSD?.peggedUSD || 0,
  }))
}

export async function fetchTotalMetrics() {
  const stablecoins = await fetchAllStablecoins()

  const totalMarketCap = stablecoins.reduce((sum, coin) => sum + coin.totalCirculating, 0)
  const totalPrevDay = stablecoins.reduce((sum, coin) => {
    const factor = coin.change24h !== 0 ? 100 / (100 + coin.change24h) : 1
    return sum + coin.totalCirculating * factor
  }, 0)
  const totalPrevWeek = stablecoins.reduce((sum, coin) => {
    const factor = coin.change7d !== 0 ? 100 / (100 + coin.change7d) : 1
    return sum + coin.totalCirculating * factor
  }, 0)

  return {
    totalMarketCap,
    change24h: totalPrevDay > 0 ? ((totalMarketCap - totalPrevDay) / totalPrevDay) * 100 : 0,
    change7d: totalPrevWeek > 0 ? ((totalMarketCap - totalPrevWeek) / totalPrevWeek) * 100 : 0,
    stablecoinCount: stablecoins.length,
    chainCount: new Set(stablecoins.flatMap(coin => coin.chains)).size,
  }
}
