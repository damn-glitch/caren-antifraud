"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Brain, Scan, Shield, AlertTriangle, Loader2, CreditCard, DollarSign,
  MapPin, TrendingUp, TrendingDown, Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { predictFraud, generatePCAFeatures, MERCHANT_NAMES, LOCATIONS, MERCHANT_CATEGORIES } from "@/lib/fraud-detection"
import { explainPrediction, FEATURE_SEMANTICS, type Explanation } from "@/lib/explainability"
import { formatCurrency, getRiskLevel } from "@/lib/utils"
import { useLocale } from "@/lib/locale-context"

interface AnalysisResult {
  probability: number
  confidence: number
  riskLevel: string
  explanation: Explanation
  transaction: {
    amount: number
    merchant: string
    location: string
    category: string
  }
}

export function FraudAnalyzer() {
  const { t, locale } = useLocale()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const analyzeTransaction = () => {
    setIsAnalyzing(true)
    setResult(null)

    setTimeout(() => {
      const isSuspicious = Math.random() > 0.7
      const features = generatePCAFeatures(isSuspicious)
      const amount = isSuspicious ? Math.random() * 3000 + 500 : Math.random() * 200 + 10
      const { probability, confidence } = predictFraud(features, amount)
      const riskScore = probability * 100

      setResult({
        probability: riskScore,
        confidence: confidence * 100,
        riskLevel: getRiskLevel(riskScore),
        explanation: explainPrediction(features, amount, riskScore),
        transaction: {
          amount,
          merchant: MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)],
          location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
          category: MERCHANT_CATEGORIES[Math.floor(Math.random() * MERCHANT_CATEGORIES.length)],
        },
      })
      setIsAnalyzing(false)
    }, 2200)
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

  const steps = [
    { label: t.analyzer.stepFeatures, delay: 0.3 },
    { label: t.analyzer.stepModels, delay: 0.8 },
    { label: t.analyzer.stepScore, delay: 1.3 },
    { label: t.analyzer.stepExplain, delay: 1.8 },
  ]

  return (
    <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">{t.analyzer.title}</CardTitle>
            <p className="text-xs text-slate-500 mt-1">{t.analyzer.poweredBy}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {!isAnalyzing && !result && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-6">
                <Scan className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{t.analyzer.emptyTitle}</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                {t.analyzer.emptyBody}
              </p>
              <Button onClick={analyzeTransaction} size="lg">
                <Brain className="w-5 h-5 mr-2" />
                {t.analyzer.run}
              </Button>
            </motion.div>
          )}

          {isAnalyzing && (
            <motion.div
              key="running"
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
              <h3 className="text-lg font-semibold text-white mb-4">{t.analyzer.analyzing}</h3>
              <div className="space-y-2 text-sm text-slate-400">
                {steps.map((step) => (
                  <motion.p
                    key={step.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: step.delay }}
                  >
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    {step.label}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}

          {result && !isAnalyzing && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Transaction context */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                  <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{t.transactions.merchant}</p>
                    <p className="text-sm text-white truncate">{result.transaction.merchant}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                  <DollarSign className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{t.transactions.amount}</p>
                    <p className="text-sm text-white truncate">{formatCurrency(result.transaction.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 col-span-2">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{t.transactions.location}</p>
                    <p className="text-sm text-white truncate">{result.transaction.location}</p>
                  </div>
                </div>
              </div>

              {/* Risk verdict */}
              <div className={`p-6 rounded-2xl bg-gradient-to-br ${getRiskGradient(result.riskLevel)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {result.probability > 50 ? (
                      <AlertTriangle className="w-8 h-8 text-white" />
                    ) : (
                      <Shield className="w-8 h-8 text-white" />
                    )}
                    <div>
                      <h3 className="text-white font-bold text-lg">{t.analyzer.riskAssessment}</h3>
                      <p className="text-white/80 text-sm">
                        {t.common.confidence}: {result.confidence.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {t.risk[result.riskLevel as keyof typeof t.risk]}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-6xl font-black text-white mb-2">
                    {result.probability.toFixed(1)}%
                  </div>
                  <p className="text-white/80">{t.analyzer.fraudProbability}</p>
                </div>
              </div>

              {/* SHAP-style narrative — the part that makes the verdict auditable. */}
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                  <h4 className="text-sm font-semibold text-violet-300">{t.analyzer.whyThisScore}</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {locale === 'ru'
                    ? result.explanation.narrativeRu
                    : result.explanation.narrativeEn}
                </p>
              </div>

              {/* Feature attribution waterfall */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-400">{t.analyzer.contribution}</h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">
                      {t.analyzer.baseRate}: {(result.explanation.baseValue * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {result.explanation.contributions.slice(0, 6).map((c) => {
                    const pct = c.contribution * 100
                    const width = Math.min(100, Math.abs(pct) * 2.2)
                    const positive = c.contribution > 0
                    const semantic = FEATURE_SEMANTICS[c.feature]

                    return (
                      <div key={c.feature} className="p-3 rounded-lg bg-slate-800/30">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono text-violet-400 shrink-0">
                              {c.feature}
                            </span>
                            <span className="text-xs text-slate-400 truncate">
                              {locale === 'ru' ? semantic.ru : semantic.en}
                            </span>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${
                            positive ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {positive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {positive ? '+' : ''}{pct.toFixed(1)}
                          </div>
                        </div>
                        {/* Bars grow out from a centre axis: right = risk up, left = risk down. */}
                        <div className="relative h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width / 2}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`absolute top-0 h-full ${
                              positive
                                ? 'left-1/2 bg-gradient-to-r from-orange-500 to-red-500'
                                : 'right-1/2 bg-gradient-to-l from-teal-500 to-emerald-500'
                            }`}
                          />
                          <div className="absolute left-1/2 top-0 h-full w-px bg-slate-600" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={analyzeTransaction} className="flex-1">
                  <Scan className="w-4 h-4 mr-2" />
                  {t.analyzer.analyzeNew}
                </Button>
                <Button variant="outline" className="flex-1 border-slate-700">
                  {t.common.details}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
