'use client'

import { useState } from 'react'
import { usePegStability, useTopHolders } from '@/lib/hooks/useDuneData'
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/format'
import { Shield, AlertTriangle, CheckCircle, Users } from 'lucide-react'

const STABLECOIN_COLORS: Record<string, string> = {
  USDT: '#26A17B',
  USDC: '#2775CA',
  DAI: '#F5AC37',
  USDS: '#1BAF91',
}

export default function RiskPage() {
  const [selectedStablecoin, setSelectedStablecoin] = useState<string>('USDT')
  const [timeframe, setTimeframe] = useState<number>(30)

  const { data: pegData, isLoading: pegLoading } = usePegStability(undefined, timeframe)
  const { data: holdersData, isLoading: holdersLoading } = useTopHolders(selectedStablecoin, 20)

  // Get latest peg status for each stablecoin
  const pegStatus = ['USDT', 'USDC', 'DAI', 'USDS'].map(coin => {
    const coinData = pegData?.filter(p => p.stablecoin === coin) || []
    const latest = coinData[0]
    const maxDeviation = Math.max(...coinData.map(p => Math.abs(p.deviation)), 0)
    return {
      coin,
      price: latest?.price || 1,
      deviation: latest?.deviation || 0,
      maxDeviation,
      status: maxDeviation < 0.1 ? 'healthy' : maxDeviation < 0.5 ? 'warning' : 'critical',
    }
  })

  // Prepare peg chart data for selected stablecoin
  const pegChartData = pegData
    ?.filter(p => p.stablecoin === selectedStablecoin)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(p => ({
      time: p.timestamp,
      price: p.price,
      deviation: p.deviation,
    })) || []

  // Holder concentration metrics
  const top5Concentration = holdersData?.slice(0, 5).reduce((sum, h) => sum + h.percentOfSupply, 0) || 0
  const top10Concentration = holdersData?.slice(0, 10).reduce((sum, h) => sum + h.percentOfSupply, 0) || 0
  const top20Concentration = holdersData?.slice(0, 20).reduce((sum, h) => sum + h.percentOfSupply, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk Monitoring</h1>
          <p className="text-muted-foreground">
            Peg stability, holder concentration, and compliance metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedStablecoin} onValueChange={setSelectedStablecoin}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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

      {/* Peg Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Peg Status Overview
          </CardTitle>
          <CardDescription>
            Current price deviation from $1.00 peg
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {pegStatus.map(({ coin, price, deviation, status }) => (
              <div
                key={coin}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div>
                  <div className="font-semibold">{coin}</div>
                  <div className="text-2xl font-bold">${price.toFixed(4)}</div>
                  <div className="text-sm text-muted-foreground">
                    {deviation >= 0 ? '+' : ''}{deviation.toFixed(3)}%
                  </div>
                </div>
                <div>
                  {status === 'healthy' && (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  )}
                  {status === 'warning' && (
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  )}
                  {status === 'critical' && (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="peg" className="space-y-4">
        <TabsList>
          <TabsTrigger value="peg">Peg Stability</TabsTrigger>
          <TabsTrigger value="concentration">Holder Concentration</TabsTrigger>
          <TabsTrigger value="holders">Top Holders</TabsTrigger>
        </TabsList>

        <TabsContent value="peg">
          <Card>
            <CardHeader>
              <CardTitle>{selectedStablecoin} Price History</CardTitle>
              <CardDescription>
                Historical price deviation from $1.00 peg
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pegLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={pegChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis
                      domain={[0.995, 1.005]}
                      tickFormatter={(v) => `$${v.toFixed(3)}`}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <ReferenceLine y={1} stroke="#888" strokeDasharray="5 5" label="$1.00" />
                    <ReferenceLine y={1.001} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={0.999} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={STABLECOIN_COLORS[selectedStablecoin] || '#3b82f6'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concentration">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top 5 Holders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {top5Concentration.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  of total supply
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top 10 Holders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {top10Concentration.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  of total supply
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top 20 Holders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {top20Concentration.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  of total supply
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Concentration Distribution</CardTitle>
              <CardDescription>
                Supply held by top holders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {holdersLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={holdersData?.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `${v.toFixed(1)}%`} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tickFormatter={(v) => v || 'Unknown'}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Supply']}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="percentOfSupply" radius={[0, 4, 4, 0]}>
                      {holdersData?.slice(0, 10).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index < 3 ? '#ef4444' : index < 6 ? '#f59e0b' : '#22c55e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top {selectedStablecoin} Holders
              </CardTitle>
              <CardDescription>
                Largest wallet addresses by balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {holdersLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                        <th className="pb-3 pr-4">Rank</th>
                        <th className="pb-3 pr-4">Address</th>
                        <th className="pb-3 pr-4">Label</th>
                        <th className="pb-3 pr-4 text-right">Balance</th>
                        <th className="pb-3 text-right">% Supply</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdersData?.map((holder, index) => (
                        <tr key={holder.address} className="border-b">
                          <td className="py-3 pr-4 font-medium">{index + 1}</td>
                          <td className="py-3 pr-4 font-mono text-sm">
                            {holder.address}
                          </td>
                          <td className="py-3 pr-4">
                            {holder.label ? (
                              <Badge variant="secondary">{holder.label}</Badge>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-right font-medium">
                            {formatCurrency(holder.balanceUsd)}
                          </td>
                          <td className="py-3 text-right">
                            <Badge
                              variant={
                                holder.percentOfSupply > 5
                                  ? 'destructive'
                                  : holder.percentOfSupply > 2
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {holder.percentOfSupply.toFixed(2)}%
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
