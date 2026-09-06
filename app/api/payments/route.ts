import { NextResponse } from 'next/server'
import {
  generatePaymentRequests,
  generatePaymentRequest,
  summarizePayments,
} from '@/lib/payment-approval'

/** Payment approval queue with automation statistics. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = Number(searchParams.get('count') ?? 28)
    const count = Number.isFinite(requested) ? Math.min(140, Math.max(5, requested)) : 28

    const requests = generatePaymentRequests(count)

    return NextResponse.json({
      success: true,
      summary: summarizePayments(requests),
      requests,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Payment load failed', success: false }, { status: 500 })
  }
}

/** Score a single withdrawal request and return an explainable decision. */
export async function POST() {
  try {
    const paymentRequest = generatePaymentRequest()

    return NextResponse.json({
      success: true,
      request: paymentRequest,
      decision: paymentRequest.decision,
      latencyMs: paymentRequest.decisionLatencyMs,
    })
  } catch {
    return NextResponse.json({ error: 'Decision failed', success: false }, { status: 500 })
  }
}
