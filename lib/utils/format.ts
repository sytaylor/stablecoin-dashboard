export function formatCurrency(value: number, decimals = 2): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(decimals)}T`
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(decimals)}B`
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals)}M`
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(decimals)}K`
  }
  return `$${value.toFixed(decimals)}`
}

export function formatNumber(value: number, decimals = 2): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(decimals)}T`
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`
  }
  return value.toFixed(decimals)
}

export function formatPercentage(value: number, decimals = 2): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(decimals)}%`
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatFullNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(timestamp: number, format: 'short' | 'long' | 'time' = 'short'): string {
  const date = new Date(timestamp)

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case 'long':
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    case 'time':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    default:
      return date.toLocaleDateString()
  }
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatTxHash(hash: string, chars = 6): string {
  if (!hash || hash.length < chars * 2) return hash
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}

// Alias for formatCurrency for compact display
export const formatCompact = formatCurrency

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}
