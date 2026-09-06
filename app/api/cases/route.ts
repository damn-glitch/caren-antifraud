import { NextResponse } from 'next/server'
import { generateCases, summarizeCases, workloadByAssignee, type CaseStage } from '@/lib/case-management'

const STAGES: CaseStage[] = ['triage', 'investigating', 'pending_review', 'escalated', 'closed']

/** Investigation case board with SLA and workload data. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 26)
    const count = Number.isFinite(requested) ? Math.min(120, Math.max(5, requested)) : 26
    const stageFilter = searchParams.get('stage') as CaseStage | null

    let cases = generateCases(count)
    if (stageFilter && STAGES.includes(stageFilter)) {
      cases = cases.filter(c => c.stage === stageFilter)
    }

    return NextResponse.json({
      success: true,
      summary: summarizeCases(cases),
      workload: workloadByAssignee(cases),
      cases,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Case load failed', success: false }, { status: 500 })
  }
}
