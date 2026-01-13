'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'

interface MetricCardProps {
  title: string
  value: number
  change?: number
  changeLabel?: string
  format?: 'currency' | 'number' | 'percentage'
  icon?: React.ReactNode
  loading?: boolean
  subtitle?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = '24h',
  format = 'currency',
  icon,
  loading = false,
  subtitle,
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val)
      default:
        return formatNumber(val)
    }
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-muted-foreground'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight">
          {formatValue(value)}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm mt-1',
              getChangeColor(change)
            )}
          >
            {getChangeIcon(change)}
            <span>{formatPercentage(change)}</span>
            <span className="text-muted-foreground ml-1">{changeLabel}</span>
          </div>
        )}
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MetricCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  )
}
