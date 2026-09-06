import { NextResponse } from 'next/server'
import { generateSyntheticIdentities, summarizeSynthetic, SIGNAL_META } from '@/lib/synthetic-identity'

/** Synthetic identity detection results. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 20)
    const count = Number.isFinite(requested) ? Math.min(100, Math.max(5, requested)) : 20
    const confirmedOnly = searchParams.get('confirmed') === 'true'

    let identities = generateSyntheticIdentities(count)
    if (confirmedOnly) {
      identities = identities.filter(
        i => i.verdict === 'confirmed_synthetic' || i.verdict === 'probable_synthetic'
      )
    }

    return NextResponse.json({
      success: true,
      summary: summarizeSynthetic(identities),
      signals: SIGNAL_META,
      identities,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Synthetic scan failed', success: false }, { status: 500 })
  }
}
