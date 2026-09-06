import { NextResponse } from 'next/server'
import { generateAffiliatePartners, summarizeAffiliates, SCHEME_META } from '@/lib/affiliate-fraud'

/** Partner and affiliate fraud detection results. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 18)
    const count = Number.isFinite(requested) ? Math.min(90, Math.max(4, requested)) : 18
    const flaggedOnly = searchParams.get('flagged') === 'true'

    let partners = generateAffiliatePartners(count)
    if (flaggedOnly) {
      partners = partners.filter(p => p.schemes.length > 0)
    }

    return NextResponse.json({
      success: true,
      summary: summarizeAffiliates(partners),
      schemes: SCHEME_META,
      partners,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Affiliate scan failed', success: false }, { status: 500 })
  }
}
