import type { ChainColorMap, StablecoinColorMap } from '../types'

export const CHAIN_COLORS: ChainColorMap = {
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
  'Mantle': '#65B3AE',
  'Scroll': '#FFEEDA',
  'Aptos': '#2ED8A7',
  'Sui': '#6FBCF0',
  'Near': '#00C08B',
  'TON': '#0098EA',
  'Hyperliquid': '#00FF00',
  'Celo': '#FBCC5C',
  'Mode': '#DFFE00',
  'Blast': '#FCFC03',
  'Manta': '#000000',
}

export const STABLECOIN_COLORS: StablecoinColorMap = {
  'USDT': '#50AF95',
  'USDC': '#2775CA',
  'DAI': '#F5AC37',
  'USDS': '#1AAB9B',
  'USDe': '#9B6DFF',
  'FDUSD': '#00D395',
  'TUSD': '#002868',
  'USDD': '#216E39',
  'FRAX': '#000000',
  'LUSD': '#2E4B83',
  'PYUSD': '#0070E0',
  'crvUSD': '#3E6957',
  'GHO': '#2EBAC6',
  'USDP': '#00845D',
  'GUSD': '#00DCFA',
  'BUSD': '#F0B90B',
  'USD0': '#6366F1',
  'RLUSD': '#1E1E1E',
  'BUIDL': '#000000',
}

export function getChainColor(chain: string): string {
  if (CHAIN_COLORS[chain]) {
    return CHAIN_COLORS[chain]
  }
  // Generate consistent color from chain name
  return `hsl(${hashString(chain) % 360}, 70%, 50%)`
}

export function getStablecoinColor(symbol: string): string {
  if (STABLECOIN_COLORS[symbol]) {
    return STABLECOIN_COLORS[symbol]
  }
  // Generate consistent color from symbol
  return `hsl(${hashString(symbol) % 360}, 60%, 45%)`
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

// Chart color palette for multiple series
export const CHART_COLORS = [
  '#627EEA', // Ethereum blue
  '#50AF95', // USDT green
  '#2775CA', // USDC blue
  '#F0B90B', // BSC yellow
  '#9945FF', // Solana purple
  '#E84142', // Avalanche red
  '#FF0420', // Optimism red
  '#8247E5', // Polygon purple
  '#28A0F0', // Arbitrum blue
  '#0052FF', // Base blue
]

// Gradient definitions for charts
export const GRADIENTS = {
  primary: ['#627EEA', '#3B5998'],
  success: ['#10B981', '#059669'],
  warning: ['#F59E0B', '#D97706'],
  danger: ['#EF4444', '#DC2626'],
  purple: ['#8B5CF6', '#7C3AED'],
}
