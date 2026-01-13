'use client'

import { useState } from 'react'
import { useTransferVolume, useActiveAddresses } from '@/lib/hooks/useDuneData'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { formatCurrency, formatNumber, formatCompact } from '@/lib/utils/format'
import { Activity, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function ActivityPage() {
  const [selectedStablecoin, setSelectedStablecoin] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<number>(30)

  const stablecoinParam = selectedStablecoin === 'all' ? undefined : selectedStablecoin

  const { data: volumeData, isLoading: volumeLoading } = useTransferVolume(stablecoinParam, timeframe)
  const { data: addressData, isLoading: addressLoading } = useActiveAddresses(stablecoinParam, timeframe)

  // Aggregate data by date for charts
  const volumeByDate = volumeData?.reduce((acc, item) => {
    const existing = acc.find(a => a.date === item.date)
    if (existing) {
      existing.volume += item.volume
      existing.txCount += item.txCount
    } else {
      acc.push({ date: item.date, volume: item.volume, txCount: item.txCount })
    }
    return acc
  }, [] as { date: string; volume: number; txCount: number }[])?.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ) || []

  const addressByDate = addressData?.reduce((acc, item) => {
    const existing = acc.find(a => a.date === item.date)
    if (existing) {
      existing.dailyActive += item.dailyActive
      existing.newAddresses += item.newAddresses
    } else {
      acc.push({
        date: item.date,
        dailyActive: item.dailyActive,
        weeklyActive: item.weeklyActive,
        newAddresses: item.newAddresses,
      })
    }
    return acc
  }, [] as { date: string; dailyActive: number; weeklyActive: number; newAddresses: number }[])?.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ) || []

  // Calculate summary metrics
  const totalVolume = volumeByDate.reduce((sum, d) => sum + d.volume, 0)
  const totalTx = volumeByDate.reduce((sum, d) => sum + d.txCount, 0)
  const avgDailyVolume = volumeByDate.length > 0 ? totalVolume / volumeByDate.length : 0
  const latestAddresses = addressByDate[addressByDate.length - 1]?.dailyActive || 0
  const prevAddresses = addressByDate[addressByDate.length - 2]?.dailyActive || latestAddresses
  const addressChange = prevAddresses > 0 ? ((latestAddresses - prevAddresses) / prevAddresses) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">On-Chain Activity</h1>
          <p className="text-muted-foreground">
            Transfer volume, active addresses, and transaction metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedStablecoin} onValueChange={setSelectedStablecoin}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Stablecoin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stablecoins</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
              <SelectItem value="DAI">DAI</SelectItem>
              <SelectItem value="USDS">USDS</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeframe.toString()} onValueChange={(v) => setTimeframe(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Volume ({timeframe}d)
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {volumeLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatCompact(totalVolume)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Daily Volume
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {volumeLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatCompact(avgDailyVolume)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {volumeLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatNumber(totalTx)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Active Addresses
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {addressLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatNumber(latestAddresses)}</span>
                <Badge variant={addressChange >= 0 ? 'default' : 'destructive'} className="text-xs">
                  {addressChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {Math.abs(addressChange).toFixed(1)}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="volume" className="space-y-4">
        <TabsList>
          <TabsTrigger value="volume">Transfer Volume</TabsTrigger>
          <TabsTrigger value="addresses">Active Addresses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle>Daily Transfer Volume</CardTitle>
              <CardDescription>
                On-chain stablecoin transfer volume over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {volumeLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={volumeByDate}>
                    <defs>
                      <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompact(v)}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Volume']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#volumeGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Daily Active Addresses</CardTitle>
              <CardDescription>
                Unique addresses interacting with stablecoins
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addressLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={addressByDate}>
                    <defs>
                      <linearGradient id="addressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompact(v)}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatNumber(value), 'Addresses']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="dailyActive"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#addressGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Daily Transaction Count</CardTitle>
              <CardDescription>
                Number of stablecoin transactions per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {volumeLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={volumeByDate}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompact(v)}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatNumber(value), 'Transactions']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="txCount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
