'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Users, Activity } from 'lucide-react'
import { useArtemisMultiCoinMetrics } from '@/lib/hooks/useArtemisData'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCompact } from '@/lib/utils/format'

interface UserAdoptionCardProps {
  symbols?: string[]
  days?: number
}

export function UserAdoptionCard({ symbols = ['usdc', 'usdt', 'dai'], days = 30 }: UserAdoptionCardProps) {
  const { data: metricsData, isLoading } = useArtemisMultiCoinMetrics(symbols, days)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!metricsData || metricsData.length === 0) {
    return null
  }

  // Transform data for chart - combine all stablecoins
  const chartData: any[] = []
  const allDates = new Set<string>()

  // Collect all dates
  metricsData.forEach(metrics => {
    metrics.dau.forEach(point => allDates.add(point.date))
  })

  // Build chart data structure
  const sortedDates = Array.from(allDates).sort()
  sortedDates.forEach(date => {
    const dataPoint: any = { date }

    metricsData.forEach(metrics => {
      const dauPoint = metrics.dau.find(p => p.date === date)
      if (dauPoint) {
        dataPoint[metrics.symbol.toUpperCase()] = dauPoint.value
      }
    })

    chartData.push(dataPoint)
  })

  // Calculate growth for each stablecoin
  const growthMetrics = metricsData.map(metrics => {
    const latest = metrics.dau[metrics.dau.length - 1]?.value || 0
    const oldest = metrics.dau[0]?.value || latest
    const growth = oldest > 0 ? ((latest - oldest) / oldest) * 100 : 0

    return {
      symbol: metrics.symbol.toUpperCase(),
      latest,
      growth,
    }
  })

  const colors: Record<string, string> = {
    USDC: '#2775CA',
    USDT: '#26A17B',
    DAI: '#F5AC37',
    USDE: '#9333EA',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Adoption Trends
            </CardTitle>
            <CardDescription>
              Daily active wallets - real user growth, not just market cap
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            Powered by Artemis
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Growth Summary */}
          <div className="grid grid-cols-3 gap-4">
            {growthMetrics.map(metric => (
              <div key={metric.symbol} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[metric.symbol] || '#888' }}
                  />
                  <span className="text-sm font-medium">{metric.symbol}</span>
                </div>
                <div className="text-2xl font-bold">{formatCompact(metric.latest)}</div>
                <div className="flex items-center gap-1 text-sm">
                  {metric.growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={metric.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {metric.growth >= 0 ? '+' : ''}
                    {metric.growth.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">30d</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => formatCompact(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => formatCompact(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                {metricsData.map(metrics => (
                  <Line
                    key={metrics.symbol}
                    type="monotone"
                    dataKey={metrics.symbol.toUpperCase()}
                    stroke={colors[metrics.symbol.toUpperCase()] || '#888'}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-muted-foreground">
            DAU shows unique wallet addresses that had at least 1 transaction. Growing DAU indicates real adoption vs just supply growth.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
