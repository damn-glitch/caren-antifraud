import { NextResponse } from 'next/server'
import { generateResponse, detectIntent } from '@/lib/copilot-chat'

/** Answer an analyst question with a grounded, cited reply. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const query = typeof body?.query === 'string' ? body.query.trim() : ''
    const locale = body?.locale === 'ru' ? 'ru' : 'en'

    if (!query) {
      return NextResponse.json(
        { error: 'A non-empty query is required', success: false },
        { status: 400 }
      )
    }

    const message = generateResponse(query, locale)

    return NextResponse.json({
      success: true,
      intent: detectIntent(query),
      message,
    })
  } catch {
    return NextResponse.json({ error: 'Copilot failed', success: false }, { status: 500 })
  }
}
