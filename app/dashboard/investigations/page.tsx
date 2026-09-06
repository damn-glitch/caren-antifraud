"use client"

// CAREN - Investigation Copilot
// The flagship page: a complete, defensible case file assembled in ~30 seconds.
// Author: Alisher Beisembekov

import { useState, useEffect, useCallback, useMemo } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import { formatCurrency } from "@/lib/utils"
import {
  CaseFile,
  EvidenceItem,
  TimelineEvent,
  RecommendedAction,
  INVESTIGATION_STAGES,
  VERDICT_META,
  generateCaseFile,
} from "@/lib/investigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSearch,
  Gauge,
  Link2,
  Loader2,
  MapPin,
  Network,
  Scale,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Timer,
  UserCheck,
  Users,
  Zap,
} from "lucide-react"

type Phase = "idle" | "generating" | "done"

const TOTAL_STAGE_MS = INVESTIGATION_STAGES.reduce((sum, s) => sum + s.ms, 0)

/** Icon per evidence category. */
const EVIDENCE_ICON: Record<EvidenceItem["category"], React.ReactNode> = {
  device: <Smartphone className="w-4 h-4" />,
  geo: <MapPin className="w-4 h-4" />,
  behavioral: <Activity className="w-4 h-4" />,
  network: <Network className="w-4 h-4" />,
  transactional: <CreditCard className="w-4 h-4" />,
  identity: <UserCheck className="w-4 h-4" />,
}

/** Category chip label — the dictionary has no per-category keys, so pair them here. */
const EVIDENCE_CATEGORY_LABEL: Record<EvidenceItem["category"], { en: string; ru: string }> = {
  device: { en: "Device", ru: "Устройство" },
  geo: { en: "Geo", ru: "Гео" },
  behavioral: { en: "Behavioral", ru: "Поведение" },
  network: { en: "Network", ru: "Сеть" },
  transactional: { en: "Transactional", ru: "Транзакции" },
  identity: { en: "Identity", ru: "Личность" },
}

const SEVERITY_DOT: Record<TimelineEvent["severity"], string> = {
  info: "bg-blue-400 ring-blue-400/20",
  warning: "bg-amber-400 ring-amber-400/20",
  critical: "bg-red-500 ring-red-500/20",
}

const SEVERITY_TEXT: Record<TimelineEvent["severity"], string> = {
  info: "text-blue-400",
  warning: "text-amber-400",
  critical: "text-red-400",
}

const URGENCY_META: Record<
  RecommendedAction["urgency"],
  { en: string; ru: string; className: string }
> = {
  immediate: {
    en: "Immediate",
    ru: "Немедленно",
    className: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  today: {
    en: "Today",
    ru: "Сегодня",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  this_week: {
    en: "This Week",
    ru: "На этой неделе",
    className: "bg-slate-700/40 text-slate-300 border-slate-600/50",
  },
}

function riskBarColor(risk: number): string {
  if (risk >= 80) return "bg-red-500"
  if (risk >= 60) return "bg-orange-500"
  if (risk >= 40) return "bg-amber-400"
  return "bg-emerald-500"
}

export default function InvestigationsPage() {
  const { t, locale } = useLocale()

  const [phase, setPhase] = useState<Phase>("idle")
  const [stageIndex, setStageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null)

  const startGeneration = useCallback(() => {
    setCaseFile(null)
    setStageIndex(0)
    setProgress(0)
    setPhase("generating")
  }, [])

  const resetInvestigation = useCallback(() => {
    setCaseFile(null)
    setStageIndex(0)
    setProgress(0)
    setPhase("idle")
  }, [])

  // Step through the copilot stages, then assemble the case file.
  useEffect(() => {
    if (phase !== "generating") return

    const timers: ReturnType<typeof setTimeout>[] = []
    let elapsed = 0

    INVESTIGATION_STAGES.forEach((stage, i) => {
      elapsed += stage.ms
      timers.push(
        setTimeout(() => {
          if (i < INVESTIGATION_STAGES.length - 1) {
            setStageIndex(i + 1)
          } else {
            setProgress(100)
            setCaseFile(generateCaseFile())
            setPhase("done")
          }
        }, elapsed)
      )
    })

    const startedAt = Date.now()
    const ticker = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startedAt) / TOTAL_STAGE_MS) * 100)
      setProgress(pct)
    }, 40)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(ticker)
    }
  }, [phase])

  const verdictMeta = caseFile ? VERDICT_META[caseFile.verdict] : null

  const timeSavedPercent = useMemo(() => {
    if (!caseFile) return 0
    const manualSeconds = caseFile.manualEstimateMinutes * 60
    return Math.round((1 - caseFile.generatedInSeconds / manualSeconds) * 100)
  }, [caseFile])

  const summary = caseFile ? (locale === "ru" ? caseFile.summaryRu : caseFile.summaryEn) : ""
  const keyFindings = caseFile
    ? locale === "ru"
      ? caseFile.keyFindingsRu
      : caseFile.keyFindingsEn
    : []

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* ---------- Header ---------- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <FileSearch className="w-6 h-6 text-violet-400" />
              {t.investigations.title}
            </h1>
            <p className="text-slate-400 text-sm">{t.investigations.subtitle}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="border-violet-500/30 text-violet-300 px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {t.common.appName}
            </Badge>
            {phase === "done" && (
              <Button variant="outline" size="sm" onClick={resetInvestigation}>
                <Sparkles className="w-4 h-4 mr-1.5" />
                {t.investigations.newInvestigation}
              </Button>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ---------- Empty state ---------- */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-slate-900/50 border-slate-800/50 border-dashed">
                <CardContent className="py-20 px-6 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/30 flex items-center justify-center">
                      <FileSearch className="w-9 h-9 text-violet-300" />
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-white mb-2">
                    {t.investigations.selectCase}
                  </h2>
                  <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
                    {t.investigations.subtitle}
                  </p>

                  <Button size="xl" onClick={startGeneration}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {t.investigations.generateCase}
                  </Button>

                  <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                    {[
                      { icon: <Scale className="w-4 h-4" />, label: t.investigations.evidenceChain },
                      { icon: <Clock className="w-4 h-4" />, label: t.investigations.eventTimeline },
                      {
                        icon: <Zap className="w-4 h-4" />,
                        label: t.investigations.recommendedActions,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-xs text-slate-400"
                      >
                        <span className="text-violet-400">{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ---------- Generating ---------- */}
          {phase === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="py-14 px-6">
                  <div className="max-w-xl mx-auto">
                    <div className="flex items-center justify-center mb-8">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl animate-pulse" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/30 flex items-center justify-center">
                          <Loader2 className="w-7 h-7 text-violet-300 animate-spin" />
                        </div>
                      </div>
                    </div>

                    <p className="text-center text-white font-semibold mb-1">
                      {t.common.generating}
                    </p>
                    <p className="text-center text-slate-500 text-xs mb-8">
                      {Math.round(progress)}%
                    </p>

                    {/* Progress bar */}
                    <div className="h-2 w-full rounded-full bg-slate-800/70 overflow-hidden mb-8">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear", duration: 0.05 }}
                      />
                    </div>

                    {/* Stage list */}
                    <div className="space-y-3">
                      {INVESTIGATION_STAGES.map((stage, i) => {
                        const isDone = i < stageIndex
                        const isActive = i === stageIndex
                        return (
                          <div
                            key={stage.key}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                              isActive
                                ? "border-violet-500/40 bg-violet-500/10"
                                : isDone
                                  ? "border-slate-800/60 bg-slate-950/40"
                                  : "border-slate-800/40 bg-slate-950/20"
                            }`}
                          >
                            <span className="shrink-0">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : isActive ? (
                                <Loader2 className="w-4 h-4 text-violet-300 animate-spin" />
                              ) : (
                                <span className="block w-4 h-4 rounded-full border border-slate-700" />
                              )}
                            </span>
                            <span
                              className={`text-sm ${
                                isActive
                                  ? "text-white font-medium"
                                  : isDone
                                    ? "text-slate-400"
                                    : "text-slate-600"
                              }`}
                            >
                              {locale === "ru" ? stage.ru : stage.en}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ---------- Case file ---------- */}
          {phase === "done" && caseFile && verdictMeta && (
            <motion.div
              key="case"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* (a) Verdict header */}
              <Card
                className="bg-slate-900/50 border-slate-800/50 border-l-4 overflow-hidden"
                style={{ borderLeftColor: verdictMeta.color }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    {/* Subject + verdict */}
                    <div className="flex items-start gap-5 min-w-0">
                      {/* Confidence ring */}
                      <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-20 h-20 -rotate-90">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="rgb(30 41 59)"
                            strokeWidth="9"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={verdictMeta.color}
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 42}
                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                            animate={{
                              strokeDashoffset: 2 * Math.PI * 42 * (1 - caseFile.confidence),
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-white leading-none">
                            {Math.round(caseFile.confidence * 100)}%
                          </span>
                          <span className="text-[9px] uppercase tracking-wide text-slate-500 mt-0.5">
                            {t.common.confidence}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-[10px] uppercase tracking-widest text-slate-500">
                            {t.investigations.riskVerdict}
                          </span>
                          <Badge variant={verdictMeta.badge}>
                            {locale === "ru" ? verdictMeta.ru : verdictMeta.en}
                          </Badge>
                        </div>
                        <h2 className="text-xl font-bold text-white truncate">
                          {caseFile.subjectName}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                          <span className="font-mono text-slate-500">{caseFile.subjectId}</span>
                          <span className="text-slate-700">|</span>
                          <span className="font-mono text-slate-500">{caseFile.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Exposure + timing */}
                    <div className="flex items-stretch gap-3 flex-wrap">
                      <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 min-w-[150px]">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {t.rings.exposureAmount}
                        </p>
                        <p
                          className="text-xl font-bold"
                          style={{ color: verdictMeta.color }}
                        >
                          {formatCurrency(caseFile.exposure)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-4 py-3 min-w-[150px]">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
                          <Timer className="w-3 h-3 text-violet-400" />
                          {t.investigations.investigationTime}
                        </p>
                        <p className="text-xl font-bold text-violet-300">
                          {caseFile.generatedInSeconds.toFixed(1)}{" "}
                          <span className="text-xs font-medium text-slate-400">
                            {t.common.seconds}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 min-w-[150px]">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {t.investigations.manualEstimate}
                        </p>
                        <p className="text-xl font-bold text-slate-300">
                          {caseFile.manualEstimateMinutes}{" "}
                          <span className="text-xs font-medium text-slate-500">
                            {t.common.minutes}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 min-w-[150px]">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-emerald-400" />
                          {t.investigations.timeSaved}
                        </p>
                        <p className="text-xl font-bold text-emerald-400">{timeSavedPercent}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Comparison badge */}
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-300">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {t.investigations.complete} — {caseFile.generatedInSeconds.toFixed(1)}{" "}
                      {t.common.seconds} {locale === "ru" ? "против" : "vs"}{" "}
                      {caseFile.manualEstimateMinutes} {t.common.minutes}{" "}
                      {locale === "ru" ? "вручную" : "manual"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Two-column body */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* ===== Left column ===== */}
                <div className="space-y-6">
                  {/* (b) Executive summary */}
                  <Card className="bg-slate-900/50 border-slate-800/50 border-l-4 border-l-violet-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileSearch className="w-4 h-4 text-violet-400 shrink-0" />
                        {t.investigations.caseSummary}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 text-sm leading-7 max-w-prose">{summary}</p>
                    </CardContent>
                  </Card>

                  {/* (c) Key findings */}
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                        {t.investigations.keyFindings}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {keyFindings.map((finding, i) => (
                          <motion.li
                            key={finding}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="flex items-start gap-3"
                          >
                            <span className="mt-0.5 shrink-0">
                              {caseFile.verdict === "likely_legitimate" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                              )}
                            </span>
                            <span className="text-sm text-slate-300 leading-relaxed">
                              {finding}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* (d) Evidence chain */}
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Scale className="w-4 h-4 text-violet-400 shrink-0" />
                        {t.investigations.evidenceChain}
                        <span className="text-xs font-normal text-slate-500">
                          ({caseFile.evidence.length})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {caseFile.evidence.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center justify-center">
                              {EVIDENCE_ICON[item.category]}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge
                                  variant="outline"
                                  className="border-slate-700 text-slate-400 text-[10px] px-2 py-0.5"
                                >
                                  {locale === "ru"
                                    ? EVIDENCE_CATEGORY_LABEL[item.category].ru
                                    : EVIDENCE_CATEGORY_LABEL[item.category].en}
                                </Badge>
                                <span className="text-[10px] text-slate-500">{item.source}</span>
                              </div>
                              <p className="text-sm font-medium text-white leading-snug">
                                {locale === "ru" ? item.titleRu : item.titleEn}
                              </p>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {locale === "ru" ? item.detailRu : item.detailEn}
                              </p>

                              {/* Strength bar */}
                              <div className="mt-3 flex items-center gap-3">
                                <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.strength * 100}%` }}
                                    transition={{ duration: 0.7, delay: 0.1 + 0.05 * i }}
                                  />
                                </div>
                                <span className="text-[11px] font-mono text-slate-400 tabular-nums w-9 text-right">
                                  {Math.round(item.strength * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* ===== Right column ===== */}
                <div className="space-y-6">
                  {/* (e) Event timeline */}
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-violet-400 shrink-0" />
                        {t.investigations.eventTimeline}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative pl-8">
                        {/* Connecting line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-800" />

                        <div className="space-y-6">
                          {caseFile.timeline.map((event, i) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 * i }}
                              className="relative"
                            >
                              <span
                                className={`absolute -left-[25px] top-1.5 w-[9px] h-[9px] rounded-full ring-4 ${
                                  SEVERITY_DOT[event.severity]
                                }`}
                              />
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-[11px] font-mono text-slate-500">
                                  {event.offsetLabel}
                                </span>
                                <span
                                  className={`text-[10px] uppercase tracking-wide ${
                                    SEVERITY_TEXT[event.severity]
                                  }`}
                                >
                                  {event.severity}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-white leading-snug">
                                {locale === "ru" ? event.titleRu : event.titleEn}
                              </p>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {locale === "ru" ? event.detailRu : event.detailEn}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* (f) Recommended actions */}
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-violet-400 shrink-0" />
                        {t.investigations.recommendedActions}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {caseFile.actions.map((action, i) => (
                        <motion.div
                          key={action.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 ${
                                  URGENCY_META[action.urgency].className
                                }`}
                              >
                                {locale === "ru"
                                  ? URGENCY_META[action.urgency].ru
                                  : URGENCY_META[action.urgency].en}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-white leading-snug">
                              {locale === "ru" ? action.labelRu : action.labelEn}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {locale === "ru" ? action.rationaleRu : action.rationaleEn}
                            </p>
                          </div>
                          <Button
                            variant={action.urgency === "immediate" ? "destructive" : "outline"}
                            size="sm"
                            className="shrink-0 self-start sm:self-center"
                          >
                            {t.common.confirm}
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* (g) Related accounts */}
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-violet-400 shrink-0" />
                        {t.investigations.relatedAccounts}
                        <span className="text-xs font-normal text-slate-500">
                          ({caseFile.relatedAccounts.length})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {caseFile.relatedAccounts.map((account, i) => (
                        <motion.div
                          key={`${account.id}-${i}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {account.name}
                              </p>
                              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                                {account.id}
                              </p>
                              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                                <Link2 className="w-3 h-3 text-violet-400 shrink-0" />
                                {locale === "ru" ? account.linkRu : account.linkEn}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-white tabular-nums shrink-0">
                              {Math.round(account.risk)}
                            </span>
                          </div>

                          {/* Risk bar */}
                          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${riskBarColor(account.risk)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, account.risk)}%` }}
                              transition={{ duration: 0.7, delay: 0.1 + 0.05 * i }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <Button variant="outline" onClick={resetInvestigation}>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {t.investigations.newInvestigation}
                </Button>
                <Button variant="ghost" className="text-slate-400 hover:text-white">
                  {t.common.download}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  )
}
