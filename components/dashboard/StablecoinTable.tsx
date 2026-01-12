'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { getStablecoinColor } from '@/lib/utils/colors'
import type { StablecoinWithMetrics } from '@/lib/types'

interface StablecoinTableProps {
  data: StablecoinWithMetrics[]
  loading?: boolean
  limit?: number
  showViewAll?: boolean
}

type SortField = 'totalCirculating' | 'change24h' | 'change7d' | 'dominance'
type SortOrder = 'asc' | 'desc'

export function StablecoinTable({
  data,
  loading = false,
  limit,
  showViewAll = true,
}: StablecoinTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalCirculating')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedData = [...(data || [])].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1
    return (a[sortField] - b[sortField]) * multiplier
  })

  const displayData = limit ? sortedData.slice(0, limit) : sortedData

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Stablecoins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: limit || 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Stablecoins</CardTitle>
        {showViewAll && (
          <Link href="/stablecoins">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  #
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-right py-3 px-2">
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
                <th className="text-right py-3 px-2">
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
                <th className="text-right py-3 px-2">
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
                <th className="text-right py-3 px-2 hidden md:table-cell">
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
                <th className="text-right py-3 px-2 hidden lg:table-cell text-sm font-medium text-muted-foreground">
                  Chains
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((coin, index) => (
                <tr
                  key={coin.id}
                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="py-4 px-2 text-sm text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="py-4 px-2">
                    <Link
                      href={`/stablecoins/${coin.id}`}
                      className="flex items-center gap-3 hover:text-primary transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: getStablecoinColor(coin.symbol) }}
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
                  <td className="py-4 px-2 text-right font-medium">
                    {formatCurrency(coin.totalCirculating)}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <ChangeIndicator value={coin.change24h} />
                  </td>
                  <td className="py-4 px-2 text-right">
                    <ChangeIndicator value={coin.change7d} />
                  </td>
                  <td className="py-4 px-2 text-right hidden md:table-cell">
                    <Badge variant="secondary">
                      {coin.dominance.toFixed(2)}%
                    </Badge>
                  </td>
                  <td className="py-4 px-2 text-right hidden lg:table-cell text-sm text-muted-foreground">
                    {coin.chains.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
