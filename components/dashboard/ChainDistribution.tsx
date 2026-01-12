'use client'

import { useMemo } from 'react'
import { DonutChart } from '@/components/charts/PieChart'
import { getChainColor } from '@/lib/utils/colors'
import type { ChainWithMetrics } from '@/lib/types'

interface ChainDistributionProps {
  data: ChainWithMetrics[]
  loading?: boolean
  limit?: number
}

export function ChainDistribution({
  data,
  loading = false,
  limit = 8,
}: ChainDistributionProps) {
  const chartData = useMemo(() => {
    if (!data?.length) return []

    const topChains = data.slice(0, limit)
    const otherValue = data
      .slice(limit)
      .reduce((sum, chain) => sum + chain.totalStablecoinUSD, 0)

    const result = topChains.map((chain) => ({
      name: chain.name,
      value: chain.totalStablecoinUSD,
      color: getChainColor(chain.name),
    }))

    if (otherValue > 0) {
      result.push({
        name: 'Others',
        value: otherValue,
        color: '#6B7280',
      })
    }

    return result
  }, [data, limit])

  return (
    <DonutChart
      data={chartData}
      title="Stablecoins by Chain"
      loading={loading}
      innerRadius={70}
      outerRadius={110}
    />
  )
}
