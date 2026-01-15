'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Coins,
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCard, MetricCardGrid } from '@/components/dashboard/MetricCard'
import { ChainDistribution } from '@/components/dashboard/ChainDistribution'
import { UserAdoptionCard } from '@/components/dashboard/UserAdoptionCard'
import { StablecoinMarketSegments } from '@/components/dashboard/StablecoinMarketSegments'
import { useStablecoins, useTotalMetrics, useChains } from '@/lib/hooks/useStablecoins'
import { useBridgeMetrics } from '@/lib/hooks/useBridges'
import { useDuneMetricsSummary, usePegStability, useTransferVolume, useAdjustedVolume } from '@/lib/hooks/useDuneData'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCompact } from '@/lib/utils/format'

export default function DashboardPage() {
  const { data: stablecoins, isLoading: stablecoinsLoading } = useStablecoins()
  const { data: totalMetrics, isLoading: metricsLoading } = useTotalMetrics()
  const { data: bridgeMetrics, isLoading: bridgeLoading } = useBridgeMetrics()
  const { data: duneMetrics, isLoading: duneLoading } = useDuneMetricsSummary()
  const { data: pegData, isLoading: pegLoading } = usePegStability(undefined, 1)
  const { data: volumeData, isLoading: volumeLoading } = useTransferVolume(undefined, 1)
  const { data: chainData, isLoading: chainsLoading } = useChains()

  const setLastUpdated = useDashboardStore((state) => state.setLastUpdated)

  useEffect(() => {
    if (stablecoins || bridgeMetrics) {
      setLastUpdated(Date.now())
    }
  }, [stablecoins, bridgeMetrics, setLastUpdated])

  // Get top 5 stablecoins
  const topStablecoins = stablecoins?.slice(0, 5) || []

  // Peg status for each major stablecoin
  const pegStatus = ['USDT', 'USDC', 'DAI', 'USDS'].map(coin => {
    const coinData = pegData?.filter(p => p.stablecoin === coin) || []
    const latest = coinData[0]
    return {
      coin,
      price: latest?.price || 1,
      status: latest ? (Math.abs(latest.deviation) < 0.1 ? 'healthy' : 'warning') : 'unknown',
    }
  })

  // Calculate raw transfer volume
  const totalTransferVolume = volumeData?.reduce((sum, v) => sum + v.volume, 0) ||
    duneMetrics?.totalDailyVolume ||
    bridgeMetrics?.totalDailyVolume || 0

  // Get adjusted volume using Visa/Allium + Artemis methodology
  const { data: adjustedData, isLoading: adjustedLoading } = useAdjustedVolume(totalTransferVolume)

  // Payments volume: excludes CEX, DEX, bridges (Visa/Allium + Artemis methodology)
  const paymentsVolume = adjustedData?.paymentsVolume || totalTransferVolume * 0.38
  const volumeSource = adjustedData?.source || 'estimated'
  const paymentsPercentage = totalTransferVolume > 0
    ? ((paymentsVolume / totalTransferVolume) * 100).toFixed(0)
    : '38'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="gradient-text">Stablecoin</span> Analytics
        </h1>
        <p className="text-muted-foreground">
          Real-time market intelligence for payments & tokenization
        </p>
      </div>

      {/* Peg Health Status Bar */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Peg Status</span>
            </div>
            {pegLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              pegStatus.map(({ coin, price, status }) => (
                <div key={coin} className="flex items-center gap-2">
                  <span className="font-medium">{coin}</span>
                  <span className="text-muted-foreground">${price.toFixed(4)}</span>
                  {status === 'healthy' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : status === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : null}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <MetricCardGrid>
        <MetricCard
          title="Total Market Cap"
          value={totalMetrics?.totalMarketCap || 0}
          change={totalMetrics?.change24h}
          format="currency"
          icon={<Coins className="h-5 w-5" />}
          loading={metricsLoading}
          tooltip="Total circulating supply of all tracked stablecoins across all chains. Source: DefiLlama stablecoins API, updated every 5 minutes."
        />
        <MetricCard
          title="24h Transfer Volume"
          value={totalTransferVolume}
          format="currency"
          icon={<Activity className="h-5 w-5" />}
          loading={volumeLoading || duneLoading || bridgeLoading}
          subtitle="Raw on-chain volume"
          tooltip="Total stablecoin transfer volume in the last 24 hours. Includes all on-chain activity: CEX flows, DEX trades, bridges, payments, and bot activity. This is the 'unadjusted' figure."
        />
        <MetricCard
          title={volumeSource === 'artemis' ? '24h Payments Volume' : '24h Payments Volume (Est.)'}
          value={paymentsVolume}
          format="currency"
          icon={<CreditCard className="h-5 w-5" />}
          loading={volumeLoading || duneLoading || bridgeLoading || adjustedLoading}
          subtitle={`~${paymentsPercentage}% of raw volume`}
          tooltip={volumeSource === 'artemis'
            ? "Real Artemis labeled wallet data: excludes CEX internal transfers, DEX activity, MEV bots. P2P + B2B transfers classified as payments. Last 24 hours."
            : "Estimated using Visa/Allium & Artemis 2025 research methodology: ~38% of raw on-chain volume is real payments (P2P + B2B), excluding CEX/DEX/bridge activity. Artemis Snowflake metrics not available via REST API. Last 24 hours."
          }
        />
        <MetricCard
          title="Daily Active Addresses"
          value={duneMetrics?.dailyActiveAddresses || 0}
          format="number"
          icon={<Users className="h-5 w-5" />}
          loading={duneLoading}
          tooltip="Unique addresses that sent or received stablecoins in the last 24 hours. Counts each address once regardless of transaction count. Source: Dune Analytics."
        />
      </MetricCardGrid>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Stablecoins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Stablecoins</CardTitle>
              <CardDescription>By market capitalization</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/stablecoins">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stablecoinsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {topStablecoins.map((coin, index) => (
                  <Link
                    key={coin.id}
                    href={`/stablecoins/${coin.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground w-5">{index + 1}</span>
                      <div>
                        <div className="font-medium">{coin.name}</div>
                        <div className="text-sm text-muted-foreground">{coin.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCompact(coin.totalCirculating)}</div>
                      <Badge
                        variant={coin.change24h >= 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chain Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Stablecoins by Chain</CardTitle>
              <CardDescription>Distribution across networks</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/stablecoins">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ChainDistribution
              data={chainData || []}
              loading={chainsLoading}
              limit={6}
            />
          </CardContent>
        </Card>
      </div>

      {/* User Adoption - Unique insight from Artemis */}
      <UserAdoptionCard symbols={['usdc', 'usdt', 'dai']} days={30} />

      {/* Market Segmentation - USD vs Non-USD vs Algorithmic */}
      <StablecoinMarketSegments />

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/stablecoins">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-medium">Market Analysis</div>
                  <div className="text-sm text-muted-foreground">Supply & dominance trends</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/activity">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-medium">On-Chain Activity</div>
                  <div className="text-sm text-muted-foreground">Volume & address metrics</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/risk">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-medium">Risk Monitor</div>
                  <div className="text-sm text-muted-foreground">Peg stability & concentration</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
