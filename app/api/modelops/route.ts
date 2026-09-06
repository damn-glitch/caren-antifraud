import { NextResponse } from 'next/server'
import { generateDeployedModels, summarizeModelOps, DRIFT_META } from '@/lib/model-ops'

/** Production model health: drift, fairness and champion/challenger split. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 5)
    const count = Number.isFinite(requested) ? Math.min(10, Math.max(1, requested)) : 5

    const models = generateDeployedModels(count)

    return NextResponse.json({
      success: true,
      summary: summarizeModelOps(models),
      driftTypes: DRIFT_META,
      models,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Model ops load failed', success: false }, { status: 500 })
  }
}
