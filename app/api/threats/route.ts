import { NextResponse } from 'next/server'
import {
  generateThreatReports,
  summarizeThreats,
  CATEGORY_META,
  type ThreatCategory,
} from '@/lib/threat-intel'

/** External threat intelligence correlated against internal indicators. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 12)
    const count = Number.isFinite(requested) ? Math.min(60, Math.max(3, requested)) : 12
    const categoryFilter = searchParams.get('category') as ThreatCategory | null

    let reports = generateThreatReports(count)
    if (categoryFilter && categoryFilter in CATEGORY_META) {
      reports = reports.filter(r => r.category === categoryFilter)
    }

    return NextResponse.json({
      success: true,
      summary: summarizeThreats(reports),
      categories: CATEGORY_META,
      reports,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Threat feed failed', success: false }, { status: 500 })
  }
}
