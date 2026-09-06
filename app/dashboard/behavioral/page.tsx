"use client"

// CAREN - Behavioral / Temporal Intelligence page
// Shows how each account's live behaviour deviates from its own learned baseline.

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import {
  Waves,
  Activity,
  Users,
  AlertTriangle,
  Gauge,
  ShieldAlert,
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/lib/locale-context"
import { formatCurrency } from "@/lib/utils"
import {
  generateBehaviorProfiles,
  summarizeBehavior,
  DIMENSION_META,
  type BehaviorProfile,
  type DimensionReading,
} from "@/lib/behavioral"

const VIOLET = "#8b5cf6"
const CYAN = "#06b6d4"
const EMERALD = "#10b981"
const AMBER = "#f59e0b"
const RED = "#ef4444"

/** Alert threshold marked on the drift sparkline — matches `driftDetected` in the engine. */
const DRIFT_THRESHOLD = 45

function driftColor(score: number): string {
  if (score > 70) return RED
  if (score > DRIFT_THRESHOLD) return AMBER
  return EMERALD
}

function driftTextClass(score: number): string {
  if (score > 70) return "text-red-400"
  if (score > DRIFT_THRESHOLD) return "text-amber-400"
  return "text-emerald-400"
}

function driftChipClass(score: number): string {
  if (score > 70) return "bg-red-500/10 text-red-400 border-red-500/20"
  if (score > DRIFT_THRESHOLD) return "bg-amber-500/10 text-amber-400 border-amber-500/20"
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
}

function deviationTextClass(deviationPct: number): string {
  const abs = Math.abs(deviationPct)
  if (abs > 50) return "text-red-400"
  if (abs > 20) return "text-amber-400"
  return "text-emerald-400"
}

function deviationBarColor(deviationPct: number): string {
  const abs = Math.abs(deviationPct)
  if (abs > 50) return RED
  if (abs > 20) return AMBER
  return EMERALD
}

/** Format a reading value according to its declared unit. */
function formatReading(value: number, unit: DimensionReading["unit"]): string {
  if (unit === "currency") return formatCurrency(value)
  if (unit === "percent") return `${value.toFixed(1)}%`
  return value.toFixed(1)
}

const DriftTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-300 text-sm font-medium mb-1">{label}</p>
      <p className="text-sm" style={{ color: VIOLET }}>
        {Number(payload[0].value).toFixed(1)}
      </p>
    </div>
  )
}

const RadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-300 text-sm font-medium mb-1">
        {payload[0].payload.dimension}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toFixed(0)}
        </p>
      ))}
    </div>
  )
}

export default function BehavioralPage() {
  const { t, locale } = useLocale()
  const [profiles, setProfiles] = useState<BehaviorProfile[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Generated client-side only — the engine uses Math.random, which would break hydration.
  useEffect(() => {
    const generated = generateBehaviorProfiles(14)
    setProfiles(generated)
    setSelectedId(generated.length > 0 ? generated[0].accountId : null)
  }, [])

  const loading = profiles.length === 0

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => b.driftScore - a.driftScore),
    [profiles]
  )

  const selectedProfile = useMemo(
    () => sortedProfiles.find(p => p.accountId === selectedId) ?? sortedProfiles[0] ?? null,
    [sortedProfiles, selectedId]
  )

  const summary = useMemo(() => summarizeBehavior(profiles), [profiles])

  const dimensionLabel = (reading: DimensionReading): string =>
    locale === "ru" ? DIMENSION_META[reading.dimension].ru : DIMENSION_META[reading.dimension].en

  const radarData = useMemo(() => {
    if (!selectedProfile) return []
    return selectedProfile.readings.map(reading => {
      const scale = Math.max(reading.baseline, reading.current, 0.0001)
      return {
        dimension: dimensionLabel(reading),
        baseline: (reading.baseline / scale) * 100,
        current: (reading.current / scale) * 100,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProfile, locale])

  const severeDriftLabel = locale === "ru" ? "Сильный дрейф" : "Severe Drift"

  const stats = [
    {
      key: "accountsMonitored",
      title: t.behavioral.accountsMonitored,
      value: String(summary.accountsMonitored),
      icon: Users,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
    {
      key: "driftAlerts",
      title: t.behavioral.driftAlerts,
      value: String(summary.driftAlerts),
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      key: "avgDrift",
      title: t.behavioral.avgDrift,
      value: summary.avgDrift.toFixed(1),
      icon: Gauge,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      key: "severeDrift",
      title: severeDriftLabel,
      value: String(summary.severeDrift),
      icon: ShieldAlert,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
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
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Waves className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{t.behavioral.title}</h1>
            <p className="text-slate-400 text-sm">{t.behavioral.subtitle}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Account list */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white font-semibold">
                    {t.behavioral.profileChanges}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                    {sortedProfiles.map((profile, index) => {
                      const isSelected = selectedProfile?.accountId === profile.accountId
                      return (
                        <motion.button
                          key={profile.accountId}
                          type="button"
                          onClick={() => setSelectedId(profile.accountId)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 + index * 0.03 }}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                            isSelected
                              ? "bg-violet-500/10 border-violet-500/30 ring-2 ring-violet-500/40"
                              : "bg-slate-800/30 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-white truncate">
                              {profile.accountName}
                            </span>
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-md border text-xs font-bold ${driftChipClass(
                                profile.driftScore
                              )}`}
                            >
                              {profile.driftScore.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-700/40 text-[10px] font-medium text-slate-300">
                              {profile.segment}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 truncate">
                              {profile.accountId}
                            </span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: driftColor(profile.driftScore) }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, profile.driftScore)}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + index * 0.03, ease: "easeOut" }}
                            />
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Selected profile detail */}
            <div className="lg:col-span-2 space-y-5">
              {!selectedProfile ? (
                <Card className="bg-slate-900/50 border-slate-800/50">
                  <CardContent className="p-10 text-center text-slate-400 text-sm">
                    {t.behavioral.selectAccount}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Drift score hero */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                          <div>
                            <p className="text-sm text-slate-400 mb-1">
                              {t.behavioral.driftScore}
                            </p>
                            <div className="flex items-end gap-3">
                              <span
                                className={`text-5xl font-bold leading-none ${driftTextClass(
                                  selectedProfile.driftScore
                                )}`}
                              >
                                {selectedProfile.driftScore.toFixed(1)}
                              </span>
                              <Badge
                                variant={selectedProfile.driftDetected ? "destructive" : "success"}
                                className="mb-1"
                              >
                                {selectedProfile.driftDetected
                                  ? t.behavioral.driftDetected
                                  : t.behavioral.stable}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-300 mt-3 font-medium">
                              {selectedProfile.accountName}
                              <span className="text-slate-500 font-mono text-xs ml-2">
                                {selectedProfile.accountId}
                              </span>
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-xs text-slate-500 mb-1">
                              {t.behavioral.analysisWindow}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-cyan-400 font-semibold">
                                {selectedProfile.baselineDays}
                              </span>{" "}
                              {t.common.days} {t.behavioral.baseline.toLowerCase()}
                              <span className="text-slate-600 mx-2">/</span>
                              <span className="text-violet-400 font-semibold">
                                {selectedProfile.observationDays}
                              </span>{" "}
                              {t.common.days} {t.behavioral.currentBehavior.toLowerCase()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* AI insight */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-violet-500/[0.07] border-violet-500/25">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25 shrink-0">
                            <Brain className="w-5 h-5 text-violet-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-sm font-semibold text-white">
                                {t.behavioral.insight}
                              </h3>
                              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            </div>
                            <p className="text-[15px] leading-7 text-slate-300">
                              {locale === "ru"
                                ? selectedProfile.insightRu
                                : selectedProfile.insightEn}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Drift history sparkline */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardHeader>
                        <CardTitle className="text-lg text-white font-semibold">
                          {t.behavioral.driftScore} · {t.common.timeline}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[240px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedProfile.driftHistory}>
                              <defs>
                                <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={VIOLET} stopOpacity={0.4} />
                                  <stop offset="95%" stopColor={VIOLET} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis
                                dataKey="day"
                                stroke="#64748b"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                              />
                              <YAxis
                                domain={[0, 100]}
                                stroke="#64748b"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                              />
                              <Tooltip content={<DriftTooltip />} />
                              <ReferenceLine
                                y={DRIFT_THRESHOLD}
                                stroke={AMBER}
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                              />
                              <Area
                                type="monotone"
                                dataKey="drift"
                                name={t.behavioral.driftScore}
                                stroke={VIOLET}
                                strokeWidth={2}
                                fill="url(#driftGradient)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Radar comparison */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardHeader>
                        <CardTitle className="text-lg text-white font-semibold">
                          {t.behavioral.baselineProfile} · {t.behavioral.currentBehavior}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[320px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                              <PolarGrid stroke="#1e293b" />
                              <PolarAngleAxis
                                dataKey="dimension"
                                tick={{ fill: "#64748b", fontSize: 11 }}
                              />
                              <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={{ fill: "#64748b", fontSize: 10 }}
                                stroke="#1e293b"
                              />
                              <Radar
                                name={t.behavioral.baselineProfile}
                                dataKey="baseline"
                                stroke={CYAN}
                                fill={CYAN}
                                fillOpacity={0.18}
                                strokeWidth={2}
                              />
                              <Radar
                                name={t.behavioral.currentBehavior}
                                dataKey="current"
                                stroke={VIOLET}
                                fill={VIOLET}
                                fillOpacity={0.25}
                                strokeWidth={2}
                              />
                              <Legend
                                wrapperStyle={{ paddingTop: "10px" }}
                                formatter={(value: string) => (
                                  <span className="text-slate-400 text-sm">{value}</span>
                                )}
                              />
                              <Tooltip content={<RadarTooltip />} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Dimension breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardHeader>
                        <CardTitle className="text-lg text-white font-semibold">
                          {t.behavioral.dimension}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left border-b border-slate-800">
                                <th className="pb-3 pr-4 font-medium text-slate-400">
                                  {t.behavioral.dimension}
                                </th>
                                <th className="pb-3 pr-4 font-medium text-slate-400 text-right">
                                  {t.behavioral.baseline}
                                </th>
                                <th className="pb-3 pr-4 font-medium text-slate-400 text-right">
                                  {t.behavioral.current}
                                </th>
                                <th className="pb-3 font-medium text-slate-400 text-right">
                                  {t.behavioral.deviation}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedProfile.readings.map((reading, index) => {
                                const positive = reading.deviationPct >= 0
                                const DeviationIcon = positive ? TrendingUp : TrendingDown
                                return (
                                  <tr
                                    key={reading.dimension}
                                    className="border-b border-slate-800/50 last:border-0"
                                  >
                                    <td className="py-3 pr-4">
                                      <p className="text-white font-medium">
                                        {dimensionLabel(reading)}
                                      </p>
                                      <div className="mt-2 h-1 w-full max-w-[180px] rounded-full bg-slate-800 overflow-hidden">
                                        <motion.div
                                          className="h-full rounded-full"
                                          style={{
                                            backgroundColor: deviationBarColor(reading.deviationPct),
                                          }}
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${Math.min(
                                              100,
                                              Math.abs(reading.deviationPct)
                                            )}%`,
                                          }}
                                          transition={{
                                            duration: 0.9,
                                            delay: 0.5 + index * 0.06,
                                            ease: "easeOut",
                                          }}
                                        />
                                      </div>
                                    </td>
                                    <td className="py-3 pr-4 text-right font-mono text-slate-400 align-top">
                                      {formatReading(reading.baseline, reading.unit)}
                                    </td>
                                    <td className="py-3 pr-4 text-right font-mono text-slate-200 align-top">
                                      {formatReading(reading.current, reading.unit)}
                                    </td>
                                    <td className="py-3 text-right align-top">
                                      <span
                                        className={`inline-flex items-center gap-1 font-semibold ${deviationTextClass(
                                          reading.deviationPct
                                        )}`}
                                      >
                                        <DeviationIcon className="w-3.5 h-3.5" />
                                        {positive ? "+" : "-"}
                                        {Math.abs(reading.deviationPct).toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
