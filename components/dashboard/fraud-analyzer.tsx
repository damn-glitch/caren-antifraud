"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Scan, Shield, AlertTriangle, CheckCircle, Loader2, CreditCard, DollarSign, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { predictFraud, generatePCAFeatures, MERCHANT_NAMES, LOCATIONS, MERCHANT_CATEGORIES } from "@/lib/fraud-detection"
import { formatCurrency, getRiskLevel, getRiskColor } from "@/lib/utils"

export function FraudAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    probability: number
    confidence: number
    riskLevel: string
    features: { name: string; value: number; impact: string }[]
    transaction: {
      amount: number
      merchant: string
      location: string
      category: string
    }
  } | null>(null)

  const analyzeTransaction = () => {
    setIsAnalyzing(true)
    setResult(null)

    // Simulate analysis delay
    setTimeout(() => {
      const isSuspicious = Math.random() > 0.7
      const features = generatePCAFeatures(isSuspicious)
      const amount = isSuspicious ? Math.random() * 3000 + 500 : Math.random() * 200 + 10
      const { probability, confidence } = predictFraud(features, amount)

      setResult({
        probability: probability * 100,
        confidence: confidence * 100,
        riskLevel: getRiskLevel(probability * 100),
        features: [
          { name: 'V14', value: features[13], impact: features[13] > 0 ? 'high' : 'low' },
          { name: 'V4', value: features[3], impact: Math.abs(features[3]) > 2 ? 'high' : 'medium' },
          { name: 'V12', value: features[11], impact: features[11] < -1 ? 'high' : 'low' },
          { name: 'V10', value: features[9], impact: Math.abs(features[9]) > 1.5 ? 'medium' : 'low' },
          { name: 'Amount', value: amount, impact: amount > 1000 ? 'high' : 'low' },
        ],
        transaction: {
          amount,
          merchant: MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)],
          location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
          category: MERCHANT_CATEGORIES[Math.floor(Math.random() * MERCHANT_CATEGORIES.length)],
        }
      })
      setIsAnalyzing(false)
    }, 2000)
  }

  const getRiskGradient = (level: string) => {
    const gradients: Record<string, string> = {
      low: 'from-emerald-500 to-teal-500',
      medium: 'from-amber-500 to-yellow-500',
      high: 'from-orange-500 to-red-500',
      critical: 'from-red-600 to-rose-600',
    }
    return gradients[level] || gradients.low
  }

  return (
    <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">AI Fraud Analyzer</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Powered by CAREN Neural Network</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {!isAnalyzing && !result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-6">
                <Scan className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Analyze a Transaction</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                Our AI will analyze the transaction using 28 PCA-transformed features and ensemble ML models.
              </p>
              <Button onClick={analyzeTransaction} size="lg">
                <Brain className="w-5 h-5 mr-2" />
                Run AI Analysis
              </Button>
            </motion.div>
          )}

          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 mx-auto mb-6"
              />
              <h3 className="text-lg font-semibold text-white mb-2">Analyzing Transaction...</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Extracting PCA features...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Running ensemble models...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Computing risk score...
                </motion.p>
              </div>
            </motion.div>
          )}

          {result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Merchant</p>
                    <p className="text-sm text-white">{result.transaction.merchant}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="text-sm text-white">{formatCurrency(result.transaction.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 col-span-2">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="text-sm text-white">{result.transaction.location}</p>
                  </div>
                </div>
              </div>

              {/* Risk Score */}
              <div className={`p-6 rounded-2xl bg-gradient-to-br ${getRiskGradient(result.riskLevel)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {result.probability > 50 ? (
                      <AlertTriangle className="w-8 h-8 text-white" />
                    ) : (
                      <Shield className="w-8 h-8 text-white" />
                    )}
                    <div>
                      <h3 className="text-white font-bold text-lg">Risk Assessment</h3>
                      <p className="text-white/80 text-sm">Confidence: {result.confidence.toFixed(1)}%</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {result.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-6xl font-black text-white mb-2">
                    {result.probability.toFixed(1)}%
                  </div>
                  <p className="text-white/80">Fraud Probability</p>
                </div>
              </div>

              {/* Feature Analysis */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Key Feature Analysis</h4>
                <div className="space-y-2">
                  {result.features.map((feature) => (
                    <div key={feature.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-violet-400">{feature.name}</span>
                        <span className="text-sm text-slate-400">
                          {typeof feature.value === 'number' && feature.name !== 'Amount'
                            ? feature.value.toFixed(3)
                            : formatCurrency(feature.value)}
                        </span>
                      </div>
                      <Badge variant={feature.impact === 'high' ? 'destructive' : feature.impact === 'medium' ? 'warning' : 'success'}>
                        {feature.impact} impact
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={analyzeTransaction} className="flex-1">
                  <Scan className="w-4 h-4 mr-2" />
                  Analyze New
                </Button>
                <Button variant="outline" className="flex-1 border-slate-700">
                  View Details
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
