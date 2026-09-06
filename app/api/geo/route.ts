import { NextResponse } from 'next/server'
import {
  generateTravelEvents,
  generateJurisdictionExposure,
  summarizeGeo,
  CITIES,
} from '@/lib/geo-intelligence'

/** Impossible-travel events and jurisdiction exposure. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 16)
    const count = Number.isFinite(requested) ? Math.min(80, Math.max(4, requested)) : 16
    const impossibleOnly = searchParams.get('impossible') === 'true'

    let events = generateTravelEvents(count)
    if (impossibleOnly) {
      events = events.filter(e => e.verdict === 'impossible')
    }

    const exposure = generateJurisdictionExposure()

    return NextResponse.json({
      success: true,
      summary: summarizeGeo(events, exposure),
      cities: CITIES,
      exposure,
      events,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Geo analysis failed', success: false }, { status: 500 })
  }
}
