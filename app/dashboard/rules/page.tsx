"use client"

// CAREN - Visual Rule Builder & What-If Simulator
// Change a detection threshold and watch the precision/recall trade-off move
// before the rule ever reaches production.
// Author: Alisher Beisembekov

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  SlidersHorizontal,
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Check,
  AlertTriangle,
  Zap,
  Scale,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
  ACTION_META,
  FIELD_META,
  OPERATOR_LABELS,
  computeStats,
  generateRules,
  simulate,
  type Condition,
  type DetectionRule,
  type FieldKey,
  type Operator,
  type RuleStats,
  type SimulationResult,
} from "@/lib/rule-engine"

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const OPERATOR_KEYS = Object.keys(OPERATOR_LABELS) as Operator[]

/** Slider granularity tuned to each field's range so dragging feels natural. */
function stepFor(field: FieldKey): number {
  const meta = FIELD_META[field]
  const span = meta.max - meta.min
  if (span <= 100) return 1
  if (span <= 1500) return 5
  return 50
}

/** Numeric readout that respects the field's unit ($ prefixes, % suffixes). */
function formatFieldValue(field: FieldKey, value: number): string {
  const meta = FIELD_META[field]
  if (meta.unit === "$") return `$${formatNumber(Math.round(value))}`
  if (meta.unit === "%") return `${formatNumber(value)}%`
  if (!meta.unit) return formatNumber(value)
  return `${formatNumber(value)} ${meta.unit}`
}

function sameConditions(a: Condition[], b: Condition[]): boolean {
  if (a.length !== b.length) return false
  return a.every((c, i) => {
    const other = b[i]
    return (
      other !== undefined &&
      c.id === other.id &&
      c.field === other.field &&
      c.operator === other.operator &&
      c.value === other.value &&
      (c.secondValue ?? null) === (other.secondValue ?? null)
    )
  })
}

function signed(value: number, body: string): string {
  return value > 0 ? `+${body}` : body
}

interface Metric {
  id: string
  label: string
  format: (stats: RuleStats) => string
  extract: (stats: RuleStats) => number
  formatDelta: (delta: number) => string
  higherIsBetter: boolean
}

const VERDICT_STYLES: Record<
  SimulationResult["verdict"],
  { wrap: string; title: string; icon: string }
> = {
  improves: {
    wrap: "border-emerald-500/30 bg-emerald-500/5",
    title: "text-emerald-300",
    icon: "text-emerald-400",
  },
  degrades: {
    wrap: "border-red-500/30 bg-red-500/5",
    title: "text-red-300",
    icon: "text-red-400",
  },
  trade_off: {
    wrap: "border-amber-500/30 bg-amber-500/5",
    title: "text-amber-300",
    icon: "text-amber-400",
  },
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function EnabledSwitch({
  on,
  onToggle,
  label,
}: {
  on: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
        on ? "bg-violet-600" : "bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  )
}

function DeltaCell({
  delta,
  text,
  higherIsBetter,
}: {
  delta: number
  text: string
  higherIsBetter: boolean
}) {
  const neutral = Math.abs(delta) < 1e-9
  const improvement = higherIsBetter ? delta > 0 : delta < 0
  const tone = neutral
    ? "text-slate-500"
    : improvement
      ? "text-emerald-400"
      : "text-red-400"

  const Icon = neutral ? ArrowRight : delta > 0 ? TrendingUp : TrendingDown

  return (
    <div className={`flex items-center justify-center gap-1.5 ${tone}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs font-semibold tabular-nums">
        {neutral ? "—" : text}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function RulesPage() {
  const { t, locale } = useLocale()

  const [rules, setRules] = useState<DetectionRule[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftConditions, setDraftConditions] = useState<Condition[]>([])
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({})

  // generateRules() uses Math.random()/Date.now(), so it must never run during
  // render — mount only, with a loading state until it resolves.
  useEffect(() => {
    const generated = generateRules()
    setRules(generated)
    setEnabledMap(
      generated.reduce<Record<string, boolean>>((acc, rule) => {
        acc[rule.id] = rule.enabled
        return acc
      }, {})
    )
    const first = generated[0]
    if (first) {
      setSelectedId(first.id)
      setDraftConditions(first.conditions.map((c) => ({ ...c })))
    }
  }, [])

  const selectedRule = useMemo(
    () => rules?.find((rule) => rule.id === selectedId) ?? null,
    [rules, selectedId]
  )

  const isDirty = useMemo(
    () =>
      selectedRule ? !sameConditions(selectedRule.conditions, draftConditions) : false,
    [selectedRule, draftConditions]
  )

  // Baseline for the "current" card while nothing has been edited yet.
  const baseStats = useMemo(
    () => (selectedRule ? computeStats(selectedRule.conditions, selectedRule.action) : null),
    [selectedRule]
  )

  // Live what-if: only simulated once the draft actually diverges.
  const result = useMemo(
    () =>
      selectedRule && isDirty
        ? simulate(selectedRule.conditions, draftConditions, selectedRule.action)
        : null,
    [selectedRule, draftConditions, isDirty]
  )

  const metrics = useMemo<Metric[]>(
    () => [
      {
        id: "triggers",
        label: t.pages.rulesTriggersPerDay,
        format: (s) => formatNumber(s.triggersPerDay),
        extract: (s) => s.triggersPerDay,
        formatDelta: (d) => signed(d, formatNumber(Math.round(d))),
        higherIsBetter: false,
      },
      {
        id: "precision",
        label: "Precision",
        format: (s) => `${(s.precision * 100).toFixed(1)}%`,
        extract: (s) => s.precision * 100,
        formatDelta: (d) => signed(d, `${d.toFixed(1)}%`),
        higherIsBetter: true,
      },
      {
        id: "recall",
        label: "Recall",
        format: (s) => `${(s.recall * 100).toFixed(1)}%`,
        extract: (s) => s.recall * 100,
        formatDelta: (d) => signed(d, `${d.toFixed(1)}%`),
        higherIsBetter: true,
      },
      {
        id: "f1",
        label: "F1",
        format: (s) => s.f1.toFixed(3),
        extract: (s) => s.f1,
        formatDelta: (d) => signed(d, d.toFixed(3)),
        higherIsBetter: true,
      },
      {
        id: "hours",
        label: t.pages.rulesAnalystHours,
        format: (s) => (s.analystMinutesPerDay / 60).toFixed(1),
        extract: (s) => s.analystMinutesPerDay / 60,
        formatDelta: (d) => signed(d, d.toFixed(1)),
        higherIsBetter: false,
      },
      {
        id: "exposure",
        label: t.pages.syntheticExposure,
        format: (s) => formatCurrency(s.exposureCaught),
        extract: (s) => s.exposureCaught,
        formatDelta: (d) => signed(d, formatCurrency(Math.round(d))),
        higherIsBetter: true,
      },
    ],
    [t]
  )

  const handleSelect = (rule: DetectionRule) => {
    setSelectedId(rule.id)
    setDraftConditions(rule.conditions.map((c) => ({ ...c })))
  }

  const handleReset = () => {
    if (!selectedRule) return
    setDraftConditions(selectedRule.conditions.map((c) => ({ ...c })))
  }

  const patchCondition = (id: string, patch: Partial<Condition>) => {
    setDraftConditions((prev) =>
      prev.map((condition) =>
        condition.id === id ? { ...condition, ...patch } : condition
      )
    )
  }

  const handleOperatorChange = (condition: Condition, next: Operator) => {
    if (next === "between") {
      const meta = FIELD_META[condition.field]
      const fallback = Math.min(
        meta.max,
        condition.value + Math.max(1, (meta.max - meta.min) * 0.1)
      )
      patchCondition(condition.id, {
        operator: next,
        secondValue: condition.secondValue ?? Math.round(fallback),
      })
      return
    }
    patchCondition(condition.id, { operator: next, secondValue: undefined })
  }

  /* ---------------------------------------------------------------- */
  /* Loading                                                           */
  /* ---------------------------------------------------------------- */

  if (!rules || !selectedRule || !baseStats) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-violet-400" />
              {t.pages.rulesTitle}
            </h1>
            <p className="text-slate-400 text-sm">{t.pages.rulesSubtitle}</p>
          </div>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-t-violet-500 animate-spin" />
                <p className="text-slate-400 text-sm">{t.common.loading}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  const before: RuleStats = result ? result.before : baseStats
  const after: RuleStats | null = result ? result.after : null
  const verdictStyle = result ? VERDICT_STYLES[result.verdict] : null
  const missedFraud = result ? result.delta.missedFraud : 0
  const narrativeParagraphs = result
    ? (locale === "ru" ? result.narrative.ru : result.narrative.en).split("\n\n")
    : []

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

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
              <SlidersHorizontal className="w-6 h-6 text-violet-400" />
              {t.pages.rulesTitle}
            </h1>
            <p className="text-slate-400 text-sm">{t.pages.rulesSubtitle}</p>
          </div>

          <div
            className={`inline-flex items-center gap-2 self-start lg:self-auto rounded-full border px-3 py-1.5 text-xs font-semibold ${
              isDirty
                ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                : "border-slate-700 bg-slate-800/40 text-slate-400"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {t.pages.rulesSimulate}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* ---- Left: rule list ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-1"
          >
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-400" />
                  {t.nav.rules}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rules.map((rule) => {
                  const action = ACTION_META[rule.action]
                  const isSelected = rule.id === selectedRule.id
                  const isEnabled = enabledMap[rule.id] ?? rule.enabled

                  return (
                    <div
                      key={rule.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelect(rule)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          handleSelect(rule)
                        }
                      }}
                      className={`w-full text-left rounded-xl border p-3.5 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                        isSelected
                          ? "border-violet-500/40 bg-violet-500/10"
                          : "border-slate-800/60 bg-slate-800/20 hover:border-slate-700 hover:bg-slate-800/40"
                      } ${isEnabled ? "" : "opacity-60"}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-medium text-white leading-snug">
                          {locale === "ru" ? rule.name.ru : rule.name.en}
                        </p>
                        <EnabledSwitch
                          on={isEnabled}
                          label={isEnabled ? t.common.active : t.common.inactive}
                          onToggle={() =>
                            setEnabledMap((prev) => ({
                              ...prev,
                              [rule.id]: !(prev[rule.id] ?? rule.enabled),
                            }))
                          }
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{
                            color: action.color,
                            borderColor: `${action.color}55`,
                            backgroundColor: `${action.color}1a`,
                          }}
                        >
                          {locale === "ru" ? action.ru : action.en}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-slate-400 px-2 py-0.5 text-[11px] font-medium"
                        >
                          {rule.conditions.length} · {t.pages.rulesConditions}
                        </Badge>
                      </div>

                      <div className="mt-2.5 flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-white tabular-nums">
                          {formatNumber(rule.stats.triggersPerDay)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {t.pages.rulesTriggersPerDay}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* ---- Right: editor + simulator ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="xl:col-span-2 space-y-6"
          >
            {/* Condition editor */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-violet-400" />
                      {t.pages.rulesConditions}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1.5">
                      {locale === "ru" ? selectedRule.name.ru : selectedRule.name.en}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={!isDirty}
                      className="border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      {t.common.cancel}
                    </Button>
                    <Button
                      size="sm"
                      disabled
                      className="bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed hover:bg-slate-800"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      {t.common.save}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {draftConditions.map((condition) => {
                  const meta = FIELD_META[condition.field]
                  const operator = OPERATOR_LABELS[condition.operator]
                  const step = stepFor(condition.field)
                  const original = selectedRule.conditions.find(
                    (c) => c.id === condition.id
                  )
                  const changed =
                    original !== undefined &&
                    (original.value !== condition.value ||
                      original.operator !== condition.operator ||
                      (original.secondValue ?? null) !== (condition.secondValue ?? null))

                  return (
                    <div
                      key={condition.id}
                      className={`rounded-xl border p-4 transition-colors duration-200 ${
                        changed
                          ? "border-violet-500/40 bg-violet-500/5"
                          : "border-slate-800/60 bg-slate-800/20"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <p className="text-sm font-medium text-white">
                          {locale === "ru" ? meta.ru : meta.en}
                        </p>

                        <div className="flex items-center gap-3">
                          <select
                            value={condition.operator}
                            onChange={(event) =>
                              handleOperatorChange(
                                condition,
                                event.target.value as Operator
                              )
                            }
                            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
                          >
                            {OPERATOR_KEYS.map((key) => {
                              const label = OPERATOR_LABELS[key]
                              return (
                                <option key={key} value={key}>
                                  {label.symbol}{" "}
                                  {locale === "ru" ? label.ru : label.en}
                                </option>
                              )
                            })}
                          </select>

                          <span className="text-lg font-bold text-violet-400 tabular-nums whitespace-nowrap">
                            {formatFieldValue(condition.field, condition.value)}
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={meta.min}
                        max={meta.max}
                        step={step}
                        value={condition.value}
                        onChange={(event) =>
                          patchCondition(condition.id, {
                            value: Number(event.target.value),
                          })
                        }
                        aria-label={locale === "ru" ? meta.ru : meta.en}
                        className="w-full accent-violet-600 cursor-pointer"
                      />

                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 tabular-nums">
                        <span>{formatFieldValue(condition.field, meta.min)}</span>
                        <span className="text-slate-600">{operator.symbol}</span>
                        <span>{formatFieldValue(condition.field, meta.max)}</span>
                      </div>

                      {condition.operator === "between" && (
                        <div className="mt-4 pt-3 border-t border-slate-800/60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">
                              {operator.symbol}{" "}
                              {locale === "ru" ? operator.ru : operator.en}
                            </span>
                            <span className="text-sm font-semibold text-violet-300 tabular-nums">
                              {formatFieldValue(
                                condition.field,
                                condition.secondValue ?? condition.value
                              )}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={meta.min}
                            max={meta.max}
                            step={step}
                            value={condition.secondValue ?? condition.value}
                            onChange={(event) =>
                              patchCondition(condition.id, {
                                secondValue: Number(event.target.value),
                              })
                            }
                            aria-label={`${locale === "ru" ? meta.ru : meta.en} — ${
                              locale === "ru" ? operator.ru : operator.en
                            }`}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Before / delta / after */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-violet-400" />
                  {t.pages.rulesBefore}
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  {t.pages.rulesAfter}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
                  {/* Before */}
                  <div className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                      {t.pages.rulesBefore}
                    </p>
                    <div className="space-y-2.5">
                      {metrics.map((metric) => (
                        <div
                          key={metric.id}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-xs text-slate-400">{metric.label}</span>
                          <span className="text-sm font-semibold text-white tabular-nums">
                            {metric.format(before)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delta column */}
                  <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-3 py-4 flex flex-col justify-start lg:min-w-[130px]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-3 text-center">
                      Δ
                    </p>
                    <div className="space-y-2.5">
                      {metrics.map((metric) => {
                        const delta = after
                          ? metric.extract(after) - metric.extract(before)
                          : 0
                        return (
                          <div key={metric.id} className="h-[21px] flex items-center">
                            <div className="w-full">
                              <DeltaCell
                                delta={after ? delta : 0}
                                text={metric.formatDelta(delta)}
                                higherIsBetter={metric.higherIsBetter}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* After */}
                  <div
                    className={`rounded-xl border p-4 transition-colors duration-200 ${
                      after
                        ? "border-violet-500/40 bg-violet-500/5"
                        : "border-slate-800/60 bg-slate-800/10"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                      {t.pages.rulesAfter}
                    </p>
                    <div className="space-y-2.5">
                      {metrics.map((metric) => (
                        <div
                          key={metric.id}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-xs text-slate-400">{metric.label}</span>
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              after ? "text-violet-200" : "text-slate-600"
                            }`}
                          >
                            {after ? metric.format(after) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Missed fraud — the cost of loosening */}
                <div
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors duration-200 ${
                    missedFraud > 0
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-slate-800/60 bg-slate-800/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        missedFraud > 0 ? "text-red-400" : "text-slate-500"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        missedFraud > 0 ? "text-red-300" : "text-slate-400"
                      }`}
                    >
                      {t.pages.rulesMissedFraud}
                    </span>
                  </div>
                  <span
                    className={`text-xl font-bold tabular-nums ${
                      missedFraud > 0 ? "text-red-400" : "text-slate-500"
                    }`}
                  >
                    {formatNumber(missedFraud)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Verdict + narrative */}
            <Card
              className={`border ${
                verdictStyle
                  ? `${verdictStyle.wrap}`
                  : "border-slate-800/50 bg-slate-900/50"
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle
                  className={`text-lg font-semibold flex items-center gap-2 ${
                    verdictStyle ? verdictStyle.title : "text-white"
                  }`}
                >
                  <Scale
                    className={`w-5 h-5 ${
                      verdictStyle ? verdictStyle.icon : "text-violet-400"
                    }`}
                  />
                  {t.pages.rulesVerdict}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    {narrativeParagraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-sm text-slate-300 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                    <Play className="w-6 h-6 text-slate-600" />
                    <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                      {t.pages.rulesSubtitle}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  )
}
