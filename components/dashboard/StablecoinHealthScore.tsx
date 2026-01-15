'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Users, Activity } from 'lucide-react'
import { useUserEfficiencyMetrics } from '@/lib/hooks/useArtemisData'

interface HealthScoreProps {
  symbol: string
}

export function StablecoinHealthScore({ symbol }: HealthScoreProps) {
  const { data: efficiency, isLoading } = useUserEfficiencyMetrics(symbol)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!efficiency) {
    return null
  }

  // Calculate health score (0-100)
  const calculateHealthScore = (): number => {
    let score = 50 // Base score

    // User growth (max +20 points)
    if (efficiency.userGrowth30d > 20) score += 20
    else if (efficiency.userGrowth30d > 10) score += 15
    else if (efficiency.userGrowth30d > 5) score += 10
    else if (efficiency.userGrowth30d > 0) score += 5
    else if (efficiency.userGrowth30d < -10) score -= 15

    // Transactions per user (max +15 points)
    if (efficiency.avgTransactionsPerUser > 5) score += 15
    else if (efficiency.avgTransactionsPerUser > 3) score += 10
    else if (efficiency.avgTransactionsPerUser > 2) score += 5

    // Users per $1M supply - engagement (max +15 points)
    if (efficiency.usersPerMillionSupply > 5) score += 15
    else if (efficiency.usersPerMillionSupply > 3) score += 10
    else if (efficiency.usersPerMillionSupply > 1) score += 5

    return Math.min(Math.max(score, 0), 100)
  }

  const healthScore = calculateHealthScore()

  const getHealthStatus = (score: number): { label: string; color: string; icon: React.ReactNode } => {
    if (score >= 80)
      return {
        label: 'Excellent',
        color: 'text-green-500',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      }
    if (score >= 60)
      return {
        label: 'Good',
        color: 'text-blue-500',
        icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
      }
    if (score >= 40)
      return {
        label: 'Fair',
        color: 'text-yellow-500',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      }
    return {
      label: 'Concerning',
      color: 'text-red-500',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
    }
  }

  const status = getHealthStatus(healthScore)

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Adoption Health</CardTitle>
        <CardDescription>
          Quality metrics showing real user engagement and growth velocity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <div className="text-sm text-muted-foreground">Overall Health Score</div>
              <div className="flex items-center gap-3 mt-1">
                <div className={`text-3xl font-bold ${status.color}`}>{healthScore}/100</div>
                {status.icon}
                <Badge variant={healthScore >= 60 ? 'default' : 'destructive'}>{status.label}</Badge>
              </div>
            </div>
          </div>

          {/* Metrics Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            {/* User Growth */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                30d User Growth
              </div>
              <div className="text-2xl font-bold">
                {efficiency.userGrowth30d >= 0 ? '+' : ''}
                {efficiency.userGrowth30d.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {efficiency.userGrowth30d > 10
                  ? 'Strong growth'
                  : efficiency.userGrowth30d > 0
                    ? 'Moderate growth'
                    : 'Declining'}
              </div>
            </div>

            {/* Transaction Growth */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                30d Txn Growth
              </div>
              <div className="text-2xl font-bold">
                {efficiency.txnGrowth30d >= 0 ? '+' : ''}
                {efficiency.txnGrowth30d.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {efficiency.txnGrowth30d > 10
                  ? 'High activity'
                  : efficiency.txnGrowth30d > 0
                    ? 'Steady activity'
                    : 'Declining activity'}
              </div>
            </div>

            {/* Txns per User */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Txns per User
              </div>
              <div className="text-2xl font-bold">{efficiency.avgTransactionsPerUser.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">
                {efficiency.avgTransactionsPerUser > 4
                  ? 'Power users'
                  : efficiency.avgTransactionsPerUser > 2
                    ? 'Active users'
                    : 'Casual users'}
              </div>
            </div>

            {/* Users per $1M Supply */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                Users per $1M
              </div>
              <div className="text-2xl font-bold">{efficiency.usersPerMillionSupply.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">
                {efficiency.usersPerMillionSupply > 4
                  ? 'Highly distributed'
                  : efficiency.usersPerMillionSupply > 2
                    ? 'Good distribution'
                    : 'Concentrated'}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-2 border-t">
            Health score combines user growth, engagement, and distribution. Higher scores indicate stronger organic
            adoption vs speculative capital.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
