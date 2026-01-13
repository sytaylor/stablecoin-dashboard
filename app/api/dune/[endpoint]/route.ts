import { NextRequest, NextResponse } from 'next/server'
import {
  fetchMintBurnEvents,
  fetchWhaleTransfers,
  fetchActiveAddresses,
  fetchTransferVolume,
  fetchPegStability,
  fetchTopHolders,
} from '@/lib/api/dune'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await params
  const searchParams = request.nextUrl.searchParams

  try {
    switch (endpoint) {
      case 'mint-burn': {
        const stablecoin = searchParams.get('stablecoin') || undefined
        const days = parseInt(searchParams.get('days') || '30')
        const data = await fetchMintBurnEvents(stablecoin, days)
        return NextResponse.json(data)
      }

      case 'whale-transfers': {
        const minAmount = parseInt(searchParams.get('minAmount') || '1000000')
        const days = parseInt(searchParams.get('days') || '7')
        const data = await fetchWhaleTransfers(minAmount, days)
        return NextResponse.json(data)
      }

      case 'active-addresses': {
        const stablecoin = searchParams.get('stablecoin') || undefined
        const days = parseInt(searchParams.get('days') || '30')
        const data = await fetchActiveAddresses(stablecoin, days)
        return NextResponse.json(data)
      }

      case 'transfer-volume': {
        const stablecoin = searchParams.get('stablecoin') || undefined
        const days = parseInt(searchParams.get('days') || '30')
        const data = await fetchTransferVolume(stablecoin, days)
        return NextResponse.json(data)
      }

      case 'peg-stability': {
        const stablecoin = searchParams.get('stablecoin') || undefined
        const days = parseInt(searchParams.get('days') || '30')
        const data = await fetchPegStability(stablecoin, days)
        return NextResponse.json(data)
      }

      case 'top-holders': {
        const stablecoin = searchParams.get('stablecoin')
        if (!stablecoin) {
          return NextResponse.json({ error: 'stablecoin parameter required' }, { status: 400 })
        }
        const limit = parseInt(searchParams.get('limit') || '100')
        const data = await fetchTopHolders(stablecoin, limit)
        return NextResponse.json(data)
      }

      case 'summary': {
        // Aggregate summary metrics
        const [mintBurn, whales, addresses, volume, peg] = await Promise.all([
          fetchMintBurnEvents(undefined, 1),
          fetchWhaleTransfers(1000000, 1),
          fetchActiveAddresses(undefined, 1),
          fetchTransferVolume(undefined, 1),
          fetchPegStability(undefined, 1),
        ])

        const mints = mintBurn.filter(e => e.type === 'mint')
        const burns = mintBurn.filter(e => e.type === 'burn')
        const totalMints = mints.reduce((sum, e) => sum + e.amountUsd, 0)
        const totalBurns = burns.reduce((sum, e) => sum + e.amountUsd, 0)

        const summary = {
          totalDailyVolume: volume.reduce((sum, v) => sum + v.volume, 0),
          dailyActiveAddresses: addresses.reduce((sum, a) => sum + a.dailyActive, 0),
          dailyMints: totalMints,
          dailyBurns: totalBurns,
          netSupplyChange: totalMints - totalBurns,
          largeTransfers24h: whales.length,
          avgPegDeviation: peg.length > 0
            ? peg.reduce((sum, p) => sum + Math.abs(p.deviation), 0) / peg.length
            : 0,
        }

        return NextResponse.json(summary)
      }

      default:
        return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 })
    }
  } catch (error) {
    console.error(`Dune API error (${endpoint}):`, error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
