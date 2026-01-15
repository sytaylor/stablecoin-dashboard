'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, Globe, Lock, ArrowRight } from 'lucide-react'
import { useStablecoins } from '@/lib/hooks/useStablecoins'
import { formatCurrency, formatCompact } from '@/lib/utils/format'
import Link from 'next/link'
import type { StablecoinWithMetrics } from '@/lib/types'

export function StablecoinMarketSegments() {
  const { data: stablecoins, isLoading } = useStablecoins()

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stablecoins) return null

  // Segment stablecoins by backing mechanism
  const usdFiatBacked = stablecoins.filter(
    (s) => s.pegType === 'peggedUSD' && s.pegMechanism === 'fiat-backed'
  )

  const nonUsdFiat = stablecoins.filter((s) =>
    ['peggedEUR', 'peggedGBP', 'peggedJPY', 'peggedCHF', 'peggedAUD', 'peggedCAD', 'peggedSGD', 'peggedCNY', 'peggedREAL', 'peggedMXN', 'peggedARS', 'peggedPHP', 'peggedRUB', 'peggedTRY', 'peggedUAH'].includes(s.pegType)
  )

  const collateralYield = stablecoins.filter(
    (s) => s.pegType === 'peggedUSD' && (s.pegMechanism === 'crypto-backed' || s.pegMechanism === 'algorithmic')
  )

  // Calculate totals for each segment
  const calculateSegmentStats = (coins: StablecoinWithMetrics[]) => {
    const totalMarketCap = coins.reduce((sum, coin) => sum + coin.totalCirculating, 0)
    const totalChange24h = coins.reduce((sum, coin) => sum + coin.change24h * coin.totalCirculating, 0) / (totalMarketCap || 1)
    const topCoins = coins
      .sort((a, b) => b.totalCirculating - a.totalCirculating)
      .slice(0, 5)
    return { totalMarketCap, totalChange24h, topCoins, count: coins.length }
  }

  const fiatStats = calculateSegmentStats(usdFiatBacked)
  const nonUsdStats = calculateSegmentStats(nonUsdFiat)
  const collateralStats = calculateSegmentStats(collateralYield)

  const totalMarketCap = fiatStats.totalMarketCap + nonUsdStats.totalMarketCap + collateralStats.totalMarketCap

  // Currency breakdown for non-USD fiat
  const currencyBreakdown = [
    { currency: 'EUR', count: nonUsdFiat.filter(s => s.pegType === 'peggedEUR').length },
    { currency: 'GBP', count: nonUsdFiat.filter(s => s.pegType === 'peggedGBP').length },
    { currency: 'CHF', count: nonUsdFiat.filter(s => s.pegType === 'peggedCHF').length },
    { currency: 'JPY', count: nonUsdFiat.filter(s => s.pegType === 'peggedJPY').length },
    { currency: 'Other', count: nonUsdFiat.length - nonUsdFiat.filter(s => ['peggedEUR', 'peggedGBP', 'peggedCHF', 'peggedJPY'].includes(s.pegType)).length },
  ].filter(c => c.count > 0)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Market Segments</h2>
        <p className="text-sm text-muted-foreground">
          Stablecoin market by backing mechanism and currency peg
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* USD 1:1 Fiat-Backed */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <Badge variant="outline">{((fiatStats.totalMarketCap / totalMarketCap) * 100).toFixed(1)}% of market</Badge>
            </div>
            <CardTitle className="mt-2">USD 1:1 Fiat-Backed</CardTitle>
            <CardDescription>
              Backed by US dollar reserves in banks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{formatCurrency(fiatStats.totalMarketCap)}</div>
              <div className="flex items-center gap-2 mt-1">
                {fiatStats.totalChange24h >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${fiatStats.totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {fiatStats.totalChange24h >= 0 ? '+' : ''}
                  {fiatStats.totalChange24h.toFixed(2)}% (24h)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{fiatStats.count} stablecoins</div>
              <div className="space-y-1">
                {fiatStats.topCoins.slice(0, 3).map((coin, idx) => (
                  <Link key={coin.id} href={`/stablecoins/${coin.id}`}>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                      <span className="text-sm">{idx + 1}. {coin.symbol}</span>
                      <span className="text-xs text-muted-foreground">{formatCompact(coin.totalCirculating)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-3 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                ✓ Lowest risk: Each coin backed 1:1 by USD in bank accounts. Redeemable for cash.
              </p>
            </div>

            <Link href="/stablecoins" className="block">
              <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                View all USD stablecoins <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Non-USD Fiat Stablecoins */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Globe className="h-8 w-8 text-purple-500" />
              <Badge variant="outline">{((nonUsdStats.totalMarketCap / totalMarketCap) * 100).toFixed(1)}% of market</Badge>
            </div>
            <CardTitle className="mt-2">Non-USD Fiat</CardTitle>
            <CardDescription>
              International currency stablecoins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{formatCurrency(nonUsdStats.totalMarketCap)}</div>
              <div className="flex items-center gap-2 mt-1">
                {nonUsdStats.totalChange24h >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${nonUsdStats.totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {nonUsdStats.totalChange24h >= 0 ? '+' : ''}
                  {nonUsdStats.totalChange24h.toFixed(2)}% (24h)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{nonUsdStats.count} stablecoins</div>
              <div className="grid grid-cols-2 gap-2">
                {currencyBreakdown.map((curr) => (
                  <div key={curr.currency} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm font-medium">{curr.currency}</span>
                    <Badge variant="secondary" className="text-xs">{curr.count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              {nonUsdStats.topCoins.slice(0, 2).map((coin) => (
                <Link key={coin.id} href={`/stablecoins/${coin.id}`}>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                    <span className="text-sm">{coin.symbol}</span>
                    <span className="text-xs text-muted-foreground">{formatCompact(coin.totalCirculating)}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="p-3 rounded bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
              <p className="text-xs text-purple-900 dark:text-purple-100">
                Growing sector for regional markets and cross-border payments outside USD system.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Collateral & Yield-Bearing */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Lock className="h-8 w-8 text-amber-500" />
              <Badge variant="outline">{((collateralStats.totalMarketCap / totalMarketCap) * 100).toFixed(1)}% of market</Badge>
            </div>
            <CardTitle className="mt-2">Collateral & Yield-Bearing</CardTitle>
            <CardDescription>
              Crypto-backed or yield-generating designs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{formatCurrency(collateralStats.totalMarketCap)}</div>
              <div className="flex items-center gap-2 mt-1">
                {collateralStats.totalChange24h >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${collateralStats.totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {collateralStats.totalChange24h >= 0 ? '+' : ''}
                  {collateralStats.totalChange24h.toFixed(2)}% (24h)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{collateralStats.count} stablecoins</div>
              <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <p className="text-xs text-amber-900 dark:text-amber-100">
                  <strong>Crypto-backed:</strong> Over-collateralized with crypto (e.g. DAI, LUSD)<br/>
                  <strong>Yield-bearing:</strong> Generate returns through DeFi strategies (e.g. USDe, sDAI)
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {collateralStats.topCoins.slice(0, 3).map((coin, idx) => (
                <Link key={coin.id} href={`/stablecoins/${coin.id}`}>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                    <span className="text-sm">{idx + 1}. {coin.symbol}</span>
                    <span className="text-xs text-muted-foreground">{formatCompact(coin.totalCirculating)}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Examples: DAI (crypto-backed), USDe (yield-bearing), FRAX (algorithmic)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium mb-1">💵 Fiat Dominance</div>
              <div className="text-muted-foreground">
                USD fiat-backed stablecoins (USDT, USDC) represent {((fiatStats.totalMarketCap / totalMarketCap) * 100).toFixed(1)}% of the market.
                Lowest risk, highest liquidity.
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">🌍 Regional Alternatives</div>
              <div className="text-muted-foreground">
                Non-USD fiat stablecoins enable international payments outside the dollar system.
                Growing in regions with strong local currencies.
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">🔐 DeFi Innovation</div>
              <div className="text-muted-foreground">
                Collateral-backed stablecoins offer composability and yield opportunities.
                Higher technical risk but censorship-resistant.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
