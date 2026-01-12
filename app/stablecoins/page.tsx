'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowUpDown, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { getStablecoinColor } from '@/lib/utils/colors'
import { useStablecoins } from '@/lib/hooks/useStablecoins'
import type { StablecoinWithMetrics } from '@/lib/types'

type SortField = 'totalCirculating' | 'change24h' | 'change7d' | 'change30d' | 'dominance'
type SortOrder = 'asc' | 'desc'

export default function StablecoinsPage() {
  const { data: stablecoins, isLoading } = useStablecoins()
  const [sortField, setSortField] = useState<SortField>('totalCirculating')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [search, setSearch] = useState('')
  const [pegFilter, setPegFilter] = useState<string>('all')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filteredData = (stablecoins || [])
    .filter((coin) => {
      const matchesSearch =
        coin.name.toLowerCase().includes(search.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(search.toLowerCase())
      const matchesPeg = pegFilter === 'all' || coin.pegType === pegFilter
      return matchesSearch && matchesPeg
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      return (a[sortField] - b[sortField]) * multiplier
    })

  // Get unique peg types
  const pegTypes = Array.from(new Set((stablecoins || []).map((c) => c.pegType)))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stablecoins</h1>
        <p className="text-muted-foreground mt-2">
          Track market cap, supply changes, and chain distribution for all stablecoins
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stablecoins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Tabs value={pegFilter} onValueChange={setPegFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="peggedUSD">USD</TabsTrigger>
            <TabsTrigger value="peggedEUR">EUR</TabsTrigger>
            <TabsTrigger value="peggedVAR">Yield</TabsTrigger>
          </TabsList>
        </Tabs>
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
                      Name
                    </th>
                    <th className="text-right py-4 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-muted-foreground"
                        onClick={() => handleSort('totalCirculating')}
                      >
                        Market Cap
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
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
                        onClick={() => handleSort('change30d')}
                      >
                        30d
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-right py-4 px-4 hidden md:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-muted-foreground"
                        onClick={() => handleSort('dominance')}
                      >
                        Dominance
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-right py-4 px-4 hidden xl:table-cell text-sm font-medium text-muted-foreground">
                      Chains
                    </th>
                    <th className="text-right py-4 px-4 hidden xl:table-cell text-sm font-medium text-muted-foreground">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((coin, index) => (
                    <tr
                      key={coin.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4">
                        <Link
                          href={`/stablecoins/${coin.id}`}
                          className="flex items-center gap-3 hover:text-primary transition-colors"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{
                              backgroundColor: getStablecoinColor(coin.symbol),
                            }}
                          >
                            {coin.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {coin.symbol}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatCurrency(coin.totalCirculating)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <ChangeIndicator value={coin.change24h} />
                      </td>
                      <td className="py-4 px-4 text-right hidden md:table-cell">
                        <ChangeIndicator value={coin.change7d} />
                      </td>
                      <td className="py-4 px-4 text-right hidden lg:table-cell">
                        <ChangeIndicator value={coin.change30d} />
                      </td>
                      <td className="py-4 px-4 text-right hidden md:table-cell">
                        <Badge variant="secondary">
                          {coin.dominance.toFixed(2)}%
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right hidden xl:table-cell text-sm text-muted-foreground">
                        {coin.chains.length} chains
                      </td>
                      <td className="py-4 px-4 text-right hidden xl:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {coin.pegType.replace('pegged', '')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
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
