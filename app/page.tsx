'use client'

import { useEffect } from 'react'
import { Coins, TrendingUp, Users, Link2 } from 'lucide-react'
import { MetricCard, MetricCardGrid } from '@/components/dashboard/MetricCard'
import { MarketCapChart } from '@/components/charts/MarketCapChart'
import { StablecoinTable } from '@/components/dashboard/StablecoinTable'
import { ChainDistribution } from '@/components/dashboard/ChainDistribution'
import { useStablecoins, useChains, useHistoricalCharts, useTotalMetrics } from '@/lib/hooks/useStablecoins'
import { useBridgeMetrics } from '@/lib/hooks/useBridges'
import { useDashboardStore } from '@/stores/dashboard'

export default function DashboardPage() {
  const { data: stablecoins, isLoading: stablecoinsLoading } = useStablecoins()
  const { data: chains, isLoading: chainsLoading } = useChains()
  const { data: chartData, isLoading: chartLoading } = useHistoricalCharts()
  const { data: totalMetrics, isLoading: metricsLoading } = useTotalMetrics()
  const { data: bridgeMetrics, isLoading: bridgeLoading } = useBridgeMetrics()

  const setLastUpdated = useDashboardStore((state) => state.setLastUpdated)

  // Update last updated timestamp when data changes
  useEffect(() => {
    if (stablecoins || chains || bridgeMetrics) {
      setLastUpdated(Date.now())
    }
  }, [stablecoins, chains, bridgeMetrics, setLastUpdated])

  const isLoading = stablecoinsLoading || metricsLoading

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Stablecoin Market Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time analytics for stablecoins across 50+ blockchains
        </p>
      </div>

      {/* Key Metrics */}
      <MetricCardGrid>
        <MetricCard
          title="Total Market Cap"
          value={totalMetrics?.totalMarketCap || 0}
          change={totalMetrics?.change24h}
          format="currency"
          icon={<Coins className="h-5 w-5" />}
          loading={isLoading}
        />
        <MetricCard
          title="24h Bridge Volume"
          value={bridgeMetrics?.totalDailyVolume || 0}
          change={bridgeMetrics?.change24h}
          format="currency"
          icon={<TrendingUp className="h-5 w-5" />}
          loading={bridgeLoading}
        />
        <MetricCard
          title="Stablecoins Tracked"
          value={totalMetrics?.stablecoinCount || 0}
          format="number"
          icon={<Coins className="h-5 w-5" />}
          loading={isLoading}
        />
        <MetricCard
          title="Chains Supported"
          value={totalMetrics?.chainCount || 0}
          format="number"
          icon={<Link2 className="h-5 w-5" />}
          loading={isLoading}
        />
      </MetricCardGrid>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketCapChart
            data={chartData || []}
            title="Total Stablecoin Market Cap"
            loading={chartLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <ChainDistribution
            data={chains || []}
            loading={chainsLoading}
          />
        </div>
      </div>

      {/* Stablecoin Table */}
      <StablecoinTable
        data={stablecoins || []}
        loading={stablecoinsLoading}
        limit={10}
      />
    </div>
  )
}
