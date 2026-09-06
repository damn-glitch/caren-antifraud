import { NextResponse } from 'next/server'
import { generateSARDrafts, generateSARDraft, summarizeSAR, REGIME_META } from '@/lib/sar-generator'

/** Existing SAR drafts with filing deadlines. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 10)
    const count = Number.isFinite(requested) ? Math.min(60, Math.max(1, requested)) : 10

    const drafts = generateSARDrafts(count)

    return NextResponse.json({
      success: true,
      summary: summarizeSAR(drafts),
      regimes: REGIME_META,
      drafts,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'SAR load failed', success: false }, { status: 500 })
  }
}

/** Draft a new SAR narrative from case evidence. */
export async function POST() {
  try {
    const draft = generateSARDraft()

    return NextResponse.json({
      success: true,
      draft,
      meta: {
        generatedInSeconds: Number(draft.generatedInSeconds.toFixed(1)),
        manualEstimateHours: Number(draft.manualEstimateHours.toFixed(1)),
        sectionCount: draft.sections.length,
      },
    })
  } catch {
    return NextResponse.json({ error: 'SAR generation failed', success: false }, { status: 500 })
  }
}
