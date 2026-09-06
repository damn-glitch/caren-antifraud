"use client"

// CAREN - Model Ops page
// Production ML health: data/concept drift, segment fairness and champion/challenger rollout.

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Gauge,
  Brain,
  TrendingDown,
  AlertTriangle,
  Check,
  X,
  Scale,
  Activity,
  RefreshCw,
  Crown,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from "@/lib/locale-context"
import {
  generateDeployedModels,
  summarizeModelOps,
  HEALTH_META,
  DRIFT_META,
  type DeployedModel,
  type FeatureDrift,
  type FairnessMetric,
} from "@/lib/model-ops"

const VIOLET = "#8b5cf6"
const CYAN = "#06b6d4"
const SLATE = "#64748b"
const EMERALD = "#10b981"
const AMBER = "#f59e0b"
const RED = "#ef4444"

/** PSI convention: above 0.1 warrants monitoring, above 0.25 warrants action. */
const PSI_MONITOR = 0.1
const PSI_ACTION = 0.25
/** Upper bound of the PSI bars, so both threshold markers stay on-scale. */
const PSI_SCALE = 0.4

/** The four-fifths rule: a disparate-impact ratio below 0.8 fails. */
const DI_THRESHOLD = 0.8
const DI_SCALE = 1.2

type Role = DeployedModel["role"]
type DriftStatus = FeatureDrift["status"]

/** The engine ships no label map for roles, so it lives here — same bilingual shape as HEALTH_META. */
const ROLE_LABELS: Record<Role, { en: string; ru: string }> = {
  champion: { en: "Champion", ru: "Чемпион" },
  challenger: { en: "Challenger", ru: "Претендент" },
  shadow: { en: "Shadow", ru: "Теневая" },
}

const ROLE_CLASS: Record<Role, string> = {
  champion: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  challenger: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
  shadow: "bg-slate-700/30 text-slate-300 border-slate-600/40",
}

const DRIFT_STATUS_COLOR: Record<DriftStatus, string> = {
  stable: EMERALD,
  moderate: AMBER,
  significant: RED,
}

/** Copy this page needs that the shared dictionary does not carry. */
const L = {
  totalModels: { en: "Deployed models", ru: "Развёрнутые модели" },
  fairnessFailures: { en: "Fairness failures", ru: "Нарушения справедливости" },
  avgPsi: { en: "Average PSI", ru: "Средний PSI" },
  predictionsPerDay: { en: "Predictions / day", ru: "Прогнозов в сутки" },
  latencyP99: { en: "p99 latency", ru: "Задержка p99" },
  overallPsi: { en: "Overall PSI", ru: "Совокупный PSI" },
  monitorThreshold: { en: "Monitor 0.10", ru: "Мониторинг 0,10" },
  actionThreshold: { en: "Action 0.25", ru: "Действие 0,25" },
  baselineMean: { en: "Baseline mean", ru: "Базовое среднее" },
  currentMean: { en: "Current mean", ru: "Текущее среднее" },
  segment: { en: "Segment", ru: "Сегмент" },
  approvalRate: { en: "Approval rate", ru: "Доля одобрений" },
  falsePositiveRate: { en: "False-positive rate", ru: "Доля ложных срабатываний" },
  pass: { en: "Pass", ru: "Пройдено" },
  fail: { en: "Fail", ru: "Не пройдено" },
  fourFifths: {
    en: "Four-fifths rule: a ratio below 0.80 against the reference group fails.",
    ru: "Правило «четырёх пятых»: коэффициент ниже 0,80 к эталонной группе не проходит.",
  },
  aiAnalysis: { en: "AI analysis", ru: "Анализ ИИ" },
  deployed: { en: "Deployed", ru: "Развёрнута" },
  retrainBody: {
    en: "Drift or fairness has moved past tolerance on this model. Retrain on recent labelled data before the next promotion window.",
    ru: "Дрейф или справедливость этой модели вышли за пределы допуска. Переобучите на свежих размеченных данных до следующего окна продвижения.",
  },
} as const

const pct = (value: number): string => `${(value * 100).toFixed(1)}%`

const AccuracyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-300 text-sm font-medium mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {(Number(entry.value) * 100).toFixed(2)}%
        </p>
      ))}
    </div>
  )
}

export default function ModelOpsPage() {
  const { t, locale } = useLocale()
  const [models, setModels] = useState<DeployedModel[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Generated client-side only — the engine uses Math.random/Date.now, which would break hydration.
  useEffect(() => {
    const generated = generateDeployedModels(5)
    setModels(generated)
    // The champion is index 0 by construction in the engine.
    setSelectedId(generated.length > 0 ? generated[0].id : null)
  }, [])

  const loading = models.length === 0

  const selectedModel = useMemo(
    () => models.find(m => m.id === selectedId) ?? models[0] ?? null,
    [models, selectedId]
  )

  const summary = useMemo(() => summarizeModelOps(models), [models])

  const bi = (pair: { en: string; ru: string }): string => (locale === "ru" ? pair.ru : pair.en)

  const numberFormat = useMemo(
    () => new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US"),
    [locale]
  )

  const stats = [
    {
      key: "total",
      title: bi(L.totalModels),
      value: String(summary.total),
      icon: Brain,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
    {
      key: "healthy",
      title: bi(HEALTH_META.healthy),
      value: String(summary.healthy),
      icon: Check,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      key: "degrading",
      title: bi(HEALTH_META.degrading),
      value: String(summary.degrading),
      icon: TrendingDown,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      key: "critical",
      title: bi(HEALTH_META.critical),
      value: String(summary.critical),
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      key: "retrain",
      title: t.pages.modelopsRetrain,
      value: String(summary.retrainNeeded),
      icon: RefreshCw,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      key: "fairness",
      title: bi(L.fairnessFailures),
      value: String(summary.fairnessFailures),
      icon: Scale,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      key: "psi",
      title: bi(L.avgPsi),
      value: summary.avgPsi.toFixed(3),
      icon: Gauge,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      key: "predictions",
      title: bi(L.predictionsPerDay),
      value: numberFormat.format(summary.totalPredictions),
      icon: Activity,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
  ]

  const narrativeParagraphs = useMemo(() => {
    if (!selectedModel) return []
    const text = locale === "ru" ? selectedModel.narrative.ru : selectedModel.narrative.en
    return text.split("\n\n").filter(paragraph => paragraph.trim().length > 0)
  }, [selectedModel, locale])

  return (
    <DashboardShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Gauge className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{t.pages.modelopsTitle}</h1>
            <p className="text-slate-400 text-sm">{t.pages.modelopsSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>{t.common.systemOnline}</span>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-t-violet-500 animate-spin" />
          <p className="text-slate-400 text-sm">{t.common.loading}</p>
        </div>
      ) : (
        <>
          {/* Stat row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className={`bg-slate-900/50 border-slate-800/50 ${stat.borderColor}`}>
                  <CardContent className="p-5">
                    <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-slate-400 mt-1">{stat.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Model cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
            {models.map((model, index) => {
              const isSelected = selectedModel?.id === model.id
              const healthMeta = HEALTH_META[model.health]
              return (
                <motion.button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedId(model.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.04 }}
                  className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? "bg-violet-500/10 border-violet-500/30 ring-2 ring-violet-500/40"
                      : "bg-slate-900/50 border-slate-800/50 hover:bg-slate-800/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{model.name}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {model.version} · {model.id}
                      </p>
                    </div>
                    {model.role === "champion" && (
                      <Crown className="w-4 h-4 text-violet-400 shrink-0" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                        ROLE_CLASS[model.role]
                      }`}
                    >
                      {bi(ROLE_LABELS[model.role])}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md border text-[10px] font-semibold"
                      style={{
                        color: healthMeta.color,
                        backgroundColor: `${healthMeta.color}1a`,
                        borderColor: `${healthMeta.color}40`,
                      }}
                    >
                      {bi(healthMeta)}
                    </span>
                  </div>

                  {/* Traffic split */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">{t.pages.modelopsTraffic}</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {model.trafficPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            model.role === "champion"
                              ? VIOLET
                              : model.role === "challenger"
                                ? CYAN
                                : SLATE,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, model.trafficPct)}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.04, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-center mb-3">
                    <div>
                      <p className="text-[10px] text-slate-500 truncate">{t.models.accuracy}</p>
                      <p className="text-xs font-mono font-semibold text-white">
                        {pct(model.accuracy)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 truncate">{t.models.precision}</p>
                      <p className="text-xs font-mono font-semibold text-white">
                        {pct(model.precision)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 truncate">{t.models.recall}</p>
                      <p className="text-xs font-mono font-semibold text-white">
                        {pct(model.recall)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                    <span className="text-slate-500">{bi(L.latencyP99)}</span>
                    <span className="font-mono font-semibold text-cyan-400">
                      {model.latencyP99Ms} ms
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {selectedModel && (
            <div className="space-y-5">
              {/* Retrain banner */}
              {selectedModel.retrainRecommended && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="bg-amber-500/[0.08] border-amber-500/30">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 shrink-0">
                          <RefreshCw className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-amber-300 mb-1">
                            {t.pages.modelopsRetrain}
                          </h3>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {bi(L.retrainBody)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Accuracy trend */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2"
                >
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-white font-semibold">
                        {t.pages.modelopsAccuracyTrend}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedModel.accuracyHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="day"
                              stroke="#64748b"
                              tick={{ fill: "#64748b", fontSize: 12 }}
                            />
                            <YAxis
                              domain={["dataMin - 0.005", "dataMax + 0.002"]}
                              stroke="#64748b"
                              tick={{ fill: "#64748b", fontSize: 12 }}
                              tickFormatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                              width={62}
                            />
                            <Tooltip content={<AccuracyTooltip />} />
                            <Legend
                              wrapperStyle={{ paddingTop: "10px" }}
                              formatter={(value: string) => (
                                <span className="text-slate-400 text-sm">{value}</span>
                              )}
                            />
                            <Line
                              type="monotone"
                              dataKey="accuracy"
                              name={t.models.accuracy}
                              stroke={VIOLET}
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="baseline"
                              name={t.models.baseline}
                              stroke={SLATE}
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Drift status */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Card className="bg-slate-900/50 border-slate-800/50 h-full">
                    <CardHeader>
                      <CardTitle className="text-lg text-white font-semibold">
                        {t.pages.modelopsDrift}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-violet-400" />
                        <p className="text-base font-semibold text-white">
                          {locale === "ru"
                            ? DRIFT_META[selectedModel.driftType].ru
                            : DRIFT_META[selectedModel.driftType].en}
                        </p>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-5">
                        {locale === "ru"
                          ? DRIFT_META[selectedModel.driftType].descRu
                          : DRIFT_META[selectedModel.driftType].descEn}
                      </p>

                      <div className="flex items-end justify-between mb-2">
                        <span className="text-xs text-slate-400">{bi(L.overallPsi)}</span>
                        <span
                          className="text-2xl font-bold font-mono leading-none"
                          style={{
                            color:
                              selectedModel.overallPsi > PSI_ACTION
                                ? RED
                                : selectedModel.overallPsi > PSI_MONITOR
                                  ? AMBER
                                  : EMERALD,
                          }}
                        >
                          {selectedModel.overallPsi.toFixed(3)}
                        </span>
                      </div>

                      {/* PSI bar with the 0.1 monitor and 0.25 action markers */}
                      <div className="relative h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor:
                              selectedModel.overallPsi > PSI_ACTION
                                ? RED
                                : selectedModel.overallPsi > PSI_MONITOR
                                  ? AMBER
                                  : EMERALD,
                          }}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (selectedModel.overallPsi / PSI_SCALE) * 100)}%`,
                          }}
                          transition={{ duration: 0.9, delay: 0.45, ease: "easeOut" }}
                        />
                        <div
                          className="absolute inset-y-0 w-0.5 bg-amber-400/80"
                          style={{ left: `${(PSI_MONITOR / PSI_SCALE) * 100}%` }}
                        />
                        <div
                          className="absolute inset-y-0 w-0.5 bg-red-400/80"
                          style={{ left: `${(PSI_ACTION / PSI_SCALE) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span className="inline-block w-2 h-0.5 bg-amber-400" />
                          {bi(L.monitorThreshold)}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span className="inline-block w-2 h-0.5 bg-red-400" />
                          {bi(L.actionThreshold)}
                        </span>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-800/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">{t.models.auc}</span>
                          <span className="font-mono text-slate-200">
                            {selectedModel.auc.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">{bi(L.predictionsPerDay)}</span>
                          <span className="font-mono text-slate-200">
                            {numberFormat.format(selectedModel.predictionsPerDay)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">{bi(L.deployed)}</span>
                          <span className="font-mono text-slate-200">
                            {selectedModel.deployedAt.toLocaleDateString(
                              locale === "ru" ? "ru-RU" : "en-US"
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Feature drift */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-slate-900/50 border-slate-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white font-semibold">
                      {t.pages.modelopsFeatureDrift}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedModel.featureDrift.map((feature: FeatureDrift, index: number) => (
                        <div key={feature.feature}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                            <div className="flex items-baseline gap-3">
                              <span className="text-sm font-semibold text-white font-mono">
                                {feature.feature}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {feature.baselineMean.toFixed(2)}
                                <span className="mx-1 text-slate-600">&rarr;</span>
                                <span className="text-slate-300">
                                  {feature.currentMean.toFixed(2)}
                                </span>
                              </span>
                            </div>
                            <span
                              className="text-sm font-mono font-semibold"
                              style={{ color: DRIFT_STATUS_COLOR[feature.status] }}
                            >
                              {feature.psi.toFixed(3)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: DRIFT_STATUS_COLOR[feature.status] }}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(100, (feature.psi / PSI_SCALE) * 100)}%`,
                              }}
                              transition={{
                                duration: 0.9,
                                delay: 0.45 + index * 0.05,
                                ease: "easeOut",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Fairness */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Card className="bg-slate-900/50 border-slate-800/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-violet-400" />
                      <CardTitle className="text-lg text-white font-semibold">
                        {t.pages.modelopsFairness}
                      </CardTitle>
                    </div>
                    <p className="text-xs text-slate-500">{bi(L.fourFifths)}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedModel.fairness.map((metric: FairnessMetric, index: number) => (
                        <div
                          key={locale === "ru" ? metric.segment.ru : metric.segment.en}
                          className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold text-white truncate">
                                {locale === "ru" ? metric.segment.ru : metric.segment.en}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                                  metric.passes
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                    : "bg-red-500/10 text-red-400 border-red-500/25"
                                }`}
                              >
                                {metric.passes ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                {metric.passes ? bi(L.pass) : bi(L.fail)}
                              </span>
                            </div>
                            <div className="flex items-center gap-5 text-xs">
                              <div className="text-right">
                                <p className="text-[10px] text-slate-500">{bi(L.approvalRate)}</p>
                                <p className="font-mono font-semibold text-slate-200">
                                  {(metric.approvalRate * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-500">
                                  {bi(L.falsePositiveRate)}
                                </p>
                                <p className="font-mono font-semibold text-slate-200">
                                  {(metric.falsePositiveRate * 100).toFixed(2)}%
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-500">
                                  {t.pages.modelopsDisparateImpact}
                                </p>
                                <p
                                  className="font-mono font-semibold"
                                  style={{ color: metric.passes ? EMERALD : RED }}
                                >
                                  {metric.disparateImpact.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Disparate-impact bar with the explicit 0.8 four-fifths marker */}
                          <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: metric.passes ? EMERALD : RED }}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(
                                  100,
                                  (metric.disparateImpact / DI_SCALE) * 100
                                )}%`,
                              }}
                              transition={{
                                duration: 0.9,
                                delay: 0.5 + index * 0.05,
                                ease: "easeOut",
                              }}
                            />
                            <div
                              className="absolute inset-y-0 w-0.5 bg-white/70"
                              style={{ left: `${(DI_THRESHOLD / DI_SCALE) * 100}%` }}
                            />
                          </div>
                          <div
                            className="relative mt-1 h-3"
                            aria-hidden="true"
                          >
                            <span
                              className="absolute -translate-x-1/2 text-[10px] font-mono text-slate-500"
                              style={{ left: `${(DI_THRESHOLD / DI_SCALE) * 100}%` }}
                            >
                              0.80
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI narrative */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-violet-500/[0.07] border-violet-500/25">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25 shrink-0">
                        <Brain className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white mb-2">
                          {bi(L.aiAnalysis)}
                        </h3>
                        <div className="space-y-3">
                          {narrativeParagraphs.map((paragraph, index) => (
                            <p key={index} className="text-[15px] leading-relaxed text-slate-300">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
