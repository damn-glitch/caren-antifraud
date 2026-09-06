import { NextResponse } from 'next/server'
import { runTriage } from '@/lib/alert-triage'

/** Run the alert-triage pipeline over a raw alert volume. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw = Number(searchParams.get('alerts') ?? 2000)
    const rawAlerts = Number.isFinite(raw) ? Math.min(50000, Math.max(50, raw)) : 2000

    const result = runTriage(rawAlerts)

    return NextResponse.json({
      success: true,
      rawAlerts: result.rawAlerts,
      finalCases: result.finalCases,
      noiseReduction: Number(result.noiseReduction.toFixed(2)),
      analystHoursSaved: result.analystHoursSaved,
      stages: result.stages,
      suppression: result.suppression,
      cases: result.cases,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Triage failed', success: false }, { status: 500 })
  }
}
