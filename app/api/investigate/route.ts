import { NextResponse } from 'next/server'
import { generateCaseFile, type Verdict } from '@/lib/investigation'

const VALID_VERDICTS: Verdict[] = [
  'confirmed_fraud',
  'likely_fraud',
  'suspicious',
  'likely_legitimate',
]

/** Generate a complete investigation case file. */
export async function POST(request: Request) {
  try {
    // A body is optional — callers may just ask for a case with no constraints.
    const body = await request.json().catch(() => ({}))
    const requested = body?.verdict as Verdict | undefined
    const verdict = requested && VALID_VERDICTS.includes(requested) ? requested : undefined

    const caseFile = generateCaseFile(verdict)

    return NextResponse.json({
      success: true,
      caseFile,
      meta: {
        generatedInSeconds: Number(caseFile.generatedInSeconds.toFixed(1)),
        manualEstimateMinutes: caseFile.manualEstimateMinutes,
        speedupFactor: Number(
          ((caseFile.manualEstimateMinutes * 60) / caseFile.generatedInSeconds).toFixed(1)
        ),
        modelVersion: 'CAREN-Copilot-v1.2.0',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Investigation failed', success: false },
      { status: 500 }
    )
  }
}
