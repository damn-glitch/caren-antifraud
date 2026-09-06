"use client"

// CAREN - Sanctions / PEP Screening Page
// Author: Alisher Beisembekov

import { useState, useEffect, useMemo, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  ScreeningHit,
  ListType,
  MatchDecision,
  MatchAlgorithm,
  LIST_LABELS,
  ALGORITHM_LABELS,
  DECISION_LABELS,
  generateScreeningHits,
  summarizeScreening,
} from "@/lib/screening"
import { Locale } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/utils"
import {
  ShieldCheck,
  Search,
  Check,
  X,
  AlertTriangle,
  Scale,
  Clock,
  ChevronDown,
  FileWarning,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ListFilter = "all" | ListType
type RecommendedDecision = Exclude<MatchDecision, "pending">

const LIST_KEYS = Object.keys(LIST_LABELS) as ListType[]

const DECISION_BORDER: Record<RecommendedDecision, string> = {
  true_match: "border-l-red-500",
  escalated: "border-l-amber-400",
  false_positive: "border-l-emerald-500",
}

const DECISION_BADGE_VARIANT: Record<
  RecommendedDecision,
  "critical" | "warning" | "success"
> = {
  true_match: "critical",
  escalated: "warning",
  false_positive: "success",
}

const DECISION_ICON: Record<RecommendedDecision, React.ReactNode> = {
  true_match: <FileWarning className="w-5 h-5 text-red-500" />,
  escalated: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  false_positive: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
}

/** Localized restricted-party list name. */
function listLabel(listType: ListType, locale: Locale): string {
  const meta = LIST_LABELS[listType]
  return locale === "ru" ? meta.ru : meta.en
}

/** Localized fuzzy-matching algorithm name. */
function algorithmLabel(algorithm: MatchAlgorithm, locale: Locale): string {
  const meta = ALGORITHM_LABELS[algorithm]
  return locale === "ru" ? meta.ru : meta.en
}

/** Localized adjudication decision name. */
function decisionLabel(decision: MatchDecision, locale: Locale): string {
  const meta = DECISION_LABELS[decision]
  return locale === "ru" ? meta.ru : meta.en
}

/** Score colouring: the analyst should see the risky band before reading it. */
function scoreColor(score: number): string {
  if (score > 90) return "text-red-400"
  if (score > 80) return "text-amber-400"
  return "text-slate-300"
}

/** Locale-aware relative timestamp, e.g. "3h ago" / "3 ч назад". */
function formatRelativeTime(date: Date, locale: Locale): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.max(0, Math.floor(diffMs / 60000))
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (locale === "ru") {
    if (diffMin < 1) return "только что"
    if (diffMin < 60) return `${diffMin} мин назад`
    if (diffHour < 24) return `${diffHour} ч назад`
    return `${diffDay} дн назад`
  }

  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return `${diffDay}d ago`
}

export default function ScreeningPage() {
  const { t, locale } = useLocale()

  const [hits, setHits] = useState<ScreeningHit[] | null>(null)
  const [listFilter, setListFilter] = useState<ListFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Generated client-side only — Math.random() during render would break hydration.
  useEffect(() => {
    setHits(generateScreeningHits(30))
  }, [])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const summary = useMemo(() => summarizeScreening(hits ?? []), [hits])

  const listCounts = useMemo(() => {
    const counts = {} as Record<ListType, number>
    for (const key of LIST_KEYS) counts[key] = 0
    for (const hit of hits ?? []) counts[hit.listType] += 1
    return counts
  }, [hits])

  const filteredHits = useMemo(() => {
    const list = hits ?? []
    if (listFilter === "all") return list
    return list.filter((hit) => hit.listType === listFilter)
  }, [hits, listFilter])

  const isLoading = hits === null

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
              <ShieldCheck className="w-6 h-6 text-violet-400" />
              {t.pages.screeningTitle}
            </h1>
            <p className="text-slate-400 text-sm">
              {t.pages.screeningSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 px-3 py-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              CAREN {t.common.active}
            </Badge>
            <Badge
              variant="outline"
              className="border-violet-500/30 text-violet-300 px-3 py-1.5 font-mono text-[11px]"
            >
              OFAC / EU / UN / HMT
            </Badge>
          </div>
        </motion.div>

        {/* ---- Stat row ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.common.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.status.pending}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.pending)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {decisionLabel("true_match", locale)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-400">
                  {formatNumber(summary.trueMatches)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {decisionLabel("false_positive", locale)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-400">
                  {formatNumber(summary.falsePositives)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Hero metric: the share of the queue AI clears without a human. */}
          <Card className="bg-slate-900/50 border-emerald-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-400/80">
                {t.pages.screeningAutoClearable}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-4xl font-bold text-emerald-400 tabular-nums">
                {summary.autoClearablePct.toFixed(1)}%
              </span>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.analytics.avgResponseTime}</span>
                <span className="font-mono text-slate-300">
                  {summary.avgLatencyMs.toFixed(0)} ms
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ---- List filter tabs ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <Button
            variant={listFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setListFilter("all")}
            className={
              listFilter === "all" ? "" : "text-slate-400 hover:text-white"
            }
          >
            {t.common.all}
            <span className="ml-1.5 text-xs opacity-70">
              ({hits?.length ?? 0})
            </span>
          </Button>
          {LIST_KEYS.map((key) => (
            <Button
              key={key}
              variant={listFilter === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setListFilter(key)}
              className={
                listFilter === key ? "" : "text-slate-400 hover:text-white"
              }
            >
              {listLabel(key, locale)}
              <span className="ml-1.5 text-xs opacity-70">
                ({listCounts[key]})
              </span>
            </Button>
          ))}
        </motion.div>

        {/* ---- Hit queue ---- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-violet-400" />
            {t.pages.screeningTitle}
            <span className="text-slate-500 text-sm font-normal">
              {t.common.showing} {filteredHits.length} {t.common.of}{" "}
              {hits?.length ?? 0}
            </span>
          </h2>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
              <p className="text-slate-400 text-sm">{t.common.loading}</p>
            </div>
          )}

          {!isLoading && filteredHits.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-medium">
                {t.common.noResults}
              </p>
            </div>
          )}

          {!isLoading && filteredHits.length > 0 && (
            <div className="space-y-3">
              {filteredHits.map((hit, index) => {
                const isExpanded = expandedId === hit.id
                const listMeta = LIST_LABELS[hit.listType]

                return (
                  <motion.div
                    key={hit.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.4) }}
                  >
                    <Card
                      className={`bg-slate-900/50 border-slate-800/50 border-l-4 ${
                        DECISION_BORDER[hit.recommendedDecision]
                      }`}
                    >
                      <CardContent className="p-4">
                        {/* Summary row (click to expand) */}
                        <button
                          type="button"
                          onClick={() => toggleExpanded(hit.id)}
                          className="w-full text-left"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="mt-0.5 shrink-0">
                                {DECISION_ICON[hit.recommendedDecision]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <Badge
                                    variant={
                                      DECISION_BADGE_VARIANT[
                                        hit.recommendedDecision
                                      ]
                                    }
                                  >
                                    {decisionLabel(
                                      hit.recommendedDecision,
                                      locale
                                    )}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-violet-500/30 text-violet-300 text-[10px]"
                                  >
                                    {listLabel(hit.listType, locale)}
                                  </Badge>
                                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
                                    {listMeta.authority}
                                  </span>
                                  {hit.program && (
                                    <span className="rounded-full border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] text-amber-300/90">
                                      {hit.program}
                                    </span>
                                  )}
                                </div>

                                <p className="text-white text-sm font-medium truncate">
                                  {hit.subjectName}
                                </p>

                                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-300 min-w-0">
                                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">
                                    {hit.matchedName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400 flex-wrap">
                                  <span className="font-mono text-slate-500">
                                    {hit.subjectId}
                                  </span>
                                  <span className="font-mono text-slate-500">
                                    {hit.listEntryId}
                                  </span>
                                  <span>
                                    {t.pages.screeningAlgorithm}:{" "}
                                    {algorithmLabel(hit.algorithm, locale)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span className="font-mono">
                                      {hit.latencyMs} ms
                                    </span>
                                  </span>
                                  <span>
                                    {formatRelativeTime(hit.screenedAt, locale)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 sm:ml-4">
                              <div className="text-right">
                                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                                  {t.pages.screeningMatchScore}
                                </p>
                                <p
                                  className={`text-lg font-bold tabular-nums ${scoreColor(
                                    hit.score
                                  )}`}
                                >
                                  {hit.score.toFixed(1)}%
                                </p>
                              </div>
                              <ChevronDown
                                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </div>
                        </button>

                        {/* Expanded detail */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              key="detail"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-slate-800/70 space-y-4">
                                {/* Discriminator comparison */}
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                                    <Scale className="w-3.5 h-3.5" />
                                    {t.pages.screeningDiscriminators}
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-[10px] uppercase tracking-wide text-slate-500">
                                          <th className="text-left font-medium pb-2 pr-4" />
                                          <th className="text-left font-medium pb-2 pr-4">
                                            {t.investigations.subject}
                                          </th>
                                          <th className="text-left font-medium pb-2 pr-4">
                                            {listLabel(hit.listType, locale)}
                                          </th>
                                          <th className="text-right font-medium pb-2 w-8" />
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {hit.discriminators.map(
                                          (discriminator) => (
                                            <tr
                                              key={
                                                locale === "ru"
                                                  ? discriminator.field.ru
                                                  : discriminator.field.en
                                              }
                                              className="border-t border-slate-800/50"
                                            >
                                              <td className="py-2 pr-4 text-slate-400 whitespace-nowrap">
                                                {locale === "ru"
                                                  ? discriminator.field.ru
                                                  : discriminator.field.en}
                                              </td>
                                              <td className="py-2 pr-4 font-mono text-xs text-white">
                                                {discriminator.subject}
                                              </td>
                                              <td
                                                className={`py-2 pr-4 font-mono text-xs ${
                                                  discriminator.matches
                                                    ? "text-emerald-300"
                                                    : "text-slate-400"
                                                }`}
                                              >
                                                {discriminator.listEntry}
                                              </td>
                                              <td className="py-2 text-right">
                                                {discriminator.matches ? (
                                                  <Check className="w-4 h-4 text-emerald-400 inline-block" />
                                                ) : (
                                                  <X className="w-4 h-4 text-red-400 inline-block" />
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* AI adjudication */}
                                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                                  <h4 className="text-xs font-semibold uppercase tracking-wide text-violet-300 mb-2 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {t.pages.screeningAssessment}
                                  </h4>
                                  <p className="text-slate-300 text-sm leading-relaxed">
                                    {locale === "ru"
                                      ? hit.aiAssessment.ru
                                      : hit.aiAssessment.en}
                                  </p>
                                </div>

                                {/* Adjudication actions */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                                      {t.pages.screeningRecommended}
                                    </span>
                                    <Badge
                                      variant={
                                        DECISION_BADGE_VARIANT[
                                          hit.recommendedDecision
                                        ]
                                      }
                                      className="text-[10px]"
                                    >
                                      {decisionLabel(
                                        hit.recommendedDecision,
                                        locale
                                      )}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Button variant="destructive" size="sm">
                                      <Check className="w-4 h-4 mr-1.5" />
                                      {t.common.confirm}
                                    </Button>
                                    <Button variant="success" size="sm">
                                      <X className="w-4 h-4 mr-1.5" />
                                      {t.common.dismiss}
                                    </Button>
                                    <Button variant="warning" size="sm">
                                      <AlertTriangle className="w-4 h-4 mr-1.5" />
                                      {t.common.escalate}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.section>
      </div>
    </DashboardShell>
  )
}
