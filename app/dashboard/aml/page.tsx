"use client"

// CAREN - Anti-Money Laundering (AML) Monitoring Page
// Author: Alisher Beisembekov

import { useState, useEffect, useMemo, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  AMLPattern,
  AMLPatternType,
  AML_TYPOLOGIES,
  generateAMLPatterns,
  summarizeAML,
} from "@/lib/aml-detection"
import { Locale } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
  Landmark,
  Shield,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Info,
  Clock,
  ChevronDown,
  Users,
  Wallet,
  FileText,
  BookOpen,
  Scale,
  Calendar,
  Loader2,
  Layers,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type TypologyFilter = "all" | AMLPatternType
type Severity = AMLPattern["severity"]
type TypologyMeta = (typeof AML_TYPOLOGIES)[AMLPatternType]

const TYPOLOGY_KEYS = Object.keys(AML_TYPOLOGIES) as AMLPatternType[]

const SEVERITY_BORDER: Record<Severity, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-amber-400",
  low: "border-l-blue-400",
}

const SEVERITY_TEXT: Record<Severity, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-amber-400",
  low: "text-blue-400",
}

const SEVERITY_BADGE_VARIANT: Record<
  Severity,
  "critical" | "destructive" | "warning" | "default"
> = {
  critical: "critical",
  high: "destructive",
  medium: "warning",
  low: "default",
}

const SEVERITY_ICON: Record<Severity, React.ReactNode> = {
  critical: <XCircle className="w-5 h-5 text-red-500" />,
  high: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  medium: <AlertCircle className="w-5 h-5 text-amber-400" />,
  low: <Info className="w-5 h-5 text-blue-400" />,
}

/** Localized typology label. */
function typologyLabel(meta: TypologyMeta, locale: Locale): string {
  return locale === "ru" ? meta.labelRu : meta.labelEn
}

/** Localized typology description. */
function typologyDescription(meta: TypologyMeta, locale: Locale): string {
  return locale === "ru" ? meta.descriptionRu : meta.descriptionEn
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

/** Locale-aware analysis-window chip, e.g. "30d" / "30 дн". */
function formatWindow(days: number, locale: Locale): string {
  return locale === "ru" ? `${days} дн` : `${days}d`
}

export default function AMLPage() {
  const { t, locale } = useLocale()

  const [patterns, setPatterns] = useState<AMLPattern[] | null>(null)
  const [typologyFilter, setTypologyFilter] = useState<TypologyFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Generated client-side only — Math.random() during render would break hydration.
  useEffect(() => {
    setPatterns(generateAMLPatterns(24))
  }, [])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const summary = useMemo(() => summarizeAML(patterns ?? []), [patterns])

  const typologyCounts = useMemo(() => {
    const counts = {} as Record<AMLPatternType, number>
    for (const key of TYPOLOGY_KEYS) counts[key] = 0
    for (const pattern of patterns ?? []) counts[pattern.type] += 1
    return counts
  }, [patterns])

  const filteredPatterns = useMemo(() => {
    const list = patterns ?? []
    if (typologyFilter === "all") return list
    return list.filter((pattern) => pattern.type === typologyFilter)
  }, [patterns, typologyFilter])

  const isLoading = patterns === null

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
              <Landmark className="w-6 h-6 text-violet-400" />
              {t.aml.title}
            </h1>
            <p className="text-slate-400 text-sm">{t.aml.subtitle}</p>
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
              FATF R.10 / BSA
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
                {t.aml.patternsDetected}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.risk.critical}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-400">
                  {formatNumber(summary.critical)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.aml.accountsFlagged}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.accountsFlagged)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.aml.volumeFlagged}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(summary.volumeFlagged)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-400/80">
                {t.aml.sarCandidates}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">
                  {formatNumber(summary.sarCandidates)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ---- Typology filter tabs ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <Button
            variant={typologyFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTypologyFilter("all")}
            className={
              typologyFilter === "all" ? "" : "text-slate-400 hover:text-white"
            }
          >
            {t.common.all}
            <span className="ml-1.5 text-xs opacity-70">
              ({patterns?.length ?? 0})
            </span>
          </Button>
          {TYPOLOGY_KEYS.map((type) => (
            <Button
              key={type}
              variant={typologyFilter === type ? "default" : "ghost"}
              size="sm"
              onClick={() => setTypologyFilter(type)}
              className={
                typologyFilter === type ? "" : "text-slate-400 hover:text-white"
              }
            >
              {typologyLabel(AML_TYPOLOGIES[type], locale)}
              <span className="ml-1.5 text-xs opacity-70">
                ({typologyCounts[type]})
              </span>
            </Button>
          ))}
        </motion.div>

        {/* ---- Typology reference grid ---- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            {t.aml.typology}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {TYPOLOGY_KEYS.map((type, index) => {
              const meta = AML_TYPOLOGIES[type]
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.04 }}
                >
                  <Card
                    glow
                    className="bg-slate-900/50 border-slate-800/50 h-full cursor-pointer"
                    onClick={() => setTypologyFilter(type)}
                  >
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white text-sm font-semibold leading-snug">
                          {typologyLabel(meta, locale)}
                        </h3>
                        <Badge
                          variant={SEVERITY_BADGE_VARIANT[meta.baseSeverity]}
                          className="shrink-0 text-[10px] px-2 py-0.5"
                        >
                          {t.risk[meta.baseSeverity]}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed flex-1">
                        {typologyDescription(meta, locale)}
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-mono text-[10px] text-slate-500 truncate">
                          {meta.regulatoryRef}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ---- Detected patterns ---- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-violet-400" />
            {t.aml.patternsDetected}
            <span className="text-slate-500 text-sm font-normal">
              {t.common.showing} {filteredPatterns.length} {t.common.of}{" "}
              {patterns?.length ?? 0}
            </span>
          </h2>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
              <p className="text-slate-400 text-sm">{t.common.loading}</p>
            </div>
          )}

          {!isLoading && filteredPatterns.length === 0 && (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-medium">
                {t.common.noResults}
              </p>
            </div>
          )}

          {!isLoading && filteredPatterns.length > 0 && (
            <div className="space-y-3">
              {filteredPatterns.map((pattern, index) => {
                const meta = AML_TYPOLOGIES[pattern.type]
                const isExpanded = expandedId === pattern.id

                return (
                  <motion.div
                    key={pattern.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.4) }}
                  >
                    <Card
                      className={`bg-slate-900/50 border-slate-800/50 border-l-4 ${
                        SEVERITY_BORDER[pattern.severity]
                      }`}
                    >
                      <CardContent className="p-4">
                        {/* Summary row (click to expand) */}
                        <button
                          type="button"
                          onClick={() => toggleExpanded(pattern.id)}
                          className="w-full text-left"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="mt-0.5 shrink-0">
                                {SEVERITY_ICON[pattern.severity]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <Badge
                                    variant={
                                      SEVERITY_BADGE_VARIANT[pattern.severity]
                                    }
                                  >
                                    {t.risk[pattern.severity]}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-violet-500/30 text-violet-300 text-[10px]"
                                  >
                                    {typologyLabel(meta, locale)}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-slate-700 text-slate-400 text-[10px] gap-1"
                                  >
                                    <Calendar className="w-3 h-3" />
                                    {formatWindow(pattern.windowDays, locale)}
                                  </Badge>
                                  {pattern.sarCandidate && (
                                    <Badge
                                      variant="warning"
                                      className="text-[10px] gap-1"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {t.aml.sarCandidates}
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-white text-sm font-medium truncate">
                                  {pattern.accountName}
                                </p>

                                <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400 flex-wrap">
                                  <span className="font-mono text-slate-500">
                                    {pattern.accountId}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatRelativeTime(
                                      pattern.detectedAt,
                                      locale
                                    )}
                                  </span>
                                  <span>
                                    {formatNumber(pattern.transactionCount)}{" "}
                                    {t.transactions.title.toLowerCase()}
                                  </span>
                                  <span className="text-slate-300 font-semibold">
                                    {formatCurrency(pattern.totalVolume)}
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
                                    SEVERITY_TEXT[pattern.severity]
                                  }`}
                                >
                                  {Math.round(pattern.confidence * 100)}%
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
                                <p className="text-slate-400 text-xs leading-relaxed">
                                  {typologyDescription(meta, locale)}
                                </p>

                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                    {t.aml.indicators}
                                  </h4>
                                  <ul className="space-y-2">
                                    {pattern.indicators.map(
                                      (indicator, indicatorIndex) => (
                                        <motion.li
                                          key={indicator}
                                          initial={{ opacity: 0, x: -8 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: indicatorIndex * 0.06,
                                          }}
                                          className="flex items-start gap-2 text-sm text-slate-300"
                                        >
                                          <AlertTriangle
                                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                                              SEVERITY_TEXT[pattern.severity]
                                            }`}
                                          />
                                          <span>{indicator}</span>
                                        </motion.li>
                                      )
                                    )}
                                  </ul>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Scale className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                                      {t.aml.regulatoryRef}
                                    </span>
                                    <span className="font-mono text-xs text-slate-300 truncate">
                                      {pattern.regulatoryRef}
                                    </span>
                                  </div>
                                  <Button
                                    variant={
                                      pattern.sarCandidate
                                        ? "warning"
                                        : "outline"
                                    }
                                    size="sm"
                                    className={
                                      pattern.sarCandidate
                                        ? ""
                                        : "border-slate-700"
                                    }
                                  >
                                    <FileText className="w-4 h-4 mr-1.5" />
                                    {t.aml.fileSar}
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
