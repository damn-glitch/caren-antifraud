"use client"

// CAREN - Threat Intelligence Page
// External fraud signals correlated against the institution's own estate.
// Author: Alisher Beisembekov

import { useState, useEffect, useMemo, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  CATEGORY_META,
  SEVERITY_META,
  ThreatCategory,
  ThreatIndicator,
  ThreatReport,
  ThreatSeverity,
  generateThreatReports,
  summarizeThreats,
} from "@/lib/threat-intel"
import { Locale } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
  Radar,
  Key,
  CreditCard,
  Bug,
  Fish,
  Users,
  Target,
  Store,
  Smartphone,
  AlertTriangle,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  Shield,
  ShieldAlert,
  Clock,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type CategoryFilter = "all" | ThreatCategory

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as ThreatCategory[]

/** CATEGORY_META.icon holds a lucide icon *name*; map it to a real component. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  key: Key,
  "credit-card": CreditCard,
  bug: Bug,
  fish: Fish,
  users: Users,
  target: Target,
  store: Store,
  smartphone: Smartphone,
}

function categoryIcon(category: ThreatCategory): LucideIcon {
  return CATEGORY_ICONS[CATEGORY_META[category].icon] ?? Radar
}

/** Severity -> Tailwind text colour, mirroring SEVERITY_META hex values. */
const SEVERITY_TEXT: Record<ThreatSeverity, string> = {
  informational: "text-slate-400",
  elevated: "text-cyan-400",
  high: "text-amber-400",
  severe: "text-red-400",
}

/** Localized label out of a bilingual lib object. */
function localized(value: { en: string; ru: string }, locale: Locale): string {
  return locale === "ru" ? value.ru : value.en
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

/** Indicator chip — red with a ring when the indicator matched our estate. */
function IndicatorChip({ indicator }: { indicator: ThreatIndicator }) {
  const matched = indicator.matchedInternally
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] ${
        matched
          ? "border-red-500/40 bg-red-500/10 text-red-300 ring-1 ring-red-500/30"
          : "border-slate-800 bg-slate-800/40 text-slate-400"
      }`}
    >
      {matched && <Target className="w-3 h-3 shrink-0 text-red-400" />}
      <span className="uppercase tracking-wide opacity-70">
        {indicator.type}
      </span>
      <span className="truncate">{indicator.value}</span>
    </span>
  )
}

export default function ThreatsPage() {
  const { t, locale } = useLocale()

  const [reports, setReports] = useState<ThreatReport[] | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Generated client-side only — Math.random()/Date.now() during render would break hydration.
  useEffect(() => {
    setReports(generateThreatReports(12))
  }, [])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const summary = useMemo(() => summarizeThreats(reports ?? []), [reports])

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<ThreatCategory, number>
    for (const key of CATEGORY_KEYS) counts[key] = 0
    for (const report of reports ?? []) counts[report.category] += 1
    return counts
  }, [reports])

  // Feed is newest-first: generateThreatReports already sorts, filtering keeps order.
  const filteredReports = useMemo(() => {
    const list = reports ?? []
    if (categoryFilter === "all") return list
    return list.filter((report) => report.category === categoryFilter)
  }, [reports, categoryFilter])

  const isLoading = reports === null

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
              <Radar className="w-6 h-6 text-violet-400" />
              {t.pages.threatsTitle}
            </h1>
            <p className="text-slate-400 text-sm">{t.pages.threatsSubtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 px-3 py-1.5"
            >
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              CAREN {t.common.active}
            </Badge>
            <Badge
              variant="outline"
              className="border-violet-500/30 text-violet-300 px-3 py-1.5 font-mono text-[11px]"
            >
              FS-ISAC / STIX 2.1
            </Badge>
          </div>
        </motion.div>

        {/* ---- Stat row ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.common.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-400/80">
                {localized(SEVERITY_META.severe, locale)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-400">
                  {formatNumber(summary.severe)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-400/80">
                {t.pages.threatsUnactioned}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">
                  {formatNumber(summary.unactioned)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.pages.threatsMatched}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.matchedIndicators)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.pages.threatsAffected}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.affectedAccounts)}
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
                <Wallet className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(summary.totalExposure)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ---- Category filter tabs ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <Button
            variant={categoryFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCategoryFilter("all")}
            className={
              categoryFilter === "all" ? "" : "text-slate-400 hover:text-white"
            }
          >
            {t.common.all}
            <span className="ml-1.5 text-xs opacity-70">
              ({reports?.length ?? 0})
            </span>
          </Button>
          {CATEGORY_KEYS.map((category) => {
            const Icon = categoryIcon(category)
            return (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setCategoryFilter(category)}
                className={
                  categoryFilter === category
                    ? ""
                    : "text-slate-400 hover:text-white"
                }
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {localized(CATEGORY_META[category], locale)}
                <span className="ml-1.5 text-xs opacity-70">
                  ({categoryCounts[category]})
                </span>
              </Button>
            )
          })}
        </motion.div>

        {/* ---- Threat feed ---- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Radar className="w-5 h-5 text-violet-400" />
            {t.pages.threatsTitle}
            <span className="text-slate-500 text-sm font-normal">
              {t.common.showing} {filteredReports.length} {t.common.of}{" "}
              {reports?.length ?? 0}
            </span>
          </h2>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
              <p className="text-slate-400 text-sm">{t.common.loading}</p>
            </div>
          )}

          {!isLoading && filteredReports.length === 0 && (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-medium">
                {t.common.noResults}
              </p>
            </div>
          )}

          {!isLoading && filteredReports.length > 0 && (
            <div className="space-y-3">
              {filteredReports.map((report, index) => {
                const Icon = categoryIcon(report.category)
                const isExpanded = expandedId === report.id
                const severityColor = SEVERITY_META[report.severity].color
                const matchedIndicators = report.indicators.filter(
                  (indicator) => indicator.matchedInternally
                )
                const unmatchedIndicators = report.indicators.filter(
                  (indicator) => !indicator.matchedInternally
                )

                return (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.4) }}
                  >
                    <Card
                      className="bg-slate-900/50 border-slate-800/50 border-l-4"
                      style={{ borderLeftColor: severityColor }}
                    >
                      <CardContent className="p-4">
                        {/* Summary row (click to expand) */}
                        <button
                          type="button"
                          onClick={() => toggleExpanded(report.id)}
                          className="w-full text-left"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Icon
                                className="w-5 h-5 mt-0.5 shrink-0"
                                style={{ color: severityColor }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                    style={{
                                      color: severityColor,
                                      borderColor: `${severityColor}66`,
                                      backgroundColor: `${severityColor}1a`,
                                    }}
                                  >
                                    {localized(
                                      SEVERITY_META[report.severity],
                                      locale
                                    )}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-violet-500/30 text-violet-300 text-[10px]"
                                  >
                                    {localized(
                                      CATEGORY_META[report.category],
                                      locale
                                    )}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-slate-700 text-slate-400 text-[10px] gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {t.pages.threatsSource}: {report.source}
                                  </Badge>
                                  {report.actioned ? (
                                    <Badge
                                      variant="success"
                                      className="text-[10px] gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      {t.common.resolved}
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="warning"
                                      className="text-[10px] gap-1"
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                      {t.pages.threatsUnactioned}
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-white text-sm font-medium leading-snug">
                                  {localized(report.title, locale)}
                                </p>

                                <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400 flex-wrap">
                                  <span className="font-mono text-slate-500">
                                    {report.id}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatRelativeTime(
                                      report.publishedAt,
                                      locale
                                    )}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {t.pages.threatsMatched}:{" "}
                                    <span className="text-slate-300 font-semibold">
                                      {matchedIndicators.length}/
                                      {report.indicators.length}
                                    </span>
                                  </span>
                                  <span className="text-slate-300 font-semibold">
                                    {formatCurrency(report.exposureEstimate)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 sm:ml-4">
                              <div className="text-right">
                                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                                  {t.common.confidence}
                                </p>
                                <p
                                  className={`text-lg font-bold ${
                                    SEVERITY_TEXT[report.severity]
                                  }`}
                                >
                                  {Math.round(report.confidence * 100)}%
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
                                <p className="text-slate-400 text-sm leading-relaxed">
                                  {localized(report.summary, locale)}
                                </p>

                                {/* Indicators — matched first, visually separated */}
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                    {t.pages.threatsIndicators}
                                  </h4>

                                  {matchedIndicators.length > 0 && (
                                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 mb-2">
                                      <p className="text-[10px] uppercase tracking-wide text-red-400 mb-2 flex items-center gap-1.5">
                                        <Target className="w-3 h-3" />
                                        {t.pages.threatsMatched} (
                                        {matchedIndicators.length})
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {matchedIndicators.map((indicator) => (
                                          <IndicatorChip
                                            key={`${indicator.type}-${indicator.value}`}
                                            indicator={indicator}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {unmatchedIndicators.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {unmatchedIndicators.map((indicator) => (
                                        <IndicatorChip
                                          key={`${indicator.type}-${indicator.value}`}
                                          indicator={indicator}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Impact row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="rounded-xl border border-slate-800/70 bg-slate-800/20 p-3">
                                    <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                                      {t.pages.threatsAffected}
                                    </p>
                                    <p className="text-white text-lg font-bold flex items-center gap-2">
                                      <Users className="w-4 h-4 text-violet-400" />
                                      {formatNumber(report.affectedAccounts)}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-slate-800/70 bg-slate-800/20 p-3">
                                    <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                                      {t.rings.exposureAmount}
                                    </p>
                                    <p className="text-white text-lg font-bold flex items-center gap-2">
                                      <Wallet className="w-4 h-4 text-violet-400" />
                                      {formatCurrency(report.exposureEstimate)}
                                    </p>
                                  </div>
                                </div>

                                {/* Recommended action */}
                                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                                  <p className="text-[10px] uppercase tracking-wide text-emerald-400 mb-2 flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5" />
                                    {t.pages.threatsAction}
                                  </p>
                                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                                    {localized(report.recommendedAction, locale)}
                                  </p>
                                  <Button
                                    variant={report.actioned ? "outline" : "success"}
                                    size="sm"
                                    className={
                                      report.actioned ? "border-slate-700" : ""
                                    }
                                  >
                                    <Check className="w-4 h-4 mr-1.5" />
                                    {report.actioned
                                      ? t.common.resolved
                                      : t.common.resolve}
                                  </Button>
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
