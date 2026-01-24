import { NextResponse } from 'next/server'
import { FraudAlert } from '@/lib/fraud-detection'

// Simulated alerts storage
const alerts: FraudAlert[] = []

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resolved = searchParams.get('resolved')
  const severity = searchParams.get('severity')
  const limit = parseInt(searchParams.get('limit') || '20')

  let filtered = [...alerts]

  if (resolved !== null) {
    filtered = filtered.filter(a => a.resolved === (resolved === 'true'))
  }

  if (severity) {
    filtered = filtered.filter(a => a.severity === severity)
  }

  return NextResponse.json({
    alerts: filtered.slice(0, limit),
    total: filtered.length,
    unresolved: alerts.filter(a => !a.resolved).length,
    critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
  })
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { alertId, resolved } = body

    const alertIndex = alerts.findIndex(a => a.id === alertId)
    if (alertIndex === -1) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    alerts[alertIndex].resolved = resolved

    return NextResponse.json({
      success: true,
      alert: alerts[alertIndex],
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 400 }
    )
  }
}
