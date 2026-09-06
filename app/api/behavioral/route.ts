import { NextResponse } from 'next/server'
import { generateBehaviorProfiles, summarizeBehavior } from '@/lib/behavioral'

/** Return behavioural profiles with drift scores against each account's baseline. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 14)
    const count = Number.isFinite(requested) ? Math.min(60, Math.max(1, requested)) : 14
    const driftingOnly = searchParams.get('drifting') === 'true'

    let profiles = generateBehaviorProfiles(count)
    if (driftingOnly) {
      profiles = profiles.filter(p => p.driftDetected)
    }

    return NextResponse.json({
      success: true,
      summary: summarizeBehavior(profiles),
      profiles,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Behavioral analysis failed', success: false },
      { status: 500 }
    )
  }
}
