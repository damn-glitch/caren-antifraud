"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { generateHistoricalData, CAREN_MODEL_METRICS, FEATURE_IMPORTANCE } from "@/lib/fraud-detection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { TrendingUp, TrendingDown, BarChart3, Target, Activity, DollarSign } from "lucide-react"

const PERIODS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const

const PIE_COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#ef4444"]

const riskDistributionData = [
  { name: "Low", value: 75, color: "#10b981" },
  { name: "Medium", value: 15, color: "#06b6d4" },
  { name: "High", value: 7, color: "#f59e0b" },
  { name: "Critical", value: 3, color: "#ef4444" },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-300 text-sm font-medium mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm" style={{ color: payload[0].payload.color }}>
        {payload[0].name}: {payload[0].value}%
      </p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [historicalData, setHistoricalData] = useState<ReturnType<typeof generateHistoricalData>>([])

  useEffect(() => {
    setHistoricalData(generateHistoricalData(selectedPeriod))
  }, [selectedPeriod])

  const radarData = [
    { metric: "Accuracy", value: CAREN_MODEL_METRICS.accuracy * 100 },
    { metric: "Precision", value: CAREN_MODEL_METRICS.precision * 100 },
    { metric: "Recall", value: CAREN_MODEL_METRICS.recall * 100 },
    { metric: "F1 Score", value: CAREN_MODEL_METRICS.f1Score * 100 },
    { metric: "AUC", value: CAREN_MODEL_METRICS.auc * 100 },
    { metric: "Specificity", value: CAREN_MODEL_METRICS.specificity * 100 },
  ]

  const maxImportance = Math.max(...FEATURE_IMPORTANCE.map((f) => f.importance))

  const topStats = [
    {
      title: "Detection Rate",
      value: "99.94%",
      trend: "+0.02%",
      trendUp: true,
      icon: Target,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "False Positive Rate",
      value: "0.02%",
      trend: "-0.01%",
      trendUp: false,
      icon: Activity,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
    {
      title: "Avg Response Time",
      value: "34ms",
      trend: "-5ms",
      trendUp: false,
      icon: BarChart3,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      title: "Money Saved",
      value: "$2.1M+",
      trend: "+23%",
      trendUp: true,
      icon: DollarSign,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
  ]

  return (
    <DashboardShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-slate-400 text-sm">
            Deep insights into fraud detection performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((period) => (
            <button
              key={period.days}
              onClick={() => setSelectedPeriod(period.days)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedPeriod === period.days
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {topStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`bg-slate-900/50 border-slate-800/50 ${stat.borderColor}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <Badge
                    variant={stat.trendUp && stat.title !== "False Positive Rate" ? "success" : stat.title === "False Positive Rate" ? "success" : "destructive"}
                    className="text-xs"
                  >
                    {(stat.trendUp && stat.title !== "False Positive Rate") || (!stat.trendUp && stat.title === "False Positive Rate") || (!stat.trendUp && stat.title === "Avg Response Time") ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {stat.trend}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400 mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Grid - 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Fraud Detection Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg text-white font-semibold">
                Fraud Detection Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="fraudGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(value) => {
                        const d = new Date(value)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                    />
                    <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: "10px" }}
                      formatter={(value: string) => (
                        <span className="text-slate-400 text-sm">{value}</span>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="fraudAttempts"
                      name="Fraud Attempts"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#fraudGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="blocked"
                      name="Blocked"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#blockedGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Volume Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg text-white font-semibold">
                Transaction Volume Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(value) => {
                        const d = new Date(value)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                    />
                    <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="totalTransactions"
                      name="Daily Volume"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      opacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg text-white font-semibold">
                Risk Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-slate-400 text-sm">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Model Performance Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg text-white font-semibold">
                Model Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      stroke="#1e293b"
                    />
                    <Radar
                      name="CAREN Model"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null
                        return (
                          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 shadow-xl">
                            <p className="text-violet-400 text-sm font-medium">
                              {payload[0].payload.metric}: {Number(payload[0].value).toFixed(2)}%
                            </p>
                          </div>
                        )
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feature Importance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-lg text-white font-semibold">
              Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {FEATURE_IMPORTANCE.map((item, index) => (
                <div key={item.feature} className="flex items-center gap-4">
                  <span className="text-sm font-mono text-slate-400 w-16 text-right shrink-0">
                    {item.feature}
                  </span>
                  <div className="flex-1 h-8 bg-slate-800/50 rounded-lg overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-lg"
                      style={{
                        background: `linear-gradient(90deg, #8b5cf6, ${
                          index < 3 ? "#06b6d4" : index < 6 ? "#10b981" : "#f59e0b"
                        })`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.importance / maxImportance) * 100}%` }}
                      transition={{
                        duration: 1,
                        delay: 0.7 + index * 0.08,
                        ease: "easeOut",
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                      {(item.importance * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardShell>
  )
}
