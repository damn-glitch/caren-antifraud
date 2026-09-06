"use client"

// CAREN - Synthetic Identity Detection page
// Master-detail view over fabricated identities: score, fired signals, clusters and narrative.

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  UserSearch,
  AlertTriangle,
  Users,
  TrendingUp,
  FileWarning,
  Fingerprint,
  Sparkles,
  CreditCard,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/lib/locale-context"
import { formatCurrency } from "@/lib/utils"
import {
  generateSyntheticIdentities,
  summarizeSynthetic,
  SIGNAL_META,
  type SyntheticIdentity,
} from "@/lib/synthetic-identity"

const RED = "#ef4444"
const ORANGE = "#f97316"
const AMBER = "#f59e0b"
const EMERALD = "#10b981"

type Verdict = SyntheticIdentity["verdict"]

/**
 * The engine ships no label map for verdicts, so it lives here — same
 * bilingual shape the library uses for SIGNAL_META.
 */
const VERDICT_LABELS: Record<Verdict, { en: string; ru: string }> = {
  confirmed_synthetic: { en: "Confirmed synthetic", ru: "Подтверждённая синтетика" },
  probable_synthetic: { en: "Probable synthetic", ru: "Вероятная синтетика" },
  inconclusive: { en: "Inconclusive", ru: "Неоднозначно" },
  likely_genuine: { en: "Likely genuine", ru: "Скорее добросовестный" },
}

const VERDICT_BADGE: Record<Verdict, "critical" | "destructive" | "warning" | "success"> = {
  confirmed_synthetic: "critical",
  probable_synthetic: "destructive",
  inconclusive: "warning",
  likely_genuine: "success",
}

const VERDICT_COLOR: Record<Verdict, string> = {
  confirmed_synthetic: RED,
  probable_synthetic: ORANGE,
  inconclusive: AMBER,
  likely_genuine: EMERALD,
}

/** Small bilingual strings this page needs that the shared dictionary does not carry. */
const FACT_LABELS = {
  creditGrowth: { en: "Credit limit growth", ru: "Рост кредитного лимита" },
  linkedApplications: { en: "Linked applications", ru: "Связанные заявки" },
  estimatedLoss: { en: "Estimated loss", ru: "Оценка убытка" },
  accounts: { en: "accounts", ru: "счетов" },
  reviewed: { en: "Identities reviewed", ru: "Проверено личностей" },
  narrative: { en: "AI narrative", ru: "Заключение ИИ" },
} as const

const VERDICT_TEXT: Record<Verdict, string> = {
  confirmed_synthetic: "text-red-400",
  probable_synthetic: "text-orange-400",
  inconclusive: "text-amber-400",
  likely_genuine: "text-emerald-400",
}

/** Circular score ring — radius/circumference are fixed so the dash math stays exact. */
const RING_SIZE = 148
const RING_RADIUS = 62
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function SyntheticPage() {
  const { t, locale } = useLocale()
  const [identities, setIdentities] = useState<SyntheticIdentity[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Generated client-side only — the engine uses Math.random/Date.now, which would break hydration.
  useEffect(() => {
    const generated = generateSyntheticIdentities(20)
    setIdentities(generated)
    setSelectedId(generated.length > 0 ? generated[0].id : null)
  }, [])

  const loading = identities.length === 0

  const summary = useMemo(() => summarizeSynthetic(identities), [identities])

  const selected = useMemo(
    () => identities.find(i => i.id === selectedId) ?? identities[0] ?? null,
    [identities, selectedId]
  )

  /** Pick the active language out of any bilingual object shipped by the lib. */
  const bi = (value: { en: string; ru: string }): string => (locale === "ru" ? value.ru : value.en)

  const verdictLabel = (verdict: Verdict): string => bi(VERDICT_LABELS[verdict])

  /** Fired signals, strongest first, with each weight as a share of the local maximum. */
  const signalRows = useMemo(() => {
    if (!selected) return []
    const rows = selected.signals.map(signal => ({
      signal,
      meta: SIGNAL_META[signal],
    }))
    const maxWeight = rows.reduce((max, row) => Math.max(max, row.meta.weight), 0) || 1
    return rows
      .map(row => ({
        ...row,
        label: locale === "ru" ? row.meta.ru : row.meta.en,
        description: locale === "ru" ? row.meta.descRu : row.meta.descEn,
        sharePct: (row.meta.weight / maxWeight) * 100,
      }))
      .sort((a, b) => b.meta.weight - a.meta.weight)
  }, [selected, locale])

  const narrativeParagraphs = useMemo(() => {
    if (!selected) return []
    const text = locale === "ru" ? selected.narrative.ru : selected.narrative.en
    return text.split("\n\n").filter(paragraph => paragraph.trim().length > 0)
  }, [selected, locale])

  const stats = [
    {
      key: "total",
      title: bi(FACT_LABELS.reviewed),
      value: String(summary.total),
      icon: UserSearch,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
    {
      key: "confirmed",
      title: verdictLabel("confirmed_synthetic"),
      value: String(summary.confirmed),
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      key: "probable",
      title: verdictLabel("probable_synthetic"),
      value: String(summary.probable),
      icon: FileWarning,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      key: "clusters",
      title: t.pages.syntheticCluster,
      value: String(summary.clusters),
      icon: Users,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      key: "exposure",
      title: t.pages.syntheticExposure,
      value: formatCurrency(summary.exposureAtRisk),
      icon: CreditCard,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
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
            <Fingerprint className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{t.pages.syntheticTitle}</h1>
            <p className="text-slate-400 text-sm">{t.pages.syntheticSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <UserSearch className="w-4 h-4 text-emerald-400" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                    <p className="text-2xl font-bold text-white truncate">{stat.value}</p>
                    <p className="text-sm text-slate-400 mt-1">{stat.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Identity list */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white font-semibold">
                    {bi(FACT_LABELS.reviewed)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
                    {identities.map((identity, index) => {
                      const isSelected = selected?.id === identity.id
                      return (
                        <motion.button
                          key={identity.id}
                          type="button"
                          onClick={() => setSelectedId(identity.id)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 + index * 0.02 }}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                            isSelected
                              ? "bg-violet-500/10 border-violet-500/30 ring-2 ring-violet-500/40"
                              : "bg-slate-800/30 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-white truncate">
                              {identity.applicantName}
                            </span>
                            <span
                              className={`shrink-0 text-sm font-bold ${
                                VERDICT_TEXT[identity.verdict]
                              }`}
                            >
                              {identity.syntheticScore.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[11px] font-mono text-slate-500 truncate">
                              {identity.accountId}
                            </span>
                            <Badge
                              variant={VERDICT_BADGE[identity.verdict]}
                              className="shrink-0 px-2 py-0 text-[10px]"
                            >
                              {verdictLabel(identity.verdict)}
                            </Badge>
                          </div>
                          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: VERDICT_COLOR[identity.verdict] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, identity.syntheticScore)}%` }}
                              transition={{
                                duration: 0.8,
                                delay: 0.3 + index * 0.02,
                                ease: "easeOut",
                              }}
                            />
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Selected identity detail */}
            <div className="lg:col-span-2 space-y-5">
              {!selected ? (
                <Card className="bg-slate-900/50 border-slate-800/50">
                  <CardContent className="p-10 text-center text-slate-400 text-sm">
                    {t.common.noResults}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Score ring + key facts */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                          <div className="relative shrink-0 mx-auto sm:mx-0">
                            <svg
                              width={RING_SIZE}
                              height={RING_SIZE}
                              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                              className="-rotate-90"
                            >
                              <circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RING_RADIUS}
                                fill="none"
                                stroke="#1e293b"
                                strokeWidth={10}
                              />
                              <motion.circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RING_RADIUS}
                                fill="none"
                                stroke={VERDICT_COLOR[selected.verdict]}
                                strokeWidth={10}
                                strokeLinecap="round"
                                strokeDasharray={RING_CIRCUMFERENCE}
                                initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                                animate={{
                                  strokeDashoffset:
                                    RING_CIRCUMFERENCE *
                                    (1 - Math.min(100, selected.syntheticScore) / 100),
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span
                                className={`text-4xl font-bold leading-none ${
                                  VERDICT_TEXT[selected.verdict]
                                }`}
                              >
                                {selected.syntheticScore.toFixed(0)}
                              </span>
                              <span className="text-[11px] text-slate-500 mt-1 px-4 text-center">
                                {t.pages.syntheticScore}
                              </span>
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <h2 className="text-xl font-bold text-white">
                                {selected.applicantName}
                              </h2>
                              <Badge variant={VERDICT_BADGE[selected.verdict]}>
                                {verdictLabel(selected.verdict)}
                              </Badge>
                            </div>
                            <p className="text-xs font-mono text-slate-500 mb-5">
                              {selected.accountId}
                            </p>

                            {/* Key facts */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">
                                  {t.pages.syntheticFileAge}
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  {selected.fileAgeMonths}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">
                                  {bi(FACT_LABELS.creditGrowth)}
                                </p>
                                <p className="text-lg font-semibold text-amber-400 inline-flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" />+
                                  {selected.creditLimitGrowth.toFixed(0)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">
                                  {bi(FACT_LABELS.linkedApplications)}
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  {selected.linkedApplications}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">
                                  {bi(FACT_LABELS.estimatedLoss)}
                                </p>
                                <p className="text-lg font-semibold text-red-400">
                                  {formatCurrency(selected.estimatedLoss)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Cluster */}
                  {selected.clusterId && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-800/50 border-cyan-500/20">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                              <Users className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">
                                {t.pages.syntheticCluster}
                              </p>
                              <p className="text-sm text-slate-400 mt-0.5">
                                <span className="font-mono text-cyan-400">
                                  {selected.clusterId}
                                </span>
                                {selected.clusterSize !== undefined && (
                                  <>
                                    <span className="text-slate-600 mx-2">/</span>
                                    <span className="text-white font-semibold">
                                      {selected.clusterSize}
                                    </span>{" "}
                                    {bi(FACT_LABELS.accounts)}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Detected signals */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardHeader>
                        <CardTitle className="text-lg text-white font-semibold">
                          {t.pages.syntheticSignals}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {signalRows.map((row, index) => (
                            <motion.div
                              key={row.signal}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                              className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/60"
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <p className="text-sm font-semibold text-white">{row.label}</p>
                                <span className="shrink-0 text-xs font-mono text-violet-400">
                                  {row.meta.weight.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                {row.description}
                              </p>
                              <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-violet-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${row.sharePct}%` }}
                                  transition={{
                                    duration: 0.8,
                                    delay: 0.45 + index * 0.05,
                                    ease: "easeOut",
                                  }}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* AI narrative */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-violet-500/[0.07] border-violet-500/25">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25 shrink-0">
                            <Sparkles className="w-5 h-5 text-violet-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white mb-3">
                              {bi(FACT_LABELS.narrative)}
                            </h3>
                            <div className="space-y-4">
                              {narrativeParagraphs.map((paragraph, index) => (
                                <p
                                  key={index}
                                  className="text-[15px] leading-relaxed text-slate-300"
                                >
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          </div>
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
