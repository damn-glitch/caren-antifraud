"use client"

// CAREN - Regulatory Change Radar
// Author: Alisher Beisembekov

import { useState, useEffect, useMemo, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  ImpactLevel,
  Jurisdiction,
  RegulatoryChange,
  IMPACT_LABELS,
  JURISDICTION_LABELS,
  STATUS_LABELS,
  generateRegulatoryChanges,
  summarizeRegulatory,
} from "@/lib/regulatory"
import { Locale } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/utils"
import {
  Scale,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Globe,
  ChevronDown,
  Gavel,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type JurisdictionFilter = "all" | Jurisdiction
type Bilingual = { en: string; ru: string }

const JURISDICTION_KEYS = Object.keys(JURISDICTION_LABELS) as Jurisdiction[]

/** Impact drives every colour decision on this page. */
const IMPACT_TEXT: Record<ImpactLevel, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  moderate: "text-amber-400",
  low: "text-blue-400",
  none: "text-slate-400",
}

const IMPACT_BADGE: Record<ImpactLevel, string> = {
  critical: "border-red-500/40 bg-red-500/10 text-red-300",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  moderate: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  low: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  none: "border-slate-700 bg-slate-800/40 text-slate-400",
}

const IMPACT_DOT: Record<ImpactLevel, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  moderate: "bg-amber-400",
  low: "bg-blue-400",
  none: "bg-slate-500",
}

const IMPACT_BORDER: Record<ImpactLevel, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  moderate: "border-l-amber-400",
  low: "border-l-blue-400",
  none: "border-l-slate-600",
}

/** Adjustments that still need a human hand. */
const MANUAL_LABEL: Bilingual = { en: "Manual", ru: "Вручную" }

/** Picks the caller's language out of a bilingual lib object. */
function localized(value: Bilingual, locale: Locale): string {
  return locale === "ru" ? value.ru : value.en
}

/** Locale-aware day count, e.g. "42d" / "42 дн". */
function formatDays(days: number, locale: Locale): string {
  return locale === "ru"
    ? `${formatNumber(days)} дн`
    : `${formatNumber(days)}d`
}

/** Readiness bar colour: red below 40, amber below 75, emerald above. */
function readinessBar(pct: number): string {
  if (pct < 40) return "bg-red-500"
  if (pct < 75) return "bg-amber-400"
  return "bg-emerald-500"
}

function readinessText(pct: number): string {
  if (pct < 40) return "text-red-400"
  if (pct < 75) return "text-amber-400"
  return "text-emerald-400"
}

export default function RegulatoryPage() {
  const { t, locale } = useLocale()

  const [changes, setChanges] = useState<RegulatoryChange[] | null>(null)
  const [jurisdictionFilter, setJurisdictionFilter] =
    useState<JurisdictionFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // daysUntilEffective is derived from Date.now(), so it must be computed on the
  // client only — otherwise server and client markup can disagree.
  useEffect(() => {
    setChanges(generateRegulatoryChanges())
  }, [])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const summary = useMemo(() => summarizeRegulatory(changes ?? []), [changes])

  const jurisdictionCounts = useMemo(() => {
    const counts = {} as Record<Jurisdiction, number>
    for (const key of JURISDICTION_KEYS) counts[key] = 0
    for (const change of changes ?? []) counts[change.jurisdiction] += 1
    return counts
  }, [changes])

  const filteredChanges = useMemo(() => {
    const list = changes ?? []
    if (jurisdictionFilter === "all") return list
    return list.filter((change) => change.jurisdiction === jurisdictionFilter)
  }, [changes, jurisdictionFilter])

  // Timeline domain: everything already in force collapses onto the left edge.
  const timelineMax = useMemo(
    () =>
      Math.max(
        1,
        ...filteredChanges.map((change) =>
          Math.max(0, change.daysUntilEffective)
        )
      ),
    [filteredChanges]
  )

  const isLoading = changes === null

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
              <Gavel className="w-6 h-6 text-violet-400" />
              {t.pages.regulatoryTitle}
            </h1>
            <p className="text-slate-400 text-sm">
              {t.pages.regulatorySubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 px-3 py-1.5 gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {formatNumber(summary.autoApplicable)}/
              {formatNumber(summary.suggestedAdjustments)}{" "}
              {t.pages.regulatoryAutoApply}
            </Badge>
            <Badge
              variant="outline"
              className="border-violet-500/30 text-violet-300 px-3 py-1.5 font-mono text-[11px]"
            >
              AMLR / FATF / PSR
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
                {t.pages.regulatoryTracked}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.tracked)}
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

          <Card className="bg-slate-900/50 border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-400/80">
                {localized(IMPACT_LABELS.high, locale)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">
                  {formatNumber(summary.highImpact)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.pages.regulatoryReadiness}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Check
                  className={`w-5 h-5 ${readinessText(summary.avgReadiness)}`}
                />
                <span
                  className={`text-2xl font-bold ${readinessText(
                    summary.avgReadiness
                  )}`}
                >
                  {Math.round(summary.avgReadiness)}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(summary.avgReadiness)}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={`h-full rounded-full ${readinessBar(
                    summary.avgReadiness
                  )}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* The nearest deadline is what a compliance lead plans around. */}
          <Card className="bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border-violet-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-violet-200/80">
                {t.pages.regulatoryNextDeadline}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <Calendar className="w-5 h-5 text-violet-300 self-center" />
                <span className="text-4xl font-bold text-white leading-none tabular-nums">
                  {formatNumber(summary.nextDeadlineDays)}
                </span>
                <span className="text-sm font-medium text-violet-200/80">
                  {t.common.days}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ---- Timeline ---- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            {t.common.timeline}
          </h2>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6">
              {isLoading && (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              )}

              {!isLoading && filteredChanges.length === 0 && (
                <div className="flex items-center justify-center h-40">
                  <p className="text-slate-400 text-sm">{t.common.noResults}</p>
                </div>
              )}

              {!isLoading && filteredChanges.length > 0 && (
                <div className="relative h-52 overflow-x-auto overflow-y-hidden">
                  <div className="relative h-full min-w-[720px]">
                    {/* Axis */}
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-800" />

                    {filteredChanges.map((change, index) => {
                      const inForce = change.daysUntilEffective <= 0
                      const position =
                        4 +
                        (Math.max(0, change.daysUntilEffective) / timelineMax) *
                          92
                      // Stagger adjacent labels so dense clusters stay readable.
                      const raised = index % 2 === 1
                      const dotColor = inForce
                        ? "bg-slate-500"
                        : IMPACT_DOT[change.impact]

                      return (
                        <button
                          key={change.id}
                          type="button"
                          onClick={() => toggleExpanded(change.id)}
                          style={{ left: `${position}%` }}
                          className="absolute top-0 bottom-0 w-28 -translate-x-1/2 group text-center focus:outline-none"
                          aria-label={localized(change.title, locale)}
                        >
                          {/* Reference label above the line */}
                          <span
                            style={{
                              bottom: `calc(50% + ${raised ? 52 : 22}px)`,
                            }}
                            className={`absolute left-0 right-0 px-1 font-mono text-[10px] leading-tight break-words ${
                              inForce
                                ? "text-slate-500"
                                : "text-slate-300 group-hover:text-white"
                            }`}
                          >
                            {change.reference}
                          </span>

                          {/* Connector */}
                          <span
                            style={{ height: `${raised ? 46 : 16}px` }}
                            className="absolute left-1/2 bottom-1/2 w-px -translate-x-1/2 bg-slate-800"
                          />

                          {/* Dot */}
                          <span
                            className={`absolute left-1/2 top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-slate-900 transition-transform duration-200 group-hover:scale-150 ${dotColor}`}
                          />

                          {/* Days below the line */}
                          <span
                            style={{ top: "calc(50% + 16px)" }}
                            className={`absolute left-0 right-0 px-1 text-[10px] font-semibold leading-tight ${
                              inForce
                                ? "text-slate-500"
                                : IMPACT_TEXT[change.impact]
                            }`}
                          >
                            {inForce
                              ? localized(STATUS_LABELS.in_force, locale)
                              : formatDays(change.daysUntilEffective, locale)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* ---- Jurisdiction filter tabs ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <Button
            variant={jurisdictionFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setJurisdictionFilter("all")}
            className={
              jurisdictionFilter === "all"
                ? ""
                : "text-slate-400 hover:text-white"
            }
          >
            {t.common.all}
            <span className="ml-1.5 text-xs opacity-70">
              ({changes?.length ?? 0})
            </span>
          </Button>
          {JURISDICTION_KEYS.map((jurisdiction) => (
            <Button
              key={jurisdiction}
              variant={
                jurisdictionFilter === jurisdiction ? "default" : "ghost"
              }
              size="sm"
              onClick={() => setJurisdictionFilter(jurisdiction)}
              className={
                jurisdictionFilter === jurisdiction
                  ? ""
                  : "text-slate-400 hover:text-white"
              }
            >
              {localized(JURISDICTION_LABELS[jurisdiction], locale)}
              <span className="ml-1.5 text-xs opacity-70">
                ({jurisdictionCounts[jurisdiction]})
              </span>
            </Button>
          ))}
        </motion.div>

        {/* ---- Change cards ---- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-violet-400" />
            {t.pages.regulatoryTracked}
            <span className="text-slate-500 text-sm font-normal">
              {t.common.showing} {filteredChanges.length} {t.common.of}{" "}
              {changes?.length ?? 0}
            </span>
          </h2>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
              <p className="text-slate-400 text-sm">{t.common.loading}</p>
            </div>
          )}

          {!isLoading && filteredChanges.length === 0 && (
            <div className="text-center py-16">
              <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-medium">
                {t.common.noResults}
              </p>
            </div>
          )}

          {!isLoading && filteredChanges.length > 0 && (
            <div className="space-y-3">
              {filteredChanges.map((change, index) => {
                const isExpanded = expandedId === change.id
                const inForce = change.daysUntilEffective <= 0

                return (
                  <motion.div
                    key={change.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.4) }}
                  >
                    <Card
                      className={`bg-slate-900/50 border-slate-800/50 border-l-4 ${
                        IMPACT_BORDER[change.impact]
                      }`}
                    >
                      <CardContent className="p-4">
                        {/* Summary row (click to expand) */}
                        <button
                          type="button"
                          onClick={() => toggleExpanded(change.id)}
                          className="w-full text-left"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="font-mono text-[11px] text-violet-300">
                                  {change.reference}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="border-slate-700 text-slate-400 text-[10px] gap-1 px-2 py-0.5"
                                >
                                  <Globe className="w-3 h-3" />
                                  {localized(
                                    JURISDICTION_LABELS[change.jurisdiction],
                                    locale
                                  )}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-2 py-0.5"
                                >
                                  {localized(
                                    STATUS_LABELS[change.status],
                                    locale
                                  )}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-2 py-0.5 ${
                                    IMPACT_BADGE[change.impact]
                                  }`}
                                >
                                  {localized(
                                    IMPACT_LABELS[change.impact],
                                    locale
                                  )}
                                </Badge>
                              </div>

                              <p className="text-white text-sm font-medium leading-snug">
                                {localized(change.title, locale)}
                              </p>

                              <div className="flex items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400 flex-wrap">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  {inForce ? (
                                    <span className="text-slate-500">
                                      {localized(
                                        STATUS_LABELS.in_force,
                                        locale
                                      )}
                                    </span>
                                  ) : (
                                    <>
                                      {t.pages.regulatoryEffective}{" "}
                                      <span
                                        className={`font-semibold ${
                                          IMPACT_TEXT[change.impact]
                                        }`}
                                      >
                                        {formatDays(
                                          change.daysUntilEffective,
                                          locale
                                        )}
                                      </span>
                                    </>
                                  )}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Scale className="w-3 h-3" />
                                  <span className="text-slate-500">
                                    {change.source}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 sm:ml-4">
                              {/* Readiness */}
                              <div className="w-32">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                                    {t.pages.regulatoryReadiness}
                                  </span>
                                  <span
                                    className={`text-xs font-bold ${readinessText(
                                      change.readinessPct
                                    )}`}
                                  >
                                    {change.readinessPct}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${change.readinessPct}%`,
                                    }}
                                    transition={{ duration: 0.6 }}
                                    className={`h-full rounded-full ${readinessBar(
                                      change.readinessPct
                                    )}`}
                                  />
                                </div>
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
                                <p className="text-slate-400 text-xs leading-relaxed">
                                  {localized(change.summary, locale)}
                                </p>

                                {/* Affected controls */}
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                    {t.pages.regulatoryAffected}
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {change.affectedControls.map(
                                      (control, controlIndex) => (
                                        <motion.span
                                          key={control.en}
                                          initial={{ opacity: 0, y: 6 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{
                                            delay: controlIndex * 0.05,
                                          }}
                                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-800/40 px-2.5 py-1 text-[11px] text-slate-300"
                                        >
                                          <AlertTriangle
                                            className={`w-3 h-3 shrink-0 ${
                                              IMPACT_TEXT[change.impact]
                                            }`}
                                          />
                                          {localized(control, locale)}
                                        </motion.span>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Suggested rule adjustments */}
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                    {t.pages.regulatoryAdjustments}
                                  </h4>
                                  <div className="space-y-2">
                                    {change.suggestedAdjustments.map(
                                      (adjustment, adjustmentIndex) => (
                                        <motion.div
                                          key={adjustment.id}
                                          initial={{ opacity: 0, x: -8 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: adjustmentIndex * 0.06,
                                          }}
                                          className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3"
                                        >
                                          <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                              <span className="font-mono text-xs text-violet-300">
                                                {adjustment.ruleName}
                                              </span>
                                              <span className="font-mono text-xs text-slate-500 line-through">
                                                {adjustment.currentValue}
                                              </span>
                                              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                              <span className="font-mono text-xs font-semibold text-emerald-400">
                                                {adjustment.proposedValue}
                                              </span>
                                            </div>
                                            {adjustment.autoApplicable ? (
                                              <Badge
                                                variant="success"
                                                className="text-[10px] px-2 py-0.5 gap-1 shrink-0"
                                              >
                                                <Check className="w-3 h-3" />
                                                {t.pages.regulatoryAutoApply}
                                              </Badge>
                                            ) : (
                                              <Badge
                                                variant="outline"
                                                className="border-slate-700 text-slate-400 text-[10px] px-2 py-0.5 gap-1 shrink-0"
                                              >
                                                <Clock className="w-3 h-3" />
                                                {localized(
                                                  MANUAL_LABEL,
                                                  locale
                                                )}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                                            {localized(
                                              adjustment.rationale,
                                              locale
                                            )}
                                          </p>
                                        </motion.div>
                                      )
                                    )}
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
