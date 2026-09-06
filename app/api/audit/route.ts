import { NextResponse } from 'next/server'
import { generateAuditTrail, verifyChain, summarizeAudit } from '@/lib/audit-trail'

/** Immutable audit trail with hash-chain verification. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 40)
    const count = Number.isFinite(requested) ? Math.min(300, Math.max(5, requested)) : 40

    const entries = generateAuditTrail(count)
    const integrity = verifyChain(entries)

    return NextResponse.json({
      success: true,
      summary: summarizeAudit(entries),
      integrity,
      entries,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Audit load failed', success: false }, { status: 500 })
  }
}
