import { NextResponse } from 'next/server'
import { generateFraudRings, summarizeRings } from '@/lib/fraud-rings'

/** Return detected fraud rings with their link-analysis graphs. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 5)
    const count = Number.isFinite(requested) ? Math.min(12, Math.max(1, requested)) : 5

    const rings = generateFraudRings(count)

    return NextResponse.json({
      success: true,
      summary: summarizeRings(rings),
      rings,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Ring detection failed', success: false },
      { status: 500 }
    )
  }
}
