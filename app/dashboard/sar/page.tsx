"use client"

// CAREN - Suspicious Activity Report Generator
// The regulatory narrative an analyst would spend an afternoon writing,
// drafted from case evidence and presented as the document examiners expect.
// Author: Alisher Beisembekov

import { useState, useEffect, useMemo, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Locale } from "@/lib/i18n"
import {
  SARDraft,
  SARSection,
  REGIME_META,
  STATUS_META,
  generateSARDraft,
  generateSARDrafts,
  summarizeSAR,
} from "@/lib/sar-generator"
import { motion, AnimatePresence } from "framer-motion"
import {
  ScrollText,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  Copy,
  Download,
  Send,
  Building2,
  Sparkles,
} from "lucide-react"

/** Milliseconds the drafting animation runs before the new report appears. */
const GENERATION_MS = 1500

/**
 * Strings the shared dictionary has no keys for — the document chrome of a
 * filing. Paired here rather than hardcoded in one language.
 */
const DOC_LABELS = {
  documentTitle: {
    en: "Suspicious Activity Report",
    ru: "Сообщение о подозрительной операции",
  },
  newDraft: { en: "New draft", ru: "Новый черновик" },
  drafting: { en: "Drafting narrative...", ru: "Составление текста..." },
  subject: { en: "Subject", ru: "Объект" },
  authority: { en: "Receiving authority", ru: "Принимающий орган" },
  totalAmount: { en: "Total amount", ru: "Общая сумма" },
  transactions: { en: "Transactions", ru: "Операций" },
  dueWithin7: { en: "Due within 7 days", ru: "Срок в течение 7 дней" },
  inDraft: { en: "In draft", ru: "В черновиках" },
  filed: { en: "Filed", ru: "Подано" },
  totalDrafts: { en: "Total drafts", ru: "Всего черновиков" },
  words: { en: "words", ru: "слов" },
  required: { en: "Required", ru: "Обязательный" },
  copy: { en: "Copy text", ru: "Копировать текст" },
  copied: { en: "Copied", ru: "Скопировано" },
  generatedIn: { en: "Generated in", ru: "Составлено за" },
  manual: { en: "manual", ru: "вручную" },
  versus: { en: "vs", ru: "против" },
  selectDraft: {
    en: "Select a draft to read the report",
    ru: "Выберите черновик, чтобы открыть отчёт",
  },
  reportedVolume: { en: "Reported volume", ru: "Объём в сообщениях" },
} as const

/** Bilingual pair reader — every lib object in CAREN carries { en, ru }. */
function pick(pair: { en: string; ru: string }, locale: Locale): string {
  return locale === "ru" ? pair.ru : pair.en
}

/** Deadline pressure has to be visible before it is read. */
function daysColor(days: number): string {
  if (days < 0) return "text-red-400"
  if (days <= 7) return "text-amber-400"
  return "text-slate-400"
}

export default function SARPage() {
  const { t, locale } = useLocale()

  const [drafts, setDrafts] = useState<SARDraft[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)

  // Generated client-side only — Math.random()/Date.now() during render
  // would desynchronise the server and client markup.
  useEffect(() => {
    const initial = generateSARDrafts(10)
    setDrafts(initial)
    setSelectedId(initial[0]?.id ?? null)
  }, [])

  // Drafting animation: progress ticks for ~1.5s, then the report lands.
  useEffect(() => {
    if (!isGenerating) return

    const startedAt = Date.now()
    const ticker = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - startedAt) / GENERATION_MS) * 100))
    }, 40)

    const timer = setTimeout(() => {
      const fresh = generateSARDraft()
      setDrafts((prev) => (prev ? [fresh, ...prev] : [fresh]))
      setSelectedId(fresh.id)
      setProgress(100)
      setIsGenerating(false)
    }, GENERATION_MS)

    return () => {
      clearInterval(ticker)
      clearTimeout(timer)
    }
  }, [isGenerating])

  const startGeneration = useCallback(() => {
    setCopied(false)
    setProgress(0)
    setIsGenerating(true)
  }, [])

  const summary = useMemo(() => summarizeSAR(drafts ?? []), [drafts])

  const selected = useMemo(
    () => (drafts ?? []).find((d) => d.id === selectedId) ?? null,
    [drafts, selectedId]
  )

  const formatDate = useCallback(
    (date: Date): string =>
      date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [locale]
  )

  /** The filing as plain text, in the locale currently on screen. */
  const assembleText = useCallback(
    (draft: SARDraft): string => {
      const regime = REGIME_META[draft.regime]
      const header = [
        `${pick(DOC_LABELS.documentTitle, locale)} — ${draft.id}`,
        `${pick(DOC_LABELS.subject, locale)}: ${draft.subjectName} (${draft.subjectId})`,
        `${t.triage.caseId}: ${draft.caseId}`,
        `${t.pages.sarRegime}: ${pick(regime, locale)} — ${regime.authority}`,
        `${t.pages.sarDeadline}: ${formatDate(draft.deadline)}`,
        `${t.pages.sarDaysRemaining}: ${draft.daysRemaining}`,
        `${pick(DOC_LABELS.totalAmount, locale)}: ${formatCurrency(draft.totalAmount)} / ${
          draft.transactionCount
        } ${pick(DOC_LABELS.transactions, locale)}`,
        `${t.pages.sarActivityTypes}: ${draft.suspiciousActivityTypes
          .map((a) => pick(a, locale))
          .join(", ")}`,
      ].join("\n")

      const body = draft.sections
        .map(
          (section: SARSection, i: number) =>
            `${i + 1}. ${pick(section.title, locale)}\n\n${pick(section.content, locale)}`
        )
        .join("\n\n")

      return `${header}\n\n${"—".repeat(48)}\n\n${body}\n`
    },
    [locale, t, formatDate]
  )

  const copyReport = useCallback(() => {
    if (!selected) return
    if (typeof navigator === "undefined" || !navigator.clipboard) return
    navigator.clipboard.writeText(assembleText(selected)).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      () => setCopied(false)
    )
  }, [selected, assembleText])

  const isLoading = drafts === null

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
              <ScrollText className="w-6 h-6 text-violet-400" />
              {t.pages.sarTitle}
            </h1>
            <p className="text-slate-400 text-sm">{t.pages.sarSubtitle}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="border-violet-500/30 text-violet-300 px-3 py-1.5">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              {pick(DOC_LABELS.reportedVolume, locale)}
              <span className="ml-1.5 font-mono text-slate-300">
                {formatCurrency(summary.totalReported)}
              </span>
            </Badge>
            <Button size="sm" onClick={startGeneration} disabled={isGenerating || isLoading}>
              <Sparkles
                className={`w-4 h-4 mr-1.5 ${isGenerating ? "animate-pulse" : ""}`}
              />
              {isGenerating ? t.common.generating : pick(DOC_LABELS.newDraft, locale)}
            </Button>
          </div>
        </motion.div>

        {/* ---------- Drafting progress ---------- */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              key="drafting"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="bg-slate-900/50 border-violet-500/30">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                      {pick(DOC_LABELS.drafting, locale)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800/70 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.05 }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- Stat row ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {pick(DOC_LABELS.totalDrafts, locale)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white tabular-nums">
                  {formatNumber(summary.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {pick(DOC_LABELS.inDraft, locale)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="text-2xl font-bold text-white tabular-nums">
                  {formatNumber(summary.draft)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {pick(DOC_LABELS.filed, locale)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-bold text-white tabular-nums">
                  {formatNumber(summary.filed)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {pick(DOC_LABELS.dueWithin7, locale)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400 tabular-nums">
                  {formatNumber(summary.dueWithin7Days)}
                </span>
                <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t.pages.sarOverdue}
                  <span className="font-mono tabular-nums">{summary.overdue}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Hero metric: the analyst-days this module gives back. */}
          <Card className="bg-slate-900/50 border-emerald-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-400/80">
                {t.pages.sarHoursSaved}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-emerald-400 tabular-nums">
                  {summary.hoursSaved.toFixed(1)}
                </span>
                <span className="text-sm text-slate-400">{t.common.hours}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {pick(DOC_LABELS.manual, locale)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ---------- Loading ---------- */}
        {isLoading && (
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <ScrollText className="w-8 h-8 text-violet-400 animate-pulse mb-3" />
              <p className="text-slate-400 text-sm">{t.common.loading}</p>
            </CardContent>
          </Card>
        )}

        {/* ---------- Master / detail ---------- */}
        {drafts !== null && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ===== Draft list ===== */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-1"
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                    {t.pages.sarTitle}
                    <span className="text-xs font-normal text-slate-500">
                      ({drafts.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 max-h-[70vh] overflow-y-auto">
                  {drafts.map((draft, index) => {
                    const isSelected = draft.id === selectedId
                    const statusMeta = STATUS_META[draft.status]
                    const regimeMeta = REGIME_META[draft.regime]

                    return (
                      <motion.button
                        key={draft.id}
                        type="button"
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        onClick={() => {
                          setSelectedId(draft.id)
                          setCopied(false)
                        }}
                        aria-pressed={isSelected}
                        className={`w-full text-left rounded-xl border p-4 transition-colors ${
                          isSelected
                            ? "border-violet-500/40 bg-violet-500/10 ring-2 ring-violet-500/40"
                            : "border-slate-800/60 bg-slate-950/40 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {draft.subjectName}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {draft.caseId}
                            </p>
                          </div>
                          <span
                            className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              color: statusMeta.color,
                              borderColor: `${statusMeta.color}55`,
                              backgroundColor: `${statusMeta.color}1a`,
                            }}
                          >
                            {pick(statusMeta, locale)}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="border-slate-700 text-slate-400 text-[10px] px-2 py-0.5"
                          >
                            {pick(regimeMeta, locale)}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-300 tabular-nums">
                            {formatCurrency(draft.totalAmount)}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px]">
                          <Clock className={`w-3 h-3 shrink-0 ${daysColor(draft.daysRemaining)}`} />
                          <span className="text-slate-500">{t.pages.sarDaysRemaining}</span>
                          <span
                            className={`font-mono font-semibold tabular-nums ${daysColor(
                              draft.daysRemaining
                            )}`}
                          >
                            {draft.daysRemaining}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* ===== Report document ===== */}
            <div className="lg:col-span-2">
              {!selected && (
                <Card className="bg-slate-900/50 border-slate-800/50 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                    <ScrollText className="w-12 h-12 text-slate-600 mb-4" />
                    <p className="text-slate-400 text-sm">
                      {pick(DOC_LABELS.selectDraft, locale)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selected && (
                <motion.article
                  key={selected.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="rounded-2xl border border-slate-800/50 bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-slate-950/50 px-6 py-8 sm:px-10 sm:py-12"
                >
                  {/* ---- Document header ---- */}
                  <header className="border-b border-slate-800 pb-8">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-violet-400 mb-3">
                      {t.common.appName} · {selected.id}
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
                      {pick(DOC_LABELS.documentTitle, locale)}
                    </h2>
                    <p className="font-serif text-lg text-slate-300 mt-2">
                      {selected.subjectName}
                      <span className="ml-2 text-sm font-mono text-slate-500">
                        {selected.subjectId}
                      </span>
                    </p>

                    <dl className="mt-7 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                      <div>
                        <dt className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {t.triage.caseId}
                        </dt>
                        <dd className="text-sm font-mono text-slate-200">{selected.caseId}</dd>
                      </div>

                      <div>
                        <dt className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {t.pages.sarRegime}
                        </dt>
                        <dd className="text-sm text-slate-200">
                          {pick(REGIME_META[selected.regime], locale)}
                        </dd>
                        <dd className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 shrink-0" />
                          {REGIME_META[selected.regime].authority}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {t.pages.sarDeadline}
                        </dt>
                        <dd className="text-sm text-slate-200 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {formatDate(selected.deadline)}
                        </dd>
                        <dd
                          className={`text-[11px] mt-0.5 font-mono tabular-nums ${daysColor(
                            selected.daysRemaining
                          )}`}
                        >
                          {t.pages.sarDaysRemaining}: {selected.daysRemaining}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {pick(DOC_LABELS.totalAmount, locale)}
                        </dt>
                        <dd className="text-sm font-semibold text-white tabular-nums">
                          {formatCurrency(selected.totalAmount)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {pick(DOC_LABELS.transactions, locale)}
                        </dt>
                        <dd className="text-sm text-slate-200 tabular-nums">
                          {formatNumber(selected.transactionCount)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {pick(DOC_LABELS.filed, locale)}
                        </dt>
                        <dd>
                          <span
                            className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              color: STATUS_META[selected.status].color,
                              borderColor: `${STATUS_META[selected.status].color}55`,
                              backgroundColor: `${STATUS_META[selected.status].color}1a`,
                            }}
                          >
                            {pick(STATUS_META[selected.status], locale)}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </header>

                  {/* ---- Activity types ---- */}
                  <section className="pt-8">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">
                      {t.pages.sarActivityTypes}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selected.suspiciousActivityTypes.map((activity) => (
                        <span
                          key={activity.en}
                          className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200"
                        >
                          {pick(activity, locale)}
                        </span>
                      ))}
                    </div>
                  </section>

                  {/* ---- Completeness + generation economics ---- */}
                  <section className="mt-8 rounded-xl border border-slate-800/60 bg-slate-950/40 p-5">
                    <div className="flex items-center justify-between gap-4 mb-2.5">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        {t.pages.sarCompleteness}
                      </h3>
                      <span className="text-sm font-bold text-emerald-400 tabular-nums">
                        {selected.completenessPct}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${selected.completenessPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300 flex-wrap">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {pick(DOC_LABELS.generatedIn, locale)}{" "}
                        <span className="font-mono font-semibold">
                          {selected.generatedInSeconds.toFixed(1)}
                        </span>
                        {locale === "ru" ? " с" : "s"} {pick(DOC_LABELS.versus, locale)}{" "}
                        <span className="font-mono font-semibold text-slate-300">
                          {selected.manualEstimateHours.toFixed(1)}
                        </span>
                        {locale === "ru" ? " ч" : "h"}{" "}
                        <span className="text-slate-400">{pick(DOC_LABELS.manual, locale)}</span>
                      </span>
                    </div>
                  </section>

                  {/* ---- Numbered report sections ---- */}
                  <section className="mt-10">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-6">
                      {t.pages.sarSections}
                    </h3>

                    <div className="space-y-10">
                      {selected.sections.map((section: SARSection, index: number) => (
                        <motion.div
                          key={section.key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index }}
                        >
                          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                            <span className="font-serif text-lg font-semibold text-violet-400 tabular-nums shrink-0">
                              {index + 1}.
                            </span>
                            <h4 className="font-serif text-lg font-semibold text-white leading-snug">
                              {pick(section.title, locale)}
                            </h4>
                            <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[10px] font-mono text-slate-400 tabular-nums">
                              {section.wordCount} {pick(DOC_LABELS.words, locale)}
                            </span>
                            {section.required && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                <Check className="w-3 h-3" />
                                {pick(DOC_LABELS.required, locale)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 leading-7 max-w-prose">
                            {pick(section.content, locale)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  {/* ---- Footer actions ---- */}
                  <footer className="mt-12 pt-6 border-t border-slate-800 flex items-center gap-3 flex-wrap">
                    <Button variant="outline" size="sm" onClick={copyReport}>
                      {copied ? (
                        <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1.5" />
                      )}
                      {copied ? pick(DOC_LABELS.copied, locale) : pick(DOC_LABELS.copy, locale)}
                    </Button>

                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <Download className="w-4 h-4 mr-1.5" />
                      {t.common.download}
                    </Button>

                    <Button size="sm" className="ml-auto">
                      <Send className="w-4 h-4 mr-1.5" />
                      {t.aml.fileSar}
                    </Button>
                  </footer>
                </motion.article>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
