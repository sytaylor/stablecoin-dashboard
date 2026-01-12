const STABLECOINS_BASE_URL = 'https://stablecoins.llama.fi'
const BRIDGES_BASE_URL = 'https://bridges.llama.fi'

// Cache duration in seconds (5 minutes for frequently updated data)
const CACHE_REVALIDATE = 300

interface FetchOptions extends RequestInit {
  timeout?: number
  revalidate?: number
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 15000, revalidate = CACHE_REVALIDATE, ...fetchOptions } = options

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      next: { revalidate }, // Next.js cache with revalidation
    })
    clearTimeout(id)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response
  } catch (error) {
    clearTimeout(id)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${url}`)
    }
    throw error
  }
}

// Stablecoins API
export async function getStablecoins(includePrices = true) {
  const url = `${STABLECOINS_BASE_URL}/stablecoins${includePrices ? '?includePrices=true' : ''}`
  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function getStablecoin(id: number) {
  const url = `${STABLECOINS_BASE_URL}/stablecoin/${id}`
  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function getStablecoinChains() {
  const url = `${STABLECOINS_BASE_URL}/stablecoinchains`
  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function getStablecoinCharts(chain?: string) {
  const url = chain
    ? `${STABLECOINS_BASE_URL}/stablecoincharts/${chain}`
    : `${STABLECOINS_BASE_URL}/stablecoincharts/all`
  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function getStablecoinPrices() {
  const url = `${STABLECOINS_BASE_URL}/stablecoinprices`
  const response = await fetchWithTimeout(url)
  return response.json()
}

// Bridges API
export async function getBridges(includeChains = true) {
  const url = `${BRIDGES_BASE_URL}/bridges${includeChains ? '?includeChains=true' : ''}`
  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function getBridge(id: number) {
  const url = `${BRIDGES_BASE_URL}/bridge/${id}`
  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function getBridgeVolume(chain: string) {
  const url = `${BRIDGES_BASE_URL}/bridgevolume/${chain}`
  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function getBridgeDayStats(timestamp: number, chain: string) {
  const url = `${BRIDGES_BASE_URL}/bridgedaystats/${timestamp}/${chain}`
  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function getBridgeTransactions(id: number, startTimestamp?: number, endTimestamp?: number) {
  let url = `${BRIDGES_BASE_URL}/transactions/${id}`
  const params = new URLSearchParams()
  if (startTimestamp) params.append('starttimestamp', startTimestamp.toString())
  if (endTimestamp) params.append('endtimestamp', endTimestamp.toString())
  if (params.toString()) url += `?${params.toString()}`

  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function getLargeTransactions(chain: string) {
  const url = `${BRIDGES_BASE_URL}/largetransactions/${chain}`
  const response = await fetchWithTimeout(url)
  return response.json()
}

// Helper to get aggregated bridge flows between chains
export async function getBridgeFlows() {
  const bridges = await getBridges()
  return bridges
}
