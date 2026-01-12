import { getBridges, getBridge, getBridgeVolume, getLargeTransactions } from './defillama'
import type { Bridge, BridgeWithMetrics, FlowData, FlowNode, FlowLink, NetworkData, NetworkNode, NetworkLink } from '../types'

export async function fetchAllBridges(): Promise<BridgeWithMetrics[]> {
  const data = await getBridges(true)
  const bridges: Bridge[] = data.bridges || []

  return bridges.map(bridge => {
    const lastDaily = bridge.lastDailyVolume || 0
    const dayBefore = bridge.dayBeforeLastVolume || 0
    const weekly = bridge.weeklyVolume || 0
    const monthly = bridge.monthlyVolume || 0

    const change24h = dayBefore > 0
      ? ((lastDaily - dayBefore) / dayBefore) * 100
      : 0
    const change7d = weekly > 0 && lastDaily > 0
      ? ((lastDaily * 7 - weekly) / weekly) * 100
      : 0

    return {
      ...bridge,
      lastDailyVolume: lastDaily,
      dayBeforeLastVolume: dayBefore,
      weeklyVolume: weekly,
      monthlyVolume: monthly,
      change24h,
      change7d,
    }
  }).sort((a, b) => b.lastDailyVolume - a.lastDailyVolume)
}

export async function fetchBridgeDetails(id: number) {
  return getBridge(id)
}

export async function fetchBridgeVolumeHistory(chain: string) {
  const data = await getBridgeVolume(chain)
  return Object.entries(data).map(([date, values]) => ({
    date: parseInt(date) * 1000,
    ...(values as object),
  }))
}

export async function fetchLargeTransactions(chain: string) {
  return getLargeTransactions(chain)
}

// Transform bridge data into Sankey flow format
export async function fetchBridgeFlowData(): Promise<FlowData> {
  const data = await getBridges(true)
  const bridges: Bridge[] = data.bridges || []

  // Define layer 1 chains (sources - left side) vs layer 2/destination chains (right side)
  const l1Chains = new Set(['Ethereum', 'BSC', 'Tron', 'Solana', 'Avalanche', 'Polygon'])
  const l2Chains = new Set(['Arbitrum', 'Optimism', 'Base', 'zkSync Era', 'Linea', 'Scroll', 'Mantle', 'Blast', 'Mode', 'Manta'])

  // Track volumes and flows
  const chainVolumes = new Map<string, number>()
  const flowMap = new Map<string, number>()

  bridges.forEach(bridge => {
    const chains = bridge.chains || []
    const dailyVolume = bridge.lastDailyVolume || 0
    if (dailyVolume <= 0) return

    // Track total volume per chain
    const volumePerChain = dailyVolume / Math.max(chains.length, 1)
    chains.forEach(chain => {
      chainVolumes.set(chain, (chainVolumes.get(chain) || 0) + volumePerChain)
    })

    // Create directional flows from L1 to L2 chains
    const sourceChains = chains.filter(c => l1Chains.has(c))
    const targetChains = chains.filter(c => l2Chains.has(c))

    // If bridge connects L1 to L2, create those flows
    if (sourceChains.length > 0 && targetChains.length > 0) {
      const flowPerPair = dailyVolume / (sourceChains.length * targetChains.length)
      sourceChains.forEach(source => {
        targetChains.forEach(target => {
          const key = `${source}->${target}`
          flowMap.set(key, (flowMap.get(key) || 0) + flowPerPair)
        })
      })
    } else {
      // For bridges that don't fit L1->L2 pattern, connect to Ethereum if present
      const hasEth = chains.includes('Ethereum')
      if (hasEth) {
        const otherChains = chains.filter(c => c !== 'Ethereum')
        const flowPerChain = dailyVolume / Math.max(otherChains.length, 1)
        otherChains.forEach(target => {
          const key = `Ethereum->${target}`
          flowMap.set(key, (flowMap.get(key) || 0) + flowPerChain)
        })
      }
    }
  })

  // Get top chains by volume for each side
  const sortedChains = Array.from(chainVolumes.entries())
    .sort((a, b) => b[1] - a[1])

  const sourceNodes = sortedChains
    .filter(([chain]) => l1Chains.has(chain))
    .slice(0, 6)
    .map(([chain, value]) => ({
      id: `source-${chain}`,
      name: chain,
      color: getChainColor(chain),
      value,
    }))

  const targetNodes = sortedChains
    .filter(([chain]) => l2Chains.has(chain) || !l1Chains.has(chain))
    .slice(0, 10)
    .map(([chain, value]) => ({
      id: `target-${chain}`,
      name: chain,
      color: getChainColor(chain),
      value,
    }))

  const nodes: FlowNode[] = [...sourceNodes, ...targetNodes]
  const nodeIds = new Set(nodes.map(n => n.id))

  // Create links with proper source/target IDs
  const links: FlowLink[] = []
  flowMap.forEach((value, key) => {
    const [source, target] = key.split('->')
    const sourceId = `source-${source}`
    const targetId = `target-${target}`

    if (nodeIds.has(sourceId) && nodeIds.has(targetId) && value > 50000) {
      links.push({
        source: sourceId,
        target: targetId,
        value,
        color: getChainColor(source),
      })
    }
  })

  return {
    nodes,
    links: links.sort((a, b) => b.value - a.value).slice(0, 30),
  }
}

// Transform bridge data into Network graph format (non-directional)
export async function fetchNetworkGraphData(): Promise<NetworkData> {
  const data = await getBridges(true)
  const bridges: Bridge[] = data.bridges || []

  const chainVolumes = new Map<string, number>()
  const flowMap = new Map<string, number>()

  bridges.forEach(bridge => {
    const chains = bridge.chains || []
    const dailyVolume = bridge.lastDailyVolume || 0
    if (dailyVolume <= 0 || chains.length < 2) return

    const volumePerChain = dailyVolume / chains.length
    chains.forEach(chain => {
      chainVolumes.set(chain, (chainVolumes.get(chain) || 0) + volumePerChain)
    })

    // Create bidirectional links between connected chains
    for (let i = 0; i < chains.length; i++) {
      for (let j = i + 1; j < chains.length; j++) {
        const key = [chains[i], chains[j]].sort().join('<->')
        flowMap.set(key, (flowMap.get(key) || 0) + dailyVolume / (chains.length * (chains.length - 1) / 2))
      }
    }
  })

  // Get top 15 chains
  const topChains = Array.from(chainVolumes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  const nodes: NetworkNode[] = topChains.map(([chain, value]) => ({
    id: chain,
    name: chain,
    value,
    color: getChainColor(chain),
  }))

  const nodeIds = new Set(nodes.map(n => n.id))
  const links: NetworkLink[] = []

  flowMap.forEach((value, key) => {
    const [source, target] = key.split('<->')
    if (nodeIds.has(source) && nodeIds.has(target) && value > 100000) {
      links.push({ source, target, value })
    }
  })

  return {
    nodes,
    links: links.sort((a, b) => b.value - a.value).slice(0, 40),
  }
}

// Calculate total bridge volume
export async function fetchBridgeMetrics() {
  const bridges = await fetchAllBridges()

  const totalDailyVolume = bridges.reduce((sum, b) => sum + (b.lastDailyVolume || 0), 0)
  const totalWeeklyVolume = bridges.reduce((sum, b) => sum + (b.weeklyVolume || 0), 0)
  const totalMonthlyVolume = bridges.reduce((sum, b) => sum + (b.monthlyVolume || 0), 0)

  const prevDayVolume = bridges.reduce((sum, b) => sum + (b.dayBeforeLastVolume || 0), 0)
  const change24h = prevDayVolume > 0 ? ((totalDailyVolume - prevDayVolume) / prevDayVolume) * 100 : 0

  return {
    totalDailyVolume,
    totalWeeklyVolume,
    totalMonthlyVolume,
    change24h,
    bridgeCount: bridges.length,
    activeChains: new Set(bridges.flatMap(b => b.chains || [])).size,
  }
}

// Helper function to get chain color
function getChainColor(chain: string): string {
  const colors: Record<string, string> = {
    'Ethereum': '#627EEA',
    'Tron': '#FF0013',
    'BSC': '#F0B90B',
    'Solana': '#9945FF',
    'Arbitrum': '#28A0F0',
    'Polygon': '#8247E5',
    'Avalanche': '#E84142',
    'Optimism': '#FF0420',
    'Base': '#0052FF',
    'Fantom': '#1969FF',
    'Gnosis': '#04795B',
    'zkSync Era': '#8C8DFC',
    'Linea': '#61DFFF',
    'Mantle': '#000000',
    'Scroll': '#FFEEDA',
  }

  return colors[chain] || `hsl(${hashString(chain) % 360}, 70%, 50%)`
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}
