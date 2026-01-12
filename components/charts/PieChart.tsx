'use client'

import { useMemo } from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { CHART_COLORS } from '@/lib/utils/colors'

interface PieChartData {
  name: string
  value: number
  color?: string
}

interface DonutChartProps {
  data: PieChartData[]
  title?: string
  loading?: boolean
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
}

export function DonutChart({
  data,
  title,
  loading = false,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
}: DonutChartProps) {
  const chartData = useMemo(() => {
    if (!data?.length) return []
    const total = data.reduce((sum, item) => sum + item.value, 0)
    return data.map((item, i) => ({
      ...item,
      percentage: (item.value / total) * 100,
      color: item.color || CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [data])

  if (loading) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
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
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="font-medium">{data.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(data.value)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPercentage(data.percentage).replace('+', '')}
                      </p>
                    </div>
                  )
                }}
              />
              {showLegend && (
                <Legend
                  formatter={(value) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
              )}
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
