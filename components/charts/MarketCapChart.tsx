'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatCompactNumber } from '@/lib/utils/format'
import { CHART_COLORS } from '@/lib/utils/colors'

interface ChartDataPoint {
  date: number
  [key: string]: number
}

interface MarketCapChartProps {
  data: ChartDataPoint[]
  title?: string
  loading?: boolean
  stacked?: boolean
  series?: string[]
}

export function MarketCapChart({
  data,
  title = 'Market Cap',
  loading = false,
  stacked = false,
  series = ['value'],
}: MarketCapChartProps) {
  const chartData = useMemo(() => {
    if (!data?.length) return []
    return data.map((item) => ({
      ...item,
      dateLabel: formatDate(item.date),
    }))
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {series.map((s, i) => (
                  <linearGradient
                    key={s}
                    id={`gradient-${s}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(value) => formatCompactNumber(value)}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={60}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="text-sm font-medium mb-2">{label}</p>
                      {payload.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-muted-foreground">
                            {item.name}:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {series.length > 1 && <Legend />}
              {series.map((s, i) => (
                <Area
                  key={s}
                  type="monotone"
                  dataKey={s}
                  name={s === 'value' ? 'Market Cap' : s}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={`url(#gradient-${s})`}
                  strokeWidth={2}
                  stackId={stacked ? 'stack' : undefined}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
