'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowUpDown, Search, GitBranch, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard, MetricCardGrid } from '@/components/dashboard/MetricCard'
import { BridgeFlowSankey } from '@/components/visualizations/BridgeFlowSankey'
import { ChainNetworkGraph } from '@/components/visualizations/ChainNetworkGraph'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import {
  useBridges,
  useBridgeFlowData,
  useNetworkGraphData,
  useBridgeMetrics,
} from '@/lib/hooks/useBridges'
import type { BridgeWithMetrics } from '@/lib/types'

type SortField = 'lastDailyVolume' | 'weeklyVolume' | 'monthlyVolume' | 'change24h'
type SortOrder = 'asc' | 'desc'

export default function BridgesPage() {
  const { data: bridges, isLoading: bridgesLoading } = useBridges()
  const { data: flowData, isLoading: flowLoading } = useBridgeFlowData()
  const { data: networkData, isLoading: networkLoading } = useNetworkGraphData()
  const { data: metrics, isLoading: metricsLoading } = useBridgeMetrics()

  const [sortField, setSortField] = useState<SortField>('lastDailyVolume')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('sankey')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filteredBridges = (bridges || [])
    .filter((bridge) =>
      bridge.displayName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      return (a[sortField] - b[sortField]) * multiplier
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bridge Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Visualize cross-chain stablecoin flows and bridge activity
        </p>
      </div>

      {/* Key Metrics */}
      <MetricCardGrid>
        <MetricCard
          title="24h Bridge Volume"
          value={metrics?.totalDailyVolume || 0}
          change={metrics?.change24h}
          format="currency"
          icon={<GitBranch className="h-5 w-5" />}
          loading={metricsLoading}
        />
        <MetricCard
          title="7d Bridge Volume"
          value={metrics?.totalWeeklyVolume || 0}
          format="currency"
          icon={<Activity className="h-5 w-5" />}
          loading={metricsLoading}
        />
        <MetricCard
          title="Active Bridges"
          value={metrics?.bridgeCount || 0}
          format="number"
          icon={<GitBranch className="h-5 w-5" />}
          loading={metricsLoading}
        />
        <MetricCard
          title="Connected Chains"
          value={metrics?.activeChains || 0}
          format="number"
          icon={<Activity className="h-5 w-5" />}
          loading={metricsLoading}
        />
      </MetricCardGrid>

      {/* Flow Visualizations */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="sankey">Sankey Flow</TabsTrigger>
              <TabsTrigger value="network">Network Graph</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {activeTab === 'sankey' && (
            <div className="p-6">
              <BridgeFlowSankey
                data={flowData || { nodes: [], links: [] }}
                loading={flowLoading}
                height={500}
              />
            </div>
          )}
          {activeTab === 'network' && (
            <div className="p-6">
              <ChainNetworkGraph
                data={networkData || { nodes: [], links: [] }}
                loading={networkLoading}
                height={500}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bridge Leaderboard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bridge Leaderboard</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bridges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {bridgesLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
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
                      Bridge
                    </th>
                    <th className="text-right py-4 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-muted-foreground"
                        onClick={() => handleSort('lastDailyVolume')}
                      >
                        24h Volume
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
                        24h Change
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-right py-4 px-4 hidden md:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-muted-foreground"
                        onClick={() => handleSort('weeklyVolume')}
                      >
                        7d Volume
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-right py-4 px-4 hidden lg:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-muted-foreground"
                        onClick={() => handleSort('monthlyVolume')}
                      >
                        30d Volume
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-right py-4 px-4 hidden xl:table-cell text-sm font-medium text-muted-foreground">
                      Chains
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBridges.slice(0, 25).map((bridge, index) => (
                    <tr
                      key={bridge.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <GitBranch className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{bridge.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              {bridge.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatCurrency(bridge.lastDailyVolume)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <ChangeIndicator value={bridge.change24h} />
                      </td>
                      <td className="py-4 px-4 text-right hidden md:table-cell text-sm">
                        {formatCurrency(bridge.weeklyVolume)}
                      </td>
                      <td className="py-4 px-4 text-right hidden lg:table-cell text-sm">
                        {formatCurrency(bridge.monthlyVolume)}
                      </td>
                      <td className="py-4 px-4 text-right hidden xl:table-cell">
                        <Badge variant="secondary">
                          {bridge.chains.length} chains
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
