"use client"

// CAREN - Intelligent Alert Triage
// Author: Alisher Beisembekov

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Zap,
  Filter,
  Loader2,
  ChevronDown,
  TrendingDown,
  Clock,
  Bell,
  ShieldCheck,
  Layers,
  Link2,
  Gauge,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import {
  runTriage,
  SUPPRESSION_LABELS,
  type TriageResult,
  type TriageStage,
  type TriagedCase,
} from "@/lib/alert-triage"
import { formatCurrency, formatNumber } from "@/lib/utils"

const RAW_ALERT_VOLUME = 2000
const PROCESSING_MS = 1500

/** Violet -> emerald progression: the funnel visibly "cools down" as it narrows. */
const STAGE_BAR_GRADIENT = [
  "from-violet-600 to-violet-400",
  "from-violet-500 to-indigo-400",
  "from-indigo-500 to-sky-400",
  "from-sky-500 to-teal-400",
  "from-teal-500 to-emerald-400",
  "from-emerald-500 to-emerald-300",
]

const STAGE_DOT_COLOR = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-emerald-400",
]

const PRIORITY_BADGE: Record<
  TriagedCase["priority"],
  "critical" | "warning" | "secondary"
> = {
  P1: "critical",
  P2: "warning",
  P3: "secondary",
}

const PRIORITY_BORDER: Record<TriagedCase["priority"], string> = {
  P1: "border-l-red-500",
  P2: "border-l-amber-400",
  P3: "border-l-slate-600",
}

function scoreColor(score: number): string {
  if (score > 88) return "text-red-400"
  if (score > 72) return "text-amber-400"
  return "text-violet-300"
}

export default function TriagePage() {
  const { t, locale } = useLocale()

  const [result, setResult] = useState<TriageResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null)
  // Bumped on every run so the funnel bars replay their entrance animation.
  const [runToken, setRunToken] = useState(0)

  // runTriage() uses Math.random()/Date.now(), so it must stay client-only to
  // avoid a server/client hydration mismatch.
  useEffect(() => {
    setResult(runTriage(RAW_ALERT_VOLUME))
  }, [])

  const handleRunTriage = useCallback(() => {
    setIsRunning(true)
    setExpandedCaseId(null)
    window.setTimeout(() => {
      setResult(runTriage(RAW_ALERT_VOLUME))
      setRunToken((prev) => prev + 1)
      setIsRunning(false)
    }, PROCESSING_MS)
  }, [])

  const stageLabel = useCallback(
    (stage: TriageStage) => (locale === "ru" ? stage.labelRu : stage.labelEn),
    [locale]
  )

  const stageDescription = useCallback(
    (stage: TriageStage) =>
      locale === "ru" ? stage.descriptionRu : stage.descriptionEn,
    [locale]
  )

  const toggleCase = useCallback((caseId: string) => {
    setExpandedCaseId((prev) => (prev === caseId ? null : caseId))
  }, [])

  const maxSuppression = result
    ? Math.max(...result.suppression.map((s) => s.count), 1)
    : 1

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Filter className="w-6 h-6 text-violet-400" />
              {t.triage.title}
            </h1>
            <p className="text-slate-400 text-sm">{t.triage.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 px-3 py-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              {t.alerts.carenActive}
            </Badge>
            <Button size="sm" onClick={handleRunTriage} disabled={isRunning}>
              {isRunning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isRunning ? t.common.generating : t.triage.runTriage}
            </Button>
          </div>
        </motion.div>

        {!result ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            {t.common.loading}
          </div>
        ) : (
          <>
            {/* ---- Hero stat row ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {t.triage.rawAlerts}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-slate-500" />
                    <span className="text-2xl font-bold text-white">
                      {formatNumber(result.rawAlerts)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {t.triage.finalCases}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-violet-400" />
                    <span className="text-2xl font-bold text-violet-300">
                      {formatNumber(result.finalCases)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* The headline metric of the whole product. */}
              <Card className="bg-slate-900/50 border-emerald-500/20 sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {t.triage.noiseReduction}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <TrendingDown className="w-6 h-6 text-emerald-400 self-center" />
                    <span className="text-5xl font-extrabold text-emerald-400 tracking-tight">
                      {result.noiseReduction.toFixed(1)}
                    </span>
                    <span className="text-2xl font-bold text-emerald-500/70">
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {t.triage.analystHoursSaved}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <span className="text-2xl font-bold text-emerald-400">
                      {formatNumber(result.analystHoursSaved)}
                    </span>
                    <span className="text-sm text-slate-500">
                      {t.common.hours}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ---- Funnel visualization ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    {t.triage.pipeline}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {result.stages.map((stage, index) => {
                    const widthPct = Math.max(
                      2,
                      (stage.output / result.rawAlerts) * 100
                    )
                    const reduction =
                      stage.input > 0
                        ? ((stage.input - stage.output) / stage.input) * 100
                        : 0

                    return (
                      <div key={stage.key} className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span
                              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                                STAGE_DOT_COLOR[index % STAGE_DOT_COLOR.length]
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">
                                {stageLabel(stage)}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {stageDescription(stage)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs shrink-0 sm:ml-4 pl-[18px] sm:pl-0">
                            <span className="text-slate-500">
                              {t.triage.input}:{" "}
                              <span className="text-slate-300 font-mono">
                                {formatNumber(stage.input)}
                              </span>
                            </span>
                            <span className="text-slate-600">&rarr;</span>
                            <span className="text-slate-500">
                              {t.triage.output}:{" "}
                              <span className="text-white font-mono font-semibold">
                                {formatNumber(stage.output)}
                              </span>
                            </span>
                            {reduction > 0 && (
                              <span className="text-emerald-400 font-mono">
                                -{reduction.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="h-3 w-full rounded-full bg-slate-800/60 overflow-hidden">
                          <motion.div
                            key={`${stage.key}-${runToken}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{
                              duration: 0.8,
                              delay: 0.1 * index,
                              ease: "easeOut",
                            }}
                            className={`h-full rounded-full bg-gradient-to-r ${
                              STAGE_BAR_GRADIENT[
                                index % STAGE_BAR_GRADIENT.length
                              ]
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* ---- Suppression breakdown ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    {t.triage.suppressionReasons}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.suppression.map((entry, index) => {
                    const label = SUPPRESSION_LABELS[entry.reason]
                    const widthPct = Math.max(
                      2,
                      (entry.count / maxSuppression) * 100
                    )

                    return (
                      <div key={entry.reason} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-300 min-w-0 truncate">
                            {locale === "ru" ? label.ru : label.en}
                          </span>
                          <span className="text-sm font-mono font-semibold text-white shrink-0">
                            {formatNumber(entry.count)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800/60 overflow-hidden">
                          <motion.div
                            key={`${entry.reason}-${runToken}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{
                              duration: 0.7,
                              delay: 0.05 * index,
                              ease: "easeOut",
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* ---- Prioritized case queue ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    {t.triage.caseQueue}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.cases.map((triagedCase) => {
                    const isExpanded = expandedCaseId === triagedCase.id

                    return (
                      <div
                        key={triagedCase.id}
                        className={`rounded-xl border border-slate-800/50 border-l-4 bg-slate-950/40 overflow-hidden ${
                          PRIORITY_BORDER[triagedCase.priority]
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCase(triagedCase.id)}
                          aria-expanded={isExpanded}
                          className="w-full text-left p-4 transition-colors hover:bg-slate-900/60"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Badge
                                variant={
                                  PRIORITY_BADGE[triagedCase.priority]
                                }
                                className="shrink-0"
                              >
                                {triagedCase.priority}
                              </Badge>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs text-slate-500">
                                    {triagedCase.id}
                                  </span>
                                  <span className="text-xs text-slate-600">
                                    &middot;
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {triagedCase.accountName}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-white truncate mt-0.5">
                                  {locale === "ru"
                                    ? triagedCase.title.ru
                                    : triagedCase.title.en}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 flex-wrap shrink-0 text-xs pl-1 lg:pl-0">
                              <div className="flex items-center gap-1.5">
                                <Gauge className="w-3.5 h-3.5 text-slate-500" />
                                <span
                                  className={`font-mono font-semibold text-sm ${scoreColor(
                                    triagedCase.score
                                  )}`}
                                >
                                  {triagedCase.score.toFixed(1)}
                                </span>
                              </div>

                              <div
                                className="flex items-center gap-1.5 text-slate-400"
                                title={t.triage.linkedAlerts}
                              >
                                <Link2 className="w-3.5 h-3.5 text-slate-500" />
                                <span className="font-mono">
                                  {triagedCase.linkedAlerts}
                                </span>
                              </div>

                              <span className="font-mono text-amber-300">
                                {formatCurrency(triagedCase.exposure)}
                              </span>

                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span className="font-mono">
                                  {triagedCase.slaMinutes} {t.common.minutes}
                                </span>
                              </div>

                              <motion.span
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-slate-500"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </motion.span>
                            </div>
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              key="signals"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 border-t border-slate-800/50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mt-3 mb-3">
                                  {t.triage.whyThisCase}
                                </p>
                                <div className="space-y-3">
                                  {triagedCase.signals.map((signal, index) => (
                                    <div
                                      key={`${triagedCase.id}-signal-${index}`}
                                      className="space-y-1"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-slate-300 min-w-0">
                                          {locale === "ru"
                                            ? signal.ru
                                            : signal.en}
                                        </span>
                                        <span className="text-xs font-mono text-slate-400 shrink-0">
                                          {(signal.weight * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full rounded-full bg-slate-800/60 overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${Math.min(
                                              100,
                                              signal.weight * 400
                                            )}%`,
                                          }}
                                          transition={{
                                            duration: 0.5,
                                            delay: 0.05 * index,
                                            ease: "easeOut",
                                          }}
                                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                  <span>
                                    {t.common.confidence}:{" "}
                                    <span className="text-slate-300 font-mono">
                                      {(triagedCase.confidence * 100).toFixed(
                                        1
                                      )}
                                      %
                                    </span>
                                  </span>
                                  <span>
                                    {t.triage.signals}:{" "}
                                    <span className="text-slate-300 font-mono">
                                      {triagedCase.signals.length}
                                    </span>
                                  </span>
                                  <span className="font-mono">
                                    {triagedCase.accountId}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
