import { NextRequest, NextResponse } from 'next/server'
import { fetchArtemisUserMetrics } from '@/lib/api/artemis'

export const revalidate = 300 // 5-minute cache

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  const days = parseInt(searchParams.get('days') || '30')

  if (!symbol) {
    return NextResponse.json(
      { error: 'symbol parameter is required' },
      { status: 400 }
    )
  }

  try {
    const data = await fetchArtemisUserMetrics(symbol, days)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching Artemis user metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user metrics' },
      { status: 500 }
    )
  }
}
