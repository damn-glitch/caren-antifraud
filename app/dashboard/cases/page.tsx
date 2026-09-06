"use client"

// CAREN - Case Board
// Kanban investigation pipeline with SLA tracking and analyst workload balance.
// Author: Alisher Beisembekov

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  KanbanSquare,
  AlertTriangle,
  Clock,
  User,
  Paperclip,
  Bell,
  X,
  ChevronRight,
  TrendingUp,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/lib/locale-context"
import {
  generateCases,
  summarizeCases,
  workloadByAssignee,
  STAGE_META,
  PRIORITY_META,
  OUTCOME_META,
  type CaseStage,
  type InvestigationCase,
} from "@/lib/case-management"
import { formatCurrency, formatNumber } from "@/lib/utils"

const CASE_COUNT = 26

/** Field labels that have no dedicated i18n key yet — kept bilingual on purpose. */
const LABELS = {
  account: { en: "Account", ru: "Счёт" },
  assignee: { en: "Assignee", ru: "Ответственный" },
  tags: { en: "Tags", ru: "Метки" },
  outcome: { en: "Outcome", ru: "Результат" },
  opened: { en: "Opened", ru: "Открыт" },
  sla: { en: "SLA", ru: "SLA" },
  slaConsumed: { en: "SLA consumed", ru: "SLA израсходован" },
  elapsed: { en: "Elapsed", ru: "Прошло" },
} as const

const STAGE_ORDER = Object.keys(STAGE_META) as CaseStage[]

/** Emerald under 60%, amber to 90%, red past that or once the window is blown. */
function slaBarClass(pct: number, breached: boolean): string {
  if (breached || pct > 90) return "bg-red-500"
  if (pct >= 60) return "bg-amber-400"
  return "bg-emerald-500"
}

function slaTextClass(pct: number, breached: boolean): string {
  if (breached || pct > 90) return "text-red-400"
  if (pct >= 60) return "text-amber-400"
  return "text-emerald-400"
}

/** Minutes -> "3h 20m". */
function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  return `${Math.floor(total / 60)}h ${total % 60}m`
}

export default function CasesPage() {
  const { t, locale } = useLocale()

  const [cases, setCases] = useState<InvestigationCase[] | null>(null)
  const [now, setNow] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // generateCases() leans on Math.random()/Date.now(), so it must stay
  // client-only to avoid a server/client hydration mismatch.
  useEffect(() => {
    setCases(generateCases(CASE_COUNT))
    setNow(Date.now())
  }, [])

  const localized = useCallback(
    (value: { en: string; ru: string }) => (locale === "ru" ? value.ru : value.en),
    [locale]
  )

  const summary = useMemo(
    () => (cases ? summarizeCases(cases) : null),
    [cases]
  )

  const workload = useMemo(
    () => (cases ? workloadByAssignee(cases) : []),
    [cases]
  )

  const maxWorkload = useMemo(
    () => Math.max(1, ...workload.map((w) => w.open)),
    [workload]
  )

  const columns = useMemo(
    () =>
      STAGE_ORDER.map((stage) => ({
        stage,
        items: cases ? cases.filter((c) => c.stage === stage) : [],
      })),
    [cases]
  )

  const selectedCase = useMemo(
    () => cases?.find((c) => c.id === selectedId) ?? null,
    [cases, selectedId]
  )

  const closePanel = useCallback(() => setSelectedId(null), [])

  // Escape closes the slide-over.
  useEffect(() => {
    if (!selectedId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedId])

  const relativeTime = useCallback(
    (at: Date) => {
      if (now === null) return ""
      const minutes = Math.max(1, Math.round((now - at.getTime()) / 60000))
      if (minutes < 60) return `${minutes} ${t.common.minutes} ${t.common.ago}`
      const hours = Math.round(minutes / 60)
      if (hours < 24) return `${hours} ${t.common.hours} ${t.common.ago}`
      return `${Math.round(hours / 24)} ${t.common.days} ${t.common.ago}`
    },
    [now, t]
  )

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
              <KanbanSquare className="w-6 h-6 text-violet-400" />
              {t.pages.casesTitle}
            </h1>
            <p className="text-slate-400 text-sm">{t.pages.casesSubtitle}</p>
          </div>
          {summary && (
            <Badge
              variant="outline"
              className="border-violet-500/30 text-violet-300 px-3 py-1.5 self-start lg:self-auto"
            >
              {formatNumber(summary.total)} {t.common.total}
            </Badge>
          )}
        </motion.div>

        {!cases || !summary ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <Clock className="w-5 h-5 animate-spin text-violet-400" />
            {t.common.loading}
          </div>
        ) : (
          <>
            {/* ---- Stat row ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4"
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {t.pages.casesOpen}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <KanbanSquare className="w-5 h-5 text-violet-400" />
                    <span className="text-2xl font-bold text-white">
                      {formatNumber(summary.open)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {t.pages.casesSlaBreached}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-2xl font-bold text-red-400">
                      {formatNumber(summary.slaBreached)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {t.pages.casesAtRisk}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span className="text-2xl font-bold text-amber-400">
                      {formatNumber(summary.atRisk)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {t.rings.totalExposure}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-500" />
                    <span className="text-2xl font-bold text-white font-mono">
                      {formatCurrency(summary.totalExposure)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {t.pages.casesAvgResolution}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <span className="text-2xl font-bold text-emerald-400 font-mono">
                      {formatDuration(summary.avgResolutionMinutes)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ---- Kanban board ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="overflow-x-auto pb-2"
            >
              <div className="flex gap-4 min-w-max">
                {columns.map(({ stage, items }) => {
                  const meta = STAGE_META[stage]

                  return (
                    <div
                      key={stage}
                      className="min-w-[280px] w-[280px] rounded-2xl bg-slate-900/50 border border-slate-800/50 overflow-hidden flex flex-col"
                    >
                      <div
                        className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between gap-2"
                        style={{ borderTopWidth: 3, borderTopColor: meta.color }}
                      >
                        <span className="text-sm font-semibold text-white truncate">
                          {localized(meta)}
                        </span>
                        <span
                          className="shrink-0 text-xs font-mono font-semibold rounded-full px-2 py-0.5"
                          style={{
                            color: meta.color,
                            backgroundColor: `${meta.color}1f`,
                          }}
                        >
                          {items.length}
                        </span>
                      </div>

                      <div className="p-3 space-y-3 flex-1">
                        {items.map((item) => {
                          const priorityMeta = PRIORITY_META[item.priority]

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedId(item.id)}
                              className={`w-full text-left rounded-xl bg-slate-950/50 border border-slate-800/50 p-3 transition-colors hover:bg-slate-900/70 hover:border-violet-500/30 ${
                                item.slaBreached
                                  ? "border-l-4 border-l-red-500"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span
                                  className="shrink-0 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                                  style={{
                                    color: priorityMeta.color,
                                    backgroundColor: `${priorityMeta.color}1f`,
                                  }}
                                >
                                  {item.priority}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500 truncate">
                                  {item.id}
                                </span>
                              </div>

                              <p className="text-sm font-medium text-white mt-2 leading-snug">
                                {localized(item.title)}
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                                <span className="font-mono text-slate-500 truncate">
                                  {item.accountId}
                                </span>
                                <span className="font-mono text-amber-300 shrink-0">
                                  {formatCurrency(item.exposure)}
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <div
                                  className="w-7 h-7 shrink-0 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-300"
                                  title={item.assignee}
                                >
                                  {item.assigneeInitials}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                  <span
                                    className="flex items-center gap-1"
                                    title={t.triage.linkedAlerts}
                                  >
                                    <Bell className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="font-mono">
                                      {item.linkedAlerts}
                                    </span>
                                  </span>
                                  <span
                                    className="flex items-center gap-1"
                                    title={t.common.evidence}
                                  >
                                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="font-mono">
                                      {item.evidenceCount}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {item.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {item.tags.map((tag) => (
                                    <span
                                      key={tag.en}
                                      className="text-[10px] rounded-md px-1.5 py-0.5 bg-slate-800/70 text-slate-300"
                                    >
                                      {localized(tag)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="mt-3 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500">
                                    {LABELS.sla[locale]}
                                  </span>
                                  <span
                                    className={`font-mono font-semibold ${slaTextClass(
                                      item.slaConsumedPct,
                                      item.slaBreached
                                    )}`}
                                  >
                                    {item.slaConsumedPct.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-800/60 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${slaBarClass(
                                      item.slaConsumedPct,
                                      item.slaBreached
                                    )}`}
                                    style={{
                                      width: `${item.slaConsumedPct}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* ---- Analyst workload ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-violet-400" />
                    {t.pages.casesWorkload}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workload.map((analyst, index) => (
                    <div key={analyst.name} className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-[11px] font-bold text-violet-300">
                          {analyst.initials}
                        </div>
                        <span className="text-sm font-medium text-white min-w-0 flex-1 truncate">
                          {analyst.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {t.common.open}:{" "}
                          <span className="font-mono text-slate-200 font-semibold">
                            {analyst.open}
                          </span>
                        </span>
                        <span className="text-xs font-mono text-amber-300">
                          {formatCurrency(analyst.exposure)}
                        </span>
                        {analyst.breached > 0 && (
                          <span
                            className="text-xs flex items-center gap-1 text-red-400"
                            title={t.pages.casesSlaBreached}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="font-mono">{analyst.breached}</span>
                          </span>
                        )}
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800/60 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(analyst.open / maxWorkload) * 100}%`,
                          }}
                          transition={{
                            duration: 0.7,
                            delay: 0.05 * index,
                            ease: "easeOut",
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* ---- Case detail slide-over ---- */}
        <AnimatePresence>
          {selectedCase && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closePanel}
                className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
              />

              <motion.aside
                key="panel"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-slate-900 border-l border-slate-800/50 overflow-y-auto"
              >
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800/50 px-5 py-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                        style={{
                          color: PRIORITY_META[selectedCase.priority].color,
                          backgroundColor: `${
                            PRIORITY_META[selectedCase.priority].color
                          }1f`,
                        }}
                      >
                        {selectedCase.priority}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {selectedCase.id}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-white leading-snug">
                      {localized(selectedCase.title)}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closePanel}
                    aria-label={t.common.close}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-5 py-5 space-y-5">
                  {/* Stage + priority */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-950/50 border border-slate-800/50 p-3">
                      <p className="text-[11px] text-slate-500 mb-1">
                        {t.triage.stage}
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: STAGE_META[selectedCase.stage].color }}
                      >
                        {localized(STAGE_META[selectedCase.stage])}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-950/50 border border-slate-800/50 p-3">
                      <p className="text-[11px] text-slate-500 mb-1">
                        {t.triage.priority}
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: PRIORITY_META[selectedCase.priority].color,
                        }}
                      >
                        {localized(PRIORITY_META[selectedCase.priority])}
                      </p>
                    </div>
                  </div>

                  {/* Core fields */}
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800/50 divide-y divide-slate-800/50">
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="text-xs text-slate-500">
                        {LABELS.account[locale]}
                      </span>
                      <span className="text-xs font-mono text-slate-200">
                        {selectedCase.accountId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="text-xs text-slate-500">
                        {t.rings.exposureAmount}
                      </span>
                      <span className="text-xs font-mono font-semibold text-amber-300">
                        {formatCurrency(selectedCase.exposure)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="text-xs text-slate-500">
                        {LABELS.assignee[locale]}
                      </span>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 shrink-0 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-[9px] font-bold text-violet-300">
                          {selectedCase.assigneeInitials}
                        </span>
                        <span className="text-xs text-slate-200 truncate">
                          {selectedCase.assignee}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="text-xs text-slate-500">
                        {LABELS.opened[locale]}
                      </span>
                      <span className="text-xs font-mono text-slate-200">
                        {relativeTime(selectedCase.openedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-slate-600" />
                        {t.triage.linkedAlerts}
                      </span>
                      <span className="text-xs font-mono text-slate-200">
                        {selectedCase.linkedAlerts}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-slate-600" />
                        {t.common.evidence}
                      </span>
                      <span className="text-xs font-mono text-slate-200">
                        {selectedCase.evidenceCount}
                      </span>
                    </div>
                    {selectedCase.outcome && (
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="text-xs text-slate-500">
                          {LABELS.outcome[locale]}
                        </span>
                        <span className="text-xs font-semibold text-emerald-400 text-right">
                          {localized(OUTCOME_META[selectedCase.outcome])}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* SLA */}
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800/50 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">
                        {LABELS.slaConsumed[locale]}
                      </span>
                      <span
                        className={`text-xs font-mono font-semibold ${slaTextClass(
                          selectedCase.slaConsumedPct,
                          selectedCase.slaBreached
                        )}`}
                      >
                        {selectedCase.slaConsumedPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${slaBarClass(
                          selectedCase.slaConsumedPct,
                          selectedCase.slaBreached
                        )}`}
                        style={{ width: `${selectedCase.slaConsumedPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
                      <span>
                        {LABELS.elapsed[locale]}:{" "}
                        <span className="font-mono text-slate-300">
                          {formatDuration(selectedCase.minutesElapsed)}
                        </span>
                      </span>
                      <span>
                        {LABELS.sla[locale]}:{" "}
                        <span className="font-mono text-slate-300">
                          {formatDuration(selectedCase.slaMinutes)}
                        </span>
                      </span>
                    </div>
                    {selectedCase.slaBreached && (
                      <p className="flex items-center gap-1.5 text-[11px] text-red-400 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {t.pages.casesSlaBreached}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {selectedCase.tags.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 mb-2">
                        {LABELS.tags[locale]}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCase.tags.map((tag) => (
                          <span
                            key={tag.en}
                            className="text-[11px] rounded-md px-2 py-0.5 bg-slate-800/70 text-slate-300"
                          >
                            {localized(tag)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes timeline */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 mb-3">
                      {t.pages.casesNotes}
                    </p>
                    <div className="space-y-4">
                      {selectedCase.notes.map((note) => (
                        <div key={note.id} className="flex gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <span className="w-2 h-2 rounded-full bg-violet-500 mt-1.5" />
                            <span className="w-px flex-1 bg-slate-800 mt-1" />
                          </div>
                          <div className="min-w-0 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-200">
                                {note.author}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {relativeTime(note.at)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {localized(note.text)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closePanel}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-800/50 bg-slate-950/50 px-3 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                  >
                    {t.common.close}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  )
}
