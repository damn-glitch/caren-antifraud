"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CAREN_MODEL_METRICS, FEATURE_IMPORTANCE, predictFraud, generatePCAFeatures } from "@/lib/fraud-detection"
import { formatCurrency, getRiskLevel } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Brain,
  Cpu,
  Layers,
  GitBranch,
  Zap,
  BarChart3,
  Play,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Activity,
} from "lucide-react"

interface ModelInfo {
  name: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  aucRoc: number
  status: "Production" | "Standby" | "Baseline" | "Evaluation"
  icon: React.ElementType
  gradient: string
  description: string
}

const models: ModelInfo[] = [
  {
    name: "Random Forest",
    accuracy: 99.94,
    precision: 94.12,
    recall: 81.63,
    f1Score: 87.43,
    aucRoc: 98.21,
    status: "Production",
    icon: Layers,
    gradient: "from-emerald-500 to-teal-500",
    description:
      "Ensemble of decision trees with bagging. Primary production model with highest accuracy across all metrics. Handles class imbalance through SMOTE oversampling.",
  },
  {
    name: "XGBoost",
    accuracy: 99.92,
    precision: 92.35,
    recall: 79.59,
    f1Score: 85.49,
    aucRoc: 97.84,
    status: "Production",
    icon: Zap,
    gradient: "from-violet-500 to-indigo-500",
    description:
      "Gradient boosted trees with regularization. Secondary production model providing ensemble diversity. Excels at capturing complex non-linear fraud patterns.",
  },
  {
    name: "Logistic Regression",
    accuracy: 97.41,
    precision: 85.71,
    recall: 61.22,
    f1Score: 71.43,
    aucRoc: 95.12,
    status: "Baseline",
    icon: GitBranch,
    gradient: "from-blue-500 to-cyan-500",
    description:
      "Linear classification baseline model. Provides interpretable probability estimates and serves as the performance baseline for all other models in the pipeline.",
  },
  {
    name: "K-Nearest Neighbors",
    accuracy: 99.65,
    precision: 89.47,
    recall: 69.39,
    f1Score: 78.16,
    aucRoc: 96.53,
    status: "Standby",
    icon: Target,
    gradient: "from-amber-500 to-orange-500",
    description:
      "Instance-based lazy learner using proximity voting. On standby for production failover scenarios. Strong performance on localized fraud clusters in feature space.",
  },
  {
    name: "Decision Tree (AdaBoost)",
    accuracy: 99.87,
    precision: 91.18,
    recall: 77.55,
    f1Score: 83.78,
    aucRoc: 97.42,
    status: "Evaluation",
    icon: Brain,
    gradient: "from-pink-500 to-rose-500",
    description:
      "Adaptive boosting ensemble of shallow decision trees. Currently under evaluation for potential production deployment. Shows promising results on recent fraud patterns.",
  },
]

function getStatusBadgeVariant(
  status: ModelInfo["status"]
): "success" | "secondary" | "outline" | "warning" {
  switch (status) {
    case "Production":
      return "success"
    case "Standby":
      return "secondary"
    case "Baseline":
      return "outline"
    case "Evaluation":
      return "warning"
  }
}

function getStatusIcon(status: ModelInfo["status"]) {
  switch (status) {
    case "Production":
      return <CheckCircle className="w-3 h-3 mr-1" />
    case "Standby":
      return <Clock className="w-3 h-3 mr-1" />
    case "Baseline":
      return <BarChart3 className="w-3 h-3 mr-1" />
    case "Evaluation":
      return <Activity className="w-3 h-3 mr-1" />
  }
}

interface TestResult {
  probability: number
  confidence: number
  riskLevel: "low" | "medium" | "high" | "critical"
  features: number[]
  amount: number
}

export default function ModelsPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const handleGenerateTest = () => {
    setIsTesting(true)
    setTestResult(null)

    setTimeout(() => {
      const features = generatePCAFeatures()
      const amount = Math.round((Math.random() * 2000 + 10) * 100) / 100
      const { probability, confidence } = predictFraud(features, amount)
      const riskLevel = getRiskLevel(probability * 100)

      setTestResult({
        probability,
        confidence,
        riskLevel,
        features,
        amount,
      })
      setIsTesting(false)
    }, 1200)
  }

  const riskLevelColors: Record<string, string> = {
    low: "text-emerald-400",
    medium: "text-yellow-400",
    high: "text-orange-400",
    critical: "text-red-400",
  }

  const riskLevelBg: Record<string, string> = {
    low: "bg-emerald-500/10 border-emerald-500/30",
    medium: "bg-yellow-500/10 border-yellow-500/30",
    high: "bg-orange-500/10 border-orange-500/30",
    critical: "bg-red-500/10 border-red-500/30",
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">AI Models</h1>
            </div>
            <p className="text-slate-400 text-sm ml-12">
              Machine learning models powering CAREN fraud detection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 px-3 py-1.5"
            >
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              {models.filter((m) => m.status === "Production").length} Models Active
            </Badge>
            <Badge
              variant="outline"
              className="border-violet-500/30 text-violet-400 px-3 py-1.5"
            >
              <TrendingUp className="w-3 h-3 mr-1.5" />
              {(CAREN_MODEL_METRICS.accuracy * 100).toFixed(2)}% Ensemble Accuracy
            </Badge>
          </div>
        </motion.div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {models.map((model, index) => {
            const Icon = model.icon
            return (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  glow
                  className={`bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 cursor-pointer ${
                    selectedModel === model.name
                      ? "ring-2 ring-violet-500/50 border-violet-500/30"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedModel(
                      selectedModel === model.name ? null : model.name
                    )
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${model.gradient} shadow-lg`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant={getStatusBadgeVariant(model.status)}>
                        {getStatusIcon(model.status)}
                        {model.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3 !bg-none !text-white">
                      {model.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {model.accuracy.toFixed(2)}%
                      </span>
                      <span className="text-sm text-slate-400">accuracy</span>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed">
                      {model.description}
                    </p>

                    {/* Mini metrics */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                      <div className="text-center p-2 rounded-lg bg-slate-800/30">
                        <div className="text-xs text-slate-500">Precision</div>
                        <div className="text-sm font-semibold text-slate-300">
                          {model.precision.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-800/30">
                        <div className="text-xs text-slate-500">Recall</div>
                        <div className="text-sm font-semibold text-slate-300">
                          {model.recall.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedModel(
                          selectedModel === model.name ? null : model.name
                        )
                      }}
                    >
                      <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Performance Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg !bg-none !text-white">
                    Performance Comparison
                  </CardTitle>
                  <p className="text-sm text-slate-400 mt-1">
                    Side-by-side metrics for all trained models
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">
                        Model
                      </th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">
                        Accuracy
                      </th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">
                        Precision
                      </th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">
                        Recall
                      </th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">
                        F1 Score
                      </th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">
                        AUC-ROC
                      </th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((model, index) => {
                      const Icon = model.icon
                      const isTop = model.accuracy === Math.max(...models.map((m) => m.accuracy))
                      return (
                        <motion.tr
                          key={model.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                          className={`border-b border-slate-800/30 transition-colors hover:bg-slate-800/20 ${
                            isTop ? "bg-emerald-500/5" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-1.5 rounded-lg bg-gradient-to-br ${model.gradient}`}
                              >
                                <Icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="font-medium text-slate-200">
                                {model.name}
                              </span>
                              {isTop && (
                                <Badge
                                  variant="success"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Best
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`font-semibold ${
                                model.accuracy >= 99.9
                                  ? "text-emerald-400"
                                  : model.accuracy >= 99
                                  ? "text-blue-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {model.accuracy.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {model.precision.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {model.recall.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {model.f1Score.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {model.aucRoc.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={getStatusBadgeVariant(model.status)}>
                              {model.status}
                            </Badge>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Model Testing & Feature Importance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Live Model Testing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-slate-900/50 border-slate-800/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg !bg-none !text-white">
                      Live Model Testing
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">
                      Generate and analyze test transactions in real-time
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <Button
                  onClick={handleGenerateTest}
                  disabled={isTesting}
                  className="w-full"
                  variant="default"
                  size="lg"
                >
                  {isTesting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Cpu className="w-4 h-4 mr-2" />
                      </motion.div>
                      Analyzing Transaction...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate Test Transaction
                    </>
                  )}
                </Button>

                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    {/* Result Summary */}
                    <div
                      className={`p-4 rounded-xl border ${
                        riskLevelBg[testResult.riskLevel]
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-300">
                          Fraud Probability
                        </span>
                        <span
                          className={`text-sm font-bold uppercase ${
                            riskLevelColors[testResult.riskLevel]
                          }`}
                        >
                          {testResult.riskLevel} Risk
                        </span>
                      </div>

                      {/* Animated probability bar */}
                      <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden mb-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(
                              testResult.probability * 100,
                              100
                            )}%`,
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`absolute left-0 top-0 h-full rounded-full ${
                            testResult.probability > 0.75
                              ? "bg-gradient-to-r from-red-500 to-rose-500"
                              : testResult.probability > 0.5
                              ? "bg-gradient-to-r from-orange-500 to-amber-500"
                              : testResult.probability > 0.25
                              ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                              : "bg-gradient-to-r from-emerald-500 to-teal-500"
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-xs text-slate-500">
                            Probability
                          </div>
                          <div className="text-lg font-bold text-white">
                            {(testResult.probability * 100).toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500">
                            Confidence
                          </div>
                          <div className="text-lg font-bold text-white">
                            {(testResult.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500">Amount</div>
                          <div className="text-lg font-bold text-white">
                            {formatCurrency(testResult.amount)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feature Breakdown */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-3">
                        Feature Breakdown (V1-V5)
                      </h4>
                      <div className="space-y-2">
                        {testResult.features.slice(0, 5).map((value, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3"
                          >
                            <span className="text-xs text-slate-500 w-8 font-mono">
                              V{i + 1}
                            </span>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(
                                    Math.abs(value) * 15,
                                    100
                                  )}%`,
                                }}
                                transition={{
                                  duration: 0.8,
                                  delay: i * 0.1,
                                }}
                                className={`h-full rounded-full ${
                                  value > 0
                                    ? "bg-violet-500"
                                    : "bg-cyan-500"
                                }`}
                              />
                            </div>
                            <span
                              className={`text-xs font-mono w-16 text-right ${
                                value > 0
                                  ? "text-violet-400"
                                  : "text-cyan-400"
                              }`}
                            >
                              {value > 0 ? "+" : ""}
                              {value.toFixed(4)}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {!testResult && !isTesting && (
                  <div className="text-center py-8">
                    <Cpu className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      Click the button above to generate a test transaction and
                      see how the CAREN ensemble model analyzes it.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Importance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-slate-900/50 border-slate-800/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg !bg-none !text-white">
                      Feature Importance
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">
                      Top PCA features contributing to fraud detection
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {FEATURE_IMPORTANCE.map((item, index) => {
                    const maxImportance = FEATURE_IMPORTANCE[0].importance
                    const widthPercent =
                      (item.importance / maxImportance) * 100

                    return (
                      <motion.div
                        key={item.feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + index * 0.06 }}
                        className="group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium text-slate-300">
                              {item.feature}
                            </span>
                            {index < 3 && (
                              <Badge
                                variant="default"
                                className="text-[10px] px-1.5 py-0"
                              >
                                Top {index + 1}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-slate-400 tabular-nums">
                            {(item.importance * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPercent}%` }}
                            transition={{
                              duration: 1,
                              delay: 1.0 + index * 0.06,
                              ease: "easeOut",
                            }}
                            className={`h-full rounded-full ${
                              index === 0
                                ? "bg-gradient-to-r from-violet-500 to-indigo-500"
                                : index === 1
                                ? "bg-gradient-to-r from-violet-500/90 to-indigo-500/90"
                                : index === 2
                                ? "bg-gradient-to-r from-violet-500/80 to-indigo-500/80"
                                : index < 5
                                ? "bg-gradient-to-r from-violet-500/60 to-indigo-500/60"
                                : "bg-gradient-to-r from-violet-500/40 to-indigo-500/40"
                            } group-hover:shadow-lg group-hover:shadow-violet-500/10 transition-shadow`}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="mt-6 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Feature importance is derived from the Random Forest
                      model&apos;s Gini impurity reduction. V14, V4, and V12 are
                      the most discriminative PCA components for separating
                      fraudulent from legitimate transactions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  )
}
