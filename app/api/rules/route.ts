import { NextResponse } from 'next/server'
import {
  generateRules,
  simulate,
  FIELD_META,
  OPERATOR_LABELS,
  ACTION_META,
  type Condition,
  type RuleAction,
} from '@/lib/rule-engine'

/** Current detection rules with their live performance. */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      rules: generateRules(),
      fields: FIELD_META,
      operators: OPERATOR_LABELS,
      actions: ACTION_META,
    })
  } catch {
    return NextResponse.json({ error: 'Rule load failed', success: false }, { status: 500 })
  }
}

/** Run a what-if simulation for a proposed threshold change. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const original = body?.original as Condition[] | undefined
    const modified = body?.modified as Condition[] | undefined
    const action = body?.action as RuleAction | undefined

    if (!Array.isArray(original) || !Array.isArray(modified) || !action) {
      return NextResponse.json(
        { error: 'original, modified and action are required', success: false },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      result: simulate(original, modified, action),
    })
  } catch {
    return NextResponse.json({ error: 'Simulation failed', success: false }, { status: 500 })
  }
}
