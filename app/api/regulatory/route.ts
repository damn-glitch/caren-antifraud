import { NextResponse } from 'next/server'
import {
  generateRegulatoryChanges,
  summarizeRegulatory,
  JURISDICTION_LABELS,
  type Jurisdiction,
} from '@/lib/regulatory'

/** Regulatory change radar with impact assessment and rule adjustments. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction | null

    let changes = generateRegulatoryChanges()
    if (jurisdiction && jurisdiction in JURISDICTION_LABELS) {
      changes = changes.filter(c => c.jurisdiction === jurisdiction)
    }

    return NextResponse.json({
      success: true,
      summary: summarizeRegulatory(changes),
      jurisdictions: JURISDICTION_LABELS,
      changes,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Regulatory scan failed', success: false }, { status: 500 })
  }
}
