// CAREN - Credit Card Fraud Detection AI Engine
// Based on Credit_card_fraud_detection_Alisher.ipynb
// Author: Alisher Beisembekov

export interface Transaction {
  id: string
  timestamp: Date
  amount: number
  merchantName: string
  merchantCategory: string
  location: string
  cardLast4: string
  features: number[] // V1-V28 PCA components
  riskScore: number
  isFraud: boolean
  status: 'pending' | 'approved' | 'declined' | 'flagged'
}

export interface FraudAlert {
  id: string
  transactionId: string
  alertType: 'velocity' | 'amount' | 'location' | 'pattern' | 'ml_prediction'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  resolved: boolean
}

export interface ModelMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  auc: number
  specificity: number
}

// Simulated model metrics based on the notebook analysis
export const CAREN_MODEL_METRICS: ModelMetrics = {
  accuracy: 0.9994,
  precision: 0.9412,
  recall: 0.8163,
  f1Score: 0.8743,
  auc: 0.9821,
  specificity: 0.9998,
}

// Feature importance from Random Forest / XGBoost models
export const FEATURE_IMPORTANCE: { feature: string; importance: number }[] = [
  { feature: 'V14', importance: 0.1823 },
  { feature: 'V4', importance: 0.1456 },
  { feature: 'V12', importance: 0.1234 },
  { feature: 'V10', importance: 0.0987 },
  { feature: 'V11', importance: 0.0876 },
  { feature: 'V17', importance: 0.0765 },
  { feature: 'V3', importance: 0.0654 },
  { feature: 'V16', importance: 0.0543 },
  { feature: 'Amount', importance: 0.0432 },
  { feature: 'V7', importance: 0.0321 },
]

// Merchant categories for realistic transactions
export const MERCHANT_CATEGORIES = [
  'Retail Shopping',
  'Grocery Store',
  'Restaurant',
  'Gas Station',
  'Online Shopping',
  'Travel & Airlines',
  'Entertainment',
  'Healthcare',
  'Utilities',
  'Financial Services',
]

// Sample merchant names
export const MERCHANT_NAMES = [
  'Amazon', 'Walmart', 'Target', 'Best Buy', 'Costco',
  'Whole Foods', 'Starbucks', 'McDonalds', 'Shell Gas',
  'Delta Airlines', 'Netflix', 'Spotify', 'CVS Pharmacy',
  'Home Depot', 'Apple Store', 'Nike', 'Uber', 'Airbnb',
]

// Locations
export const LOCATIONS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
  'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
  'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL',
  'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC', 'Seattle, WA',
]

// Generate random PCA features (V1-V28) simulating real transaction patterns
export function generatePCAFeatures(isFraudulent: boolean = false): number[] {
  const features: number[] = []

  for (let i = 0; i < 28; i++) {
    if (isFraudulent) {
      // Fraudulent transactions often have more extreme values
      const base = (Math.random() - 0.5) * 10
      const extreme = Math.random() > 0.7 ? (Math.random() - 0.5) * 20 : 0
      features.push(base + extreme)
    } else {
      // Normal transactions have values closer to 0
      features.push((Math.random() - 0.5) * 4)
    }
  }

  return features
}

// CAREN AI - Predict fraud probability using ensemble scoring
export function predictFraud(features: number[], amount: number): { probability: number; confidence: number } {
  // Simplified fraud detection algorithm based on the notebook's approach
  // In production, this would use actual trained models

  let score = 0
  const weights = [
    0.05, 0.03, 0.08, 0.12, 0.04, 0.03, 0.06, 0.02, 0.03, 0.09,
    0.07, 0.10, 0.02, 0.15, 0.03, 0.06, 0.08, 0.02, 0.01, 0.01,
    0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.02, 0.01
  ]

  // Calculate weighted feature score
  for (let i = 0; i < Math.min(features.length, weights.length); i++) {
    const contribution = Math.abs(features[i]) * weights[i]
    // Features V14, V4, V12 are most important (as shown in notebook)
    if (i === 13 || i === 3 || i === 11) {
      score += contribution * 1.5
    } else {
      score += contribution
    }
  }

  // Amount-based adjustments
  if (amount > 1000) score += 0.1
  if (amount > 5000) score += 0.2
  if (amount > 10000) score += 0.3

  // Normalize to probability
  const probability = 1 / (1 + Math.exp(-score + 2))

  // Calculate confidence based on feature variance
  const variance = features.reduce((acc, f) => acc + f * f, 0) / features.length
  const confidence = Math.min(0.99, 0.7 + variance * 0.05)

  return { probability, confidence }
}

// Generate a realistic transaction
export function generateTransaction(forcefraud: boolean = false): Transaction {
  const isFraud = forcefraud || Math.random() < 0.00172 // Real fraud rate from dataset
  const features = generatePCAFeatures(isFraud)
  const amount = isFraud
    ? Math.random() * 2000 + 100 // Fraud tends to be higher amounts
    : Math.random() * 500 + 5    // Normal purchases

  const { probability } = predictFraud(features, amount)
  const riskScore = probability * 100

  return {
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    timestamp: new Date(),
    amount: Math.round(amount * 100) / 100,
    merchantName: MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)],
    merchantCategory: MERCHANT_CATEGORIES[Math.floor(Math.random() * MERCHANT_CATEGORIES.length)],
    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    cardLast4: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
    features,
    riskScore: Math.round(riskScore * 100) / 100,
    isFraud,
    status: riskScore > 75 ? 'flagged' : riskScore > 50 ? 'pending' : 'approved',
  }
}

// Generate fraud alert
export function generateAlert(transaction: Transaction): FraudAlert | null {
  if (transaction.riskScore < 30) return null

  const alertTypes: FraudAlert['alertType'][] = ['velocity', 'amount', 'location', 'pattern', 'ml_prediction']
  const type = alertTypes[Math.floor(Math.random() * alertTypes.length)]

  const messages: Record<FraudAlert['alertType'], string> = {
    velocity: 'Multiple transactions detected in short time span',
    amount: `Unusually high transaction amount: $${transaction.amount.toFixed(2)}`,
    location: `Transaction from unusual location: ${transaction.location}`,
    pattern: 'Transaction pattern deviation detected',
    ml_prediction: `AI model detected ${transaction.riskScore.toFixed(1)}% fraud probability`,
  }

  const severity: FraudAlert['severity'] =
    transaction.riskScore > 85 ? 'critical' :
    transaction.riskScore > 65 ? 'high' :
    transaction.riskScore > 45 ? 'medium' : 'low'

  return {
    id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    transactionId: transaction.id,
    alertType: type,
    severity,
    message: messages[type],
    timestamp: new Date(),
    resolved: false,
  }
}

// Historical data for charts
export function generateHistoricalData(days: number = 30) {
  const data = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    const totalTransactions = Math.floor(Math.random() * 5000 + 10000)
    const fraudAttempts = Math.floor(totalTransactions * (0.001 + Math.random() * 0.002))
    const blocked = Math.floor(fraudAttempts * (0.85 + Math.random() * 0.1))

    data.push({
      date: date.toISOString().split('T')[0],
      totalTransactions,
      fraudAttempts,
      blocked,
      amountProcessed: Math.floor(totalTransactions * (Math.random() * 150 + 50)),
      amountSaved: Math.floor(blocked * (Math.random() * 500 + 200)),
    })
  }

  return data
}
