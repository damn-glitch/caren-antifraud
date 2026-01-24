import { NextResponse } from 'next/server'
import { generateHistoricalData, CAREN_MODEL_METRICS } from '@/lib/fraud-detection'

export async function GET() {
  const historicalData = generateHistoricalData(30)

  // Calculate aggregated stats
  const totalTransactions = historicalData.reduce((sum, d) => sum + d.totalTransactions, 0)
  const totalFraudAttempts = historicalData.reduce((sum, d) => sum + d.fraudAttempts, 0)
  const totalBlocked = historicalData.reduce((sum, d) => sum + d.blocked, 0)
  const totalAmountProcessed = historicalData.reduce((sum, d) => sum + d.amountProcessed, 0)
  const totalAmountSaved = historicalData.reduce((sum, d) => sum + d.amountSaved, 0)

  const blockRate = totalBlocked / totalFraudAttempts * 100
  const fraudRate = totalFraudAttempts / totalTransactions * 100

  return NextResponse.json({
    overview: {
      totalTransactions,
      totalFraudAttempts,
      totalBlocked,
      totalAmountProcessed,
      totalAmountSaved,
      blockRate: Math.round(blockRate * 100) / 100,
      fraudRate: Math.round(fraudRate * 1000) / 1000,
      avgResponseTime: 34, // ms
      systemUptime: 99.99,
    },
    modelMetrics: CAREN_MODEL_METRICS,
    historicalData,
    lastUpdated: new Date().toISOString(),
  })
}
