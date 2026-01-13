'use client'

import { useState } from 'react'
import { useWhaleTransfers } from '@/lib/hooks/useDuneData'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { Fish, ArrowRight, ExternalLink, RefreshCw, Filter } from 'lucide-react'

const STABLECOIN_COLORS: Record<string, string> = {
  USDT: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  USDC: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DAI: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
}

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: 'bg-indigo-500/10 text-indigo-500',
  Tron: 'bg-red-500/10 text-red-500',
  Arbitrum: 'bg-blue-500/10 text-blue-500',
  BSC: 'bg-yellow-500/10 text-yellow-500',
  Solana: 'bg-purple-500/10 text-purple-500',
}

function getTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function WhalesPage() {
  const [minAmount, setMinAmount] = useState<number>(1000000)
  const [days, setDays] = useState<number>(7)
  const [filterCoin, setFilterCoin] = useState<string>('all')
  const [filterChain, setFilterChain] = useState<string>('all')

  const { data: transfers, isLoading, refetch, isFetching } = useWhaleTransfers(minAmount, days)

  // Filter transfers
  const filteredTransfers = transfers?.filter(t => {
    if (filterCoin !== 'all' && t.stablecoin !== filterCoin) return false
    if (filterChain !== 'all' && t.chain !== filterChain) return false
    return true
  }) || []

  // Summary stats
  const totalVolume = filteredTransfers.reduce((sum, t) => sum + t.amountUsd, 0)
  const uniqueWallets = new Set([
    ...filteredTransfers.map(t => t.fromAddress),
    ...filteredTransfers.map(t => t.toAddress),
  ]).size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Fish className="h-6 w-6" />
            Whale Watch
          </h1>
          <p className="text-muted-foreground">
            Large stablecoin transfers in real-time
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={minAmount.toString()} onValueChange={(v) => setMinAmount(parseInt(v))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Min Amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000000">$1M+</SelectItem>
                <SelectItem value="5000000">$5M+</SelectItem>
                <SelectItem value="10000000">$10M+</SelectItem>
                <SelectItem value="25000000">$25M+</SelectItem>
                <SelectItem value="50000000">$50M+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">24 Hours</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCoin} onValueChange={setFilterCoin}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Stablecoin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coins</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="DAI">DAI</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterChain} onValueChange={setFilterChain}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="Ethereum">Ethereum</SelectItem>
                <SelectItem value="Tron">Tron</SelectItem>
                <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                <SelectItem value="BSC">BSC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVolume)}</div>
            <p className="text-sm text-muted-foreground">{filteredTransfers.length} transfers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(uniqueWallets)}</div>
            <p className="text-sm text-muted-foreground">active addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredTransfers.length > 0 ? totalVolume / filteredTransfers.length : 0)}
            </div>
            <p className="text-sm text-muted-foreground">per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Large Transfers</CardTitle>
          <CardDescription>
            Transactions above {formatCurrency(minAmount)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transfers found matching your criteria
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransfers.map((transfer, index) => (
                <div
                  key={`${transfer.txHash}-${index}`}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {/* Amount & Coin */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className={`px-3 py-1.5 rounded-full text-sm font-medium border ${STABLECOIN_COLORS[transfer.stablecoin] || 'bg-muted'}`}>
                      {transfer.stablecoin}
                    </div>
                    <div className="text-xl font-bold">
                      {formatCurrency(transfer.amountUsd)}
                    </div>
                  </div>

                  {/* From -> To */}
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-muted-foreground">From</span>
                      <span className="font-mono text-sm truncate">
                        {transfer.fromLabel ? (
                          <Badge variant="outline" className="font-normal">
                            {transfer.fromLabel}
                          </Badge>
                        ) : (
                          transfer.fromAddress
                        )}
                      </span>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-muted-foreground">To</span>
                      <span className="font-mono text-sm truncate">
                        {transfer.toLabel ? (
                          <Badge variant="outline" className="font-normal">
                            {transfer.toLabel}
                          </Badge>
                        ) : (
                          transfer.toAddress
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Chain & Time */}
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={CHAIN_COLORS[transfer.chain] || ''}>
                      {transfer.chain}
                    </Badge>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {getTimeAgo(transfer.timestamp)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a
                        href={`https://etherscan.io/tx/${transfer.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
