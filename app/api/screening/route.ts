import { NextResponse } from 'next/server'
import { generateScreeningHits, summarizeScreening, LIST_LABELS, type ListType } from '@/lib/screening'

/** Sanctions, PEP and watchlist screening results. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 30)
    const count = Number.isFinite(requested) ? Math.min(150, Math.max(5, requested)) : 30
    const listFilter = searchParams.get('list') as ListType | null

    let hits = generateScreeningHits(count)
    if (listFilter && listFilter in LIST_LABELS) {
      hits = hits.filter(h => h.listType === listFilter)
    }

    return NextResponse.json({
      success: true,
      summary: summarizeScreening(hits),
      lists: LIST_LABELS,
      hits,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Screening failed', success: false }, { status: 500 })
  }
}
