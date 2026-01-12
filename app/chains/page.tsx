'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowUpDown, Search, Plus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils/format'
import { getChainColor } from '@/lib/utils/colors'
import { useChains } from '@/lib/hooks/useStablecoins'
import { useDashboardStore } from '@/stores/dashboard'
import type { ChainWithMetrics } from '@/lib/types'

type SortField = 'totalStablecoinUSD' | 'change24h' | 'change7d' | 'stablecoinCount'
type SortOrder = 'asc' | 'desc'

export default function ChainsPage() {
  const { data: chains, isLoading } = useChains()
  const [sortField, setSortField] = useState<SortField>('totalStablecoinUSD')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [search, setSearch] = useState('')

  const { comparisonChains, addComparisonChain, removeComparisonChain } =
    useDashboardStore()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filteredData = (chains || [])
    .filter((chain) =>
      chain.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      return (a[sortField] - b[sortField]) * multiplier
    })

  const totalMarketCap = (chains || []).reduce(
    (sum, chain) => sum + chain.totalStablecoinUSD,
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chains</h1>
        <p className="text-muted-foreground mt-2">
          Compare stablecoin adoption and growth across blockchains
        </p>
      </div>

      {/* Comparison Section */}
      {comparisonChains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chain Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {comparisonChains.map((chain) => (
                <Badge
                  key={chain}
                  variant="secondary"
                  className="pl-3 pr-1 py-1 flex items-center gap-2"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getChainColor(chain) }}
                  />
                  {chain}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full"
                    onClick={() => removeComparisonChain(chain)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {comparisonChains.map((chainName) => {
                const chain = chains?.find((c) => c.name === chainName)
                if (!chain) return null
                return (
                  <div
                    key={chainName}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: getChainColor(chainName) }}
                  >
                    <p className="text-sm text-muted-foreground">{chainName}</p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(chain.totalStablecoinUSD)}
                    </p>
                    <ChangeIndicator value={chain.change24h} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search chains..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                      Chain
                    </th>
                    <th className="text-right py-4 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-muted-foreground"
                        onClick={() => handleSort('totalStablecoinUSD')}
                      >
                        Stablecoin TVL
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-right py-4 px-4 hidden md:table-cell text-sm font-medium text-muted-foreground">
                      Dominance
                    </th>
                    <th className="text-right py-4 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-muted-foreground"
                        onClick={() => handleSort('change24h')}
                      >
                        24h
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-right py-4 px-4 hidden md:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-muted-foreground"
                        onClick={() => handleSort('change7d')}
                      >
                        7d
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-right py-4 px-4 hidden lg:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-muted-foreground"
                        onClick={() => handleSort('stablecoinCount')}
                      >
                        Stablecoins
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-right py-4 px-4 hidden xl:table-cell text-sm font-medium text-muted-foreground">
                      Top Stablecoin
                    </th>
                    <th className="py-4 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((chain, index) => {
                    const dominance = (chain.totalStablecoinUSD / totalMarketCap) * 100
                    const isInComparison = comparisonChains.includes(chain.name)

                    return (
                      <tr
                        key={chain.name}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/chains/${encodeURIComponent(chain.name)}`}
                            className="flex items-center gap-3 hover:text-primary transition-colors"
                          >
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{
                                backgroundColor: getChainColor(chain.name),
                              }}
                            >
                              {chain.name.slice(0, 2)}
                            </div>
                            <span className="font-medium">{chain.name}</span>
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          {formatCurrency(chain.totalStablecoinUSD)}
                        </td>
                        <td className="py-4 px-4 text-right hidden md:table-cell">
                          <Badge variant="secondary">
                            {dominance.toFixed(2)}%
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <ChangeIndicator value={chain.change24h} />
                        </td>
                        <td className="py-4 px-4 text-right hidden md:table-cell">
                          <ChangeIndicator value={chain.change7d} />
                        </td>
                        <td className="py-4 px-4 text-right hidden lg:table-cell text-sm text-muted-foreground">
                          {chain.stablecoinCount}
                        </td>
                        <td className="py-4 px-4 text-right hidden xl:table-cell text-sm">
                          {chain.topStablecoins[0] && (
                            <span className="text-muted-foreground">
                              {chain.topStablecoins[0].symbol}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              isInComparison
                                ? removeComparisonChain(chain.name)
                                : addComparisonChain(chain.name)
                            }
                            disabled={
                              !isInComparison && comparisonChains.length >= 4
                            }
                          >
                            {isInComparison ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ChangeIndicator({ value }: { value: number }) {
  const isPositive = value > 0
  const isNegative = value < 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        isPositive && 'text-green-500',
        isNegative && 'text-red-500',
        !isPositive && !isNegative && 'text-muted-foreground'
      )}
    >
      {isPositive && <TrendingUp className="h-3 w-3" />}
      {isNegative && <TrendingDown className="h-3 w-3" />}
      {formatPercentage(value)}
    </span>
  )
}
