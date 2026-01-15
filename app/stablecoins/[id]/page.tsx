'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCard, MetricCardGrid } from '@/components/dashboard/MetricCard'
import { MarketCapChart } from '@/components/charts/MarketCapChart'
import { DonutChart } from '@/components/charts/PieChart'
import { StablecoinHealthScore } from '@/components/dashboard/StablecoinHealthScore'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { getStablecoinColor, getChainColor } from '@/lib/utils/colors'
import { useStablecoins, useStablecoinHistory } from '@/lib/hooks/useStablecoins'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function StablecoinDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const stablecoinId = parseInt(id)

  const { data: stablecoins, isLoading: stablecoinsLoading } = useStablecoins()
  const { data: history, isLoading: historyLoading } = useStablecoinHistory(stablecoinId)

  const stablecoin = stablecoins?.find((s) => s.id === stablecoinId)

  // Calculate chain distribution
  const chainData = stablecoin
    ? Object.entries(stablecoin.circulating || {})
        .map(([chain, data]) => ({
          name: chain,
          value: data?.current || 0,
          color: getChainColor(chain),
        }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value)
    : []

  // Transform history for chart
  const chartData = history
    ? history.map((item: any) => ({
        date: item.date * 1000,
        value: item.totalCirculating?.peggedUSD || 0,
      }))
    : []

  if (stablecoinsLoading) {
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

  if (!stablecoin) {
    return (
      <div className="space-y-6">
        <Link href="/stablecoins">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Stablecoins
          </Button>
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Stablecoin not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/stablecoins">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: getStablecoinColor(stablecoin.symbol) }}
        >
          {stablecoin.symbol.slice(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{stablecoin.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{stablecoin.symbol}</span>
            <Badge variant="outline">{stablecoin.pegType.replace('pegged', '')}</Badge>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <MetricCardGrid>
        <MetricCard
          title="Market Cap"
          value={stablecoin.totalCirculating}
          change={stablecoin.change24h}
          format="currency"
        />
        <MetricCard
          title="24h Change"
          value={stablecoin.change24h}
          format="percentage"
        />
        <MetricCard
          title="7d Change"
          value={stablecoin.change7d}
          format="percentage"
        />
        <MetricCard
          title="Dominance"
          value={stablecoin.dominance}
          format="percentage"
        />
      </MetricCardGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketCapChart
            data={chartData}
            title="Historical Market Cap"
            loading={historyLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <DonutChart
            data={chainData.slice(0, 8)}
            title="Chain Distribution"
            innerRadius={60}
            outerRadius={100}
          />
        </div>
      </div>

      {/* User Adoption Health - Unique Artemis insight */}
      <StablecoinHealthScore symbol={stablecoin.symbol.toLowerCase()} />

      {/* Chain Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Chain Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chainData.slice(0, 15).map((chain, index) => {
              const percentage = (chain.value / stablecoin.totalCirculating) * 100
              return (
                <div key={chain.name} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: chain.color }}
                  >
                    {chain.name.slice(0, 2)}
                  </div>
                  <span className="font-medium flex-1">{chain.name}</span>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: chain.color,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                  <span className="font-medium w-24 text-right">
                    {formatCurrency(chain.value)}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
