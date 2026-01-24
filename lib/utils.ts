import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

export function calculateRiskScore(features: number[]): number {
  // Simplified risk score calculation based on transaction features
  // In production, this would use a trained ML model
  const weights = [0.15, 0.12, 0.10, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02]
  let score = 0

  for (let i = 0; i < Math.min(features.length, weights.length); i++) {
    score += Math.abs(features[i]) * weights[i]
  }

  // Normalize to 0-100
  return Math.min(100, Math.max(0, score * 10))
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 25) return 'low'
  if (score < 50) return 'medium'
  if (score < 75) return 'high'
  return 'critical'
}

export function getRiskColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: 'text-emerald-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  }
  return colors[level]
}

export function getRiskBgColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: 'bg-emerald-500/10 border-emerald-500/20',
    medium: 'bg-yellow-500/10 border-yellow-500/20',
    high: 'bg-orange-500/10 border-orange-500/20',
    critical: 'bg-red-500/10 border-red-500/20',
  }
  return colors[level]
}
