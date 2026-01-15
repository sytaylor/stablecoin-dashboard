import { NextRequest, NextResponse } from 'next/server'
import { fetchArtemisDailyTxns } from '@/lib/api/artemis'

export const revalidate = 300 // 5-minute cache

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!symbol || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'symbol, startDate, and endDate parameters are required' },
      { status: 400 }
    )
  }

  try {
    const data = await fetchArtemisDailyTxns(symbol, startDate, endDate)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching Artemis daily transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily transactions data' },
      { status: 500 }
    )
  }
}
