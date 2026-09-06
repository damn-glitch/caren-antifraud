"use client"

// CAREN - Payment Approval Automation
// Instant, explainable withdrawal decisions with a live approval feed.
// Author: Alisher Beisembekov

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gauge,
  Check,
  X,
  Clock,
  CreditCard,
  Wallet,
  Banknote,
  TrendingUp,
  TrendingDown,
  Play,
  ShieldCheck,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import type { Locale } from "@/lib/i18n"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
  DECISION_LABELS,
  METHOD_LABELS,
  generatePaymentRequest,
  generatePaymentRequests,
  summarizePayments,
  type ApprovalDecision,
  type ApprovalFactor,
  type PaymentMethod,
  type PaymentRequest,
} from "@/lib/payment-approval"

/** Size of the initial decision backlog rendered on mount. */
const INITIAL_REQUESTS = 28
/** A fresh request lands on the feed on this cadence, so the page feels live. */
const LIVE_TICK_MS = 5000
/** Keeps the feed bounded no matter how long the tab stays open. */
const MAX_FEED_LENGTH = 120

type DecisionFilter = "all" | ApprovalDecision

/** Only the three decisions the engine actually emits get a filter tab. */
const FILTER_DECISIONS: ApprovalDecision[] = [
  "auto_approved",
  "auto_declined",
  "manual_review",
]

type Bilingual = { en: string; ru: string }

/**
 * Strings this module needs that have no i18n key yet. Kept bilingual so the
 * page never renders hardcoded English.
 */
const LABELS = {
  liveFeed: { en: "Live approval feed", ru: "Живая лента решений" },
  simulate: { en: "Simulate request", ru: "Смоделировать запрос" },
  processed: { en: "Requests processed", ru: "Обработано запросов" },
  avgLatency: { en: "Avg decision latency", ru: "Ср. время решения" },
  latency: { en: "Latency", ru: "Задержка" },
  kycTier: { en: "KYC tier", ru: "Уровень KYC" },
  firstWithdrawal: { en: "First withdrawal", ru: "Первый вывод" },
  accountAge: { en: "Account age", ru: "Возраст счёта" },
  lifetimeDeposits: { en: "Lifetime deposits", ru: "Всего пополнений" },
  lifetimeWithdrawals: { en: "Lifetime withdrawals", ru: "Всего выводов" },
  daysShort: { en: "days", ru: "дн." },
  humanTouch: { en: "No human touch required", ru: "Без участия человека" },
} satisfies Record<string, Bilingual>

const DESTINATION_RISK_LABELS: Record<
  PaymentRequest["destinationRisk"],
  Bilingual
> = {
  low: { en: "Low-risk destination", ru: "Низкий риск получателя" },
  medium: { en: "Medium-risk destination", ru: "Средний риск получателя" },
  high: { en: "High-risk destination", ru: "Высокий риск получателя" },
}

const DESTINATION_RISK_CLASS: Record<PaymentRequest["destinationRisk"], string> =
  {
    low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    high: "border-red-500/30 bg-red-500/10 text-red-300",
  }

const METHOD_ICON: Record<PaymentMethod, typeof CreditCard> = {
  bank_transfer: Banknote,
  card_payout: CreditCard,
  e_wallet: Wallet,
  crypto: TrendingUp,
  wire: Banknote,
}

const DECISION_ICON: Record<ApprovalDecision, typeof Check> = {
  auto_approved: Check,
  auto_declined: X,
  manual_review: Clock,
  pending: Clock,
}

function pick(value: Bilingual, locale: Locale): string {
  return locale === "ru" ? value.ru : value.en
}

/** Locale-aware relative timestamp, resolved against a client-owned clock. */
function formatRelativeTime(date: Date, now: number, locale: Locale): string {
  const diffMin = Math.max(0, Math.floor((now - date.getTime()) / 60000))
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

export default function PaymentsPage() {
  const { t, locale } = useLocale()

  const [requests, setRequests] = useState<PaymentRequest[] | null>(null)
  const [now, setNow] = useState(0)
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // generatePaymentRequests() uses Math.random()/Date.now(), so it stays
  // client-only to avoid a server/client hydration mismatch.
  useEffect(() => {
    setRequests(generatePaymentRequests(INITIAL_REQUESTS))
    setNow(Date.now())
  }, [])

  // Live feed: one fresh decision every few seconds until the page unmounts.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now())
      setRequests((prev) =>
        prev === null
          ? prev
          : [generatePaymentRequest(), ...prev].slice(0, MAX_FEED_LENGTH)
      )
    }, LIVE_TICK_MS)

    return () => window.clearInterval(interval)
  }, [])

  const handleSimulate = useCallback(() => {
    setNow(Date.now())
    setRequests((prev) =>
      prev === null
        ? [generatePaymentRequest()]
        : [generatePaymentRequest(), ...prev].slice(0, MAX_FEED_LENGTH)
    )
  }, [])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const summary = useMemo(() => summarizePayments(requests ?? []), [requests])

  const decisionCounts = useMemo(() => {
    const counts: Record<ApprovalDecision, number> = {
      auto_approved: 0,
      auto_declined: 0,
      manual_review: 0,
      pending: 0,
    }
    for (const request of requests ?? []) counts[request.decision] += 1
    return counts
  }, [requests])

  const filteredRequests = useMemo(() => {
    const list = requests ?? []
    if (decisionFilter === "all") return list
    return list.filter((request) => request.decision === decisionFilter)
  }, [requests, decisionFilter])

  const isLoading = requests === null

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
              <Gauge className="w-6 h-6 text-violet-400" />
              {t.pages.paymentsTitle}
            </h1>
            <p className="text-slate-400 text-sm">{t.pages.paymentsSubtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 px-3 py-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              CAREN {t.common.active}
            </Badge>
            <Button
              size="sm"
              onClick={handleSimulate}
              disabled={isLoading}
              aria-label={pick(LABELS.simulate, locale)}
            >
              <Play className="w-4 h-4 mr-1.5" />
              {pick(LABELS.simulate, locale)}
            </Button>
          </div>
        </motion.div>

        {/* ---- Hero metric row ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-4"
        >
          {/* Headline: automation rate */}
          <Card className="bg-slate-900/50 border-slate-800/50 xl:col-span-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
            <CardContent className="relative p-6 flex flex-col justify-center h-full">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.pages.paymentsAutomationRate}
              </p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-6xl sm:text-7xl font-bold tabular-nums leading-none text-emerald-400">
                  {isLoading ? "—" : summary.automationRate.toFixed(1)}
                </span>
                <span className="text-3xl font-bold text-emerald-500/70 pb-1">
                  %
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
                {pick(LABELS.humanTouch, locale)}
              </p>
            </CardContent>
          </Card>

          {/* Supporting metrics */}
          <div className="xl:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  {pick(DECISION_LABELS.auto_approved, locale)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-2xl font-bold text-emerald-400 tabular-nums">
                    {formatNumber(summary.autoApproved)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  {pick(DECISION_LABELS.auto_declined, locale)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-2xl font-bold text-red-400 tabular-nums">
                    {formatNumber(summary.autoDeclined)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  {pick(DECISION_LABELS.manual_review, locale)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-2xl font-bold text-amber-400 tabular-nums">
                    {formatNumber(summary.manualReview)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  {pick(LABELS.avgLatency, locale)}
                </p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white tabular-nums font-mono">
                    {isLoading ? "—" : summary.avgLatencyMs.toFixed(0)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ms</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  {t.pages.paymentsVolumeApproved}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xl font-bold text-white tabular-nums truncate">
                    {formatCurrency(summary.volumeApproved)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  {t.pages.paymentsVolumeBlocked}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-xl font-bold text-white tabular-nums truncate">
                    {formatCurrency(summary.volumeBlocked)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ---- Decision filter tabs ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <Button
            variant={decisionFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setDecisionFilter("all")}
            className={
              decisionFilter === "all" ? "" : "text-slate-400 hover:text-white"
            }
          >
            {t.common.all}
            <span className="ml-1.5 text-xs opacity-70">
              ({requests?.length ?? 0})
            </span>
          </Button>
          {FILTER_DECISIONS.map((decision) => (
            <Button
              key={decision}
              variant={decisionFilter === decision ? "default" : "ghost"}
              size="sm"
              onClick={() => setDecisionFilter(decision)}
              className={
                decisionFilter === decision
                  ? ""
                  : "text-slate-400 hover:text-white"
              }
            >
              {pick(DECISION_LABELS[decision], locale)}
              <span className="ml-1.5 text-xs opacity-70">
                ({decisionCounts[decision]})
              </span>
            </Button>
          ))}
        </motion.div>

        {/* ---- Live approval feed ---- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-violet-400" />
            {pick(LABELS.liveFeed, locale)}
            <span className="text-slate-500 text-sm font-normal">
              {t.common.showing} {filteredRequests.length} {t.common.of}{" "}
              {requests?.length ?? 0}
            </span>
          </h2>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Gauge className="w-8 h-8 text-violet-400 animate-spin mb-3" />
              <p className="text-slate-400 text-sm">{t.common.loading}</p>
            </div>
          )}

          {!isLoading && filteredRequests.length === 0 && (
            <div className="text-center py-16">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-medium">
                {t.common.noResults}
              </p>
            </div>
          )}

          {!isLoading && filteredRequests.length > 0 && (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {filteredRequests.map((request) => {
                  const decisionMeta = DECISION_LABELS[request.decision]
                  const DecisionIcon = DECISION_ICON[request.decision]
                  const MethodIcon = METHOD_ICON[request.method]
                  const isExpanded = expandedId === request.id
                  const maxAbsContribution = Math.max(
                    1,
                    ...request.factors.map((factor) =>
                      Math.abs(factor.contribution)
                    )
                  )

                  return (
                    <motion.div
                      key={request.id}
                      layout
                      initial={{ opacity: 0, y: -18, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      <Card
                        className="bg-slate-900/50 border-slate-800/50 border-l-4"
                        style={{ borderLeftColor: decisionMeta.color }}
                      >
                        <CardContent className="p-4">
                          {/* ---- Summary row (click to expand) ---- */}
                          <button
                            type="button"
                            onClick={() => toggleExpanded(request.id)}
                            aria-expanded={isExpanded}
                            className="w-full text-left"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                              {/* Account + amount */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                  <MethodIcon className="w-4 h-4 text-violet-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {request.accountName}
                                  </p>
                                  <p className="font-mono text-[11px] text-slate-500 truncate">
                                    {request.accountId}
                                  </p>
                                </div>
                                <div className="ml-2 shrink-0">
                                  <p className="text-xl font-bold text-white tabular-nums">
                                    {formatCurrency(request.amount)}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {pick(
                                      METHOD_LABELS[request.method],
                                      locale
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Decision + latency */}
                              <div className="flex items-center gap-2 flex-wrap lg:justify-end">
                                <span className="text-[11px] text-slate-500">
                                  {formatRelativeTime(
                                    request.requestedAt,
                                    now,
                                    locale
                                  )}
                                </span>
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                                  style={{
                                    color: decisionMeta.color,
                                    borderColor: `${decisionMeta.color}55`,
                                    backgroundColor: `${decisionMeta.color}1a`,
                                  }}
                                >
                                  <DecisionIcon className="w-3.5 h-3.5" />
                                  {pick(decisionMeta, locale)}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {request.decisionLatencyMs} ms
                                </span>
                              </div>
                            </div>

                            {/* Chips */}
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-medium text-violet-300">
                                <ShieldCheck className="w-3 h-3" />
                                {pick(LABELS.kycTier, locale)} {request.kycTier}
                              </span>
                              {request.firstWithdrawal && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
                                  <Wallet className="w-3 h-3" />
                                  {pick(LABELS.firstWithdrawal, locale)}
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                                  DESTINATION_RISK_CLASS[request.destinationRisk]
                                }`}
                              >
                                {pick(
                                  DESTINATION_RISK_LABELS[
                                    request.destinationRisk
                                  ],
                                  locale
                                )}
                              </span>
                            </div>

                            {/* Approval score bar */}
                            <div className="mt-3 flex items-center gap-3">
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 shrink-0">
                                {t.pages.paymentsApprovalScore}
                              </span>
                              <div className="h-1.5 flex-1 rounded-full bg-slate-800/70 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${request.approvalScore}%`,
                                  }}
                                  transition={{ duration: 0.6, ease: "easeOut" }}
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor: decisionMeta.color,
                                  }}
                                />
                              </div>
                              <span className="font-mono text-xs text-slate-300 tabular-nums shrink-0 w-10 text-right">
                                {request.approvalScore.toFixed(0)}
                              </span>
                            </div>
                          </button>

                          {/* ---- Expanded explanation ---- */}
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
                                <div className="mt-4 pt-4 border-t border-slate-800/70 space-y-5">
                                  {/* Decision factors */}
                                  <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                                      {t.pages.paymentsFactors}
                                    </h4>
                                    <div className="space-y-3">
                                      {request.factors.map(
                                        (factor: ApprovalFactor, index) => {
                                          const positive =
                                            factor.contribution >= 0
                                          const magnitude =
                                            (Math.abs(factor.contribution) /
                                              maxAbsContribution) *
                                            50

                                          return (
                                            <div
                                              key={factor.key}
                                              className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 items-center"
                                            >
                                              <div className="min-w-0">
                                                <p className="text-sm text-slate-200 truncate">
                                                  {pick(factor.label, locale)}
                                                </p>
                                                <p className="text-[11px] text-slate-500 leading-snug">
                                                  {pick(factor.detail, locale)}
                                                </p>
                                              </div>

                                              <div className="flex items-center gap-3">
                                                {/* Centre-axis contribution bar */}
                                                <div className="relative h-2 flex-1 rounded-full bg-slate-800/60">
                                                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600/70" />
                                                  <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                      width: `${magnitude}%`,
                                                    }}
                                                    transition={{
                                                      duration: 0.5,
                                                      delay: index * 0.05,
                                                      ease: "easeOut",
                                                    }}
                                                    className={`absolute top-0 h-2 ${
                                                      positive
                                                        ? "left-1/2 rounded-r-full bg-emerald-500/80"
                                                        : "right-1/2 rounded-l-full bg-red-500/80"
                                                    }`}
                                                  />
                                                </div>
                                                <span
                                                  className={`font-mono text-xs tabular-nums w-10 text-right shrink-0 ${
                                                    positive
                                                      ? "text-emerald-400"
                                                      : "text-red-400"
                                                  }`}
                                                >
                                                  {positive ? "+" : ""}
                                                  {factor.contribution}
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        }
                                      )}
                                    </div>
                                  </div>

                                  {/* Reasoning */}
                                  <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                      {t.pages.paymentsReasoning}
                                    </h4>
                                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
                                      {pick(request.reasoning, locale)
                                        .split("\n\n")
                                        .map((paragraph, paragraphIndex) => (
                                          <p
                                            key={`${request.id}-reason-${paragraphIndex}`}
                                            className="text-sm text-slate-300 leading-relaxed"
                                          >
                                            {paragraph}
                                          </p>
                                        ))}
                                    </div>
                                  </div>

                                  {/* Account context */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                                        {pick(LABELS.accountAge, locale)}
                                      </p>
                                      <p className="text-sm text-white tabular-nums">
                                        {formatNumber(request.accountAgeDays)}{" "}
                                        <span className="text-slate-400 text-xs">
                                          {pick(LABELS.daysShort, locale)}
                                        </span>
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                                        {pick(LABELS.lifetimeDeposits, locale)}
                                      </p>
                                      <p className="text-sm text-white tabular-nums">
                                        {formatCurrency(
                                          request.lifetimeDeposits
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                                        {pick(
                                          LABELS.lifetimeWithdrawals,
                                          locale
                                        )}
                                      </p>
                                      <p className="text-sm text-white tabular-nums">
                                        {formatCurrency(
                                          request.lifetimeWithdrawals
                                        )}
                                      </p>
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
              </AnimatePresence>
            </div>
          )}
        </motion.section>
      </div>
    </DashboardShell>
  )
}
