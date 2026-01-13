import { NextRequest, NextResponse } from 'next/server'
import { calculateAdjustedVolume } from '@/lib/api/artemis'

export const revalidate = 300 // 5-minute cache

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rawVolume = parseFloat(searchParams.get('rawVolume') || '0')

  if (!rawVolume || rawVolume <= 0) {
    return NextResponse.json(
      { error: 'rawVolume parameter is required and must be positive' },
      { status: 400 }
    )
  }

  try {
    const metrics = calculateAdjustedVolume(rawVolume)
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error calculating adjusted volume:', error)
    return NextResponse.json(
      { error: 'Failed to calculate adjusted volume' },
      { status: 500 }
    )
  }
}
