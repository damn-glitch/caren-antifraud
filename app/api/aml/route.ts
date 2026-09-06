import { NextResponse } from 'next/server'
import {
  generateAMLPatterns,
  summarizeAML,
  AML_TYPOLOGIES,
  type AMLPatternType,
} from '@/lib/aml-detection'

/** Return detected AML patterns, optionally filtered by typology. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 24)
    const count = Number.isFinite(requested) ? Math.min(120, Math.max(8, requested)) : 24
    const typeFilter = searchParams.get('type') as AMLPatternType | null

    let patterns = generateAMLPatterns(count)
    if (typeFilter && typeFilter in AML_TYPOLOGIES) {
      patterns = patterns.filter(p => p.type === typeFilter)
    }

    return NextResponse.json({
      success: true,
      summary: summarizeAML(patterns),
      typologies: AML_TYPOLOGIES,
      patterns,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'AML scan failed', success: false },
      { status: 500 }
    )
  }
}
