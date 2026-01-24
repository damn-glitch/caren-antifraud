import { NextResponse } from 'next/server'
import { generateTransaction, generateAlert, Transaction, FraudAlert } from '@/lib/fraud-detection'

// Simulated database of transactions
const transactions: Transaction[] = []
const alerts: FraudAlert[] = []

// Initialize with some transactions
for (let i = 0; i < 100; i++) {
  const tx = generateTransaction()
  transactions.push(tx)
  const alert = generateAlert(tx)
  if (alert) alerts.push(alert)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const status = searchParams.get('status')

  let filtered = [...transactions]

  if (status) {
    filtered = filtered.filter(tx => tx.status === status)
  }

  const paginated = filtered.slice(offset, offset + limit)

  return NextResponse.json({
    transactions: paginated,
    total: filtered.length,
    limit,
    offset,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { forcefraud } = body

    // Generate new transaction
    const transaction = generateTransaction(forcefraud)
    transactions.unshift(transaction)

    // Generate alert if needed
    const alert = generateAlert(transaction)
    if (alert) {
      alerts.unshift(alert)
    }

    // Keep only last 1000 transactions
    if (transactions.length > 1000) {
      transactions.pop()
    }

    return NextResponse.json({
      transaction,
      alert,
      success: true,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 400 }
    )
  }
}
