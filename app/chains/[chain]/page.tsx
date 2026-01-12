'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCard, MetricCardGrid } from '@/components/dashboard/MetricCard'
import { MarketCapChart } from '@/components/charts/MarketCapChart'
import { DonutChart } from '@/components/charts/PieChart'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { getChainColor, getStablecoinColor } from '@/lib/utils/colors'
import { useChains, useHistoricalCharts, useStablecoinsByChain } from '@/lib/hooks/useStablecoins'
import { useBridgesByChain } from '@/lib/hooks/useBridges'

interface PageProps {
  params: Promise<{ chain: string }>
}

export default function ChainDetailPage({ params }: PageProps) {
  const { chain: chainParam } = use(params)
  const chainName = decodeURIComponent(chainParam)

  const { data: chains, isLoading: chainsLoading } = useChains()
  const { data: chartData, isLoading: chartLoading } = useHistoricalCharts(chainName)
  const { data: stablecoins, isLoading: stablecoinsLoading } = useStablecoinsByChain(chainName)
  const { data: bridges, isLoading: bridgesLoading } = useBridgesByChain(chainName)

  const chain = chains?.find((c) => c.name === chainName)

  // Calculate total for percentages
  const totalChainValue = chains?.reduce((sum, c) => sum + c.totalStablecoinUSD, 0) || 0

  // Stablecoin distribution for this chain
  const stablecoinData = stablecoins
    ? stablecoins
        .map((coin) => {
          const chainCirculating = coin.circulating[chainName]?.current || 0
          return {
            name: coin.symbol,
            value: chainCirculating,
            color: getStablecoinColor(coin.symbol),
          }
        })
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value)
    : []

  if (chainsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!chain) {
    return (
      <div className="space-y-6">
        <Link href="/chains">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Chains
          </Button>
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Chain not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dominance = (chain.totalStablecoinUSD / totalChainValue) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/chains">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: getChainColor(chain.name) }}
        >
          {chain.name.slice(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{chain.name}</h1>
          <p className="text-muted-foreground">
            {chain.stablecoinCount} stablecoins
          </p>
        </div>
      </div>

      {/* Metrics */}
      <MetricCardGrid>
        <MetricCard
          title="Stablecoin TVL"
          value={chain.totalStablecoinUSD}
          change={chain.change24h}
          format="currency"
        />
        <MetricCard
          title="24h Change"
          value={chain.change24h}
          format="percentage"
        />
        <MetricCard
          title="7d Change"
          value={chain.change7d}
          format="percentage"
        />
        <MetricCard
          title="Market Share"
          value={dominance}
          format="percentage"
        />
      </MetricCardGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketCapChart
            data={chartData || []}
            title={`${chain.name} Stablecoin TVL`}
            loading={chartLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <DonutChart
            data={stablecoinData.slice(0, 8)}
            title="Stablecoin Distribution"
            loading={stablecoinsLoading}
            innerRadius={60}
            outerRadius={100}
          />
        </div>
      </div>

      {/* Stablecoin Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Stablecoins on {chain.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {stablecoinsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stablecoinData.slice(0, 15).map((coin, index) => {
                const percentage = (coin.value / chain.totalStablecoinUSD) * 100
                return (
                  <div key={coin.name} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: coin.color }}
                    >
                      {coin.name.slice(0, 2)}
                    </div>
                    <span className="font-medium flex-1">{coin.name}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: coin.color,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="font-medium w-24 text-right">
                      {formatCurrency(coin.value)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Bridges */}
      {bridges && bridges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Bridges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bridges.slice(0, 20).map((bridge) => (
                <Badge key={bridge.id} variant="secondary" className="py-1.5">
                  {bridge.displayName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
