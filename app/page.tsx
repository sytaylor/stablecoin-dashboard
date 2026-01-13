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
  Fish,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCard, MetricCardGrid } from '@/components/dashboard/MetricCard'
import { useStablecoins, useTotalMetrics } from '@/lib/hooks/useStablecoins'
import { useBridgeMetrics } from '@/lib/hooks/useBridges'
import { useDuneMetricsSummary, usePegStability, useWhaleTransfers, useMintBurnEvents } from '@/lib/hooks/useDuneData'
import { useDashboardStore } from '@/stores/dashboard'
import { formatCurrency, formatCompact, formatNumber } from '@/lib/utils/format'

export default function DashboardPage() {
  const { data: stablecoins, isLoading: stablecoinsLoading } = useStablecoins()
  const { data: totalMetrics, isLoading: metricsLoading } = useTotalMetrics()
  const { data: bridgeMetrics, isLoading: bridgeLoading } = useBridgeMetrics()
  const { data: duneMetrics, isLoading: duneLoading } = useDuneMetricsSummary()
  const { data: pegData, isLoading: pegLoading } = usePegStability(undefined, 1)
  const { data: whaleData, isLoading: whaleLoading } = useWhaleTransfers(1000000, 1)
  const { data: mintBurnData, isLoading: mintBurnLoading } = useMintBurnEvents(undefined, 1)

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

  // Recent mint/burn summary
  const recentMints = mintBurnData?.filter(e => e.type === 'mint').slice(0, 3) || []
  const recentBurns = mintBurnData?.filter(e => e.type === 'burn').slice(0, 3) || []
  const netSupplyChange = (duneMetrics?.dailyMints || 0) - (duneMetrics?.dailyBurns || 0)

  // Recent whale transfers
  const recentWhales = whaleData?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Overview</h1>
        <p className="text-muted-foreground">
          Real-time stablecoin market intelligence
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
        />
        <MetricCard
          title="24h Transfer Volume"
          value={duneMetrics?.totalDailyVolume || bridgeMetrics?.totalDailyVolume || 0}
          format="currency"
          icon={<Activity className="h-5 w-5" />}
          loading={duneLoading || bridgeLoading}
        />
        <MetricCard
          title="Daily Active Addresses"
          value={duneMetrics?.dailyActiveAddresses || 0}
          format="number"
          icon={<Users className="h-5 w-5" />}
          loading={duneLoading}
        />
        <MetricCard
          title="Net Supply Change (24h)"
          value={netSupplyChange}
          format="currency"
          icon={netSupplyChange >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
          loading={duneLoading}
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
                  <div
                    key={coin.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supply Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Supply Activity (24h)</CardTitle>
              <CardDescription>Recent mints and burns</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/activity">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {mintBurnLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    Recent Mints
                  </div>
                  {recentMints.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent mints</p>
                  ) : (
                    <div className="space-y-2">
                      {recentMints.map((event, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{event.stablecoin} on {event.chain}</span>
                          <span className="text-green-500 font-medium">
                            +{formatCompact(event.amountUsd)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                    Recent Burns
                  </div>
                  {recentBurns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent burns</p>
                  ) : (
                    <div className="space-y-2">
                      {recentBurns.map((event, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{event.stablecoin} on {event.chain}</span>
                          <span className="text-red-500 font-medium">
                            -{formatCompact(event.amountUsd)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Whale Activity Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="h-5 w-5" />
            <div>
              <CardTitle>Whale Activity</CardTitle>
              <CardDescription>Large transfers in the last 24 hours</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/whales">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {whaleLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentWhales.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No large transfers in the last 24 hours
            </p>
          ) : (
            <div className="space-y-3">
              {recentWhales.map((transfer, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{transfer.stablecoin}</Badge>
                    <span className="text-lg font-bold">
                      {formatCurrency(transfer.amountUsd)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate max-w-[100px]">
                      {transfer.fromLabel || transfer.fromAddress}
                    </span>
                    <span>→</span>
                    <span className="truncate max-w-[100px]">
                      {transfer.toLabel || transfer.toAddress}
                    </span>
                    <Badge variant="secondary" className="ml-2">{transfer.chain}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/stablecoins">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-medium">Market Analysis</div>
                  <div className="text-sm text-muted-foreground">Supply & dominance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/activity">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-medium">On-Chain Activity</div>
                  <div className="text-sm text-muted-foreground">Volume & addresses</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/bridges">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Coins className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-medium">Bridge Flows</div>
                  <div className="text-sm text-muted-foreground">Cross-chain movement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/risk">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-medium">Risk Monitor</div>
                  <div className="text-sm text-muted-foreground">Peg & concentration</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
