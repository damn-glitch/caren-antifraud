"use client"

// CAREN - Partner & Affiliate Fraud Detection page
// Surfaces partners whose commission outruns the value their cohort actually generates.

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Handshake,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  DollarSign,
  Crown,
  Clock,
  Network,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/lib/locale-context"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
  generateAffiliatePartners,
  summarizeAffiliates,
  SCHEME_META,
  TIER_LABELS,
  STATUS_LABELS,
  type AffiliatePartner,
  type AffiliateScheme,
} from "@/lib/affiliate-fraud"

const EMERALD = "#10b981"
const AMBER = "#f59e0b"
const RED = "#ef4444"

type Severity = "low" | "medium" | "high" | "critical"
type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning" | "outline" | "critical"

/** Strings this page needs that are not part of the shared `pages.*` dictionary. */
const LABELS = {
  totalPartners: { en: "Total partners", ru: "Всего партнёров" },
  flagged: { en: "Flagged partners", ru: "Помеченные партнёры" },
  suspended: { en: "Suspended", ru: "Приостановлены" },
  forecastEscalations: { en: "Forecast escalations", ru: "Прогноз эскалаций" },
  schemeReference: { en: "Scheme reference", ru: "Справочник схем" },
  schemeHint: {
    en: "Select a scheme to filter partners exhibiting it",
    ru: "Выберите схему, чтобы отфильтровать партнёров с этим признаком",
  },
  partners: { en: "Partners", ru: "Партнёры" },
  selectPartner: { en: "Select a partner to review", ru: "Выберите партнёра для разбора" },
  fraudScore: { en: "Fraud score", ru: "Скор фрода" },
  activeClients: { en: "Active clients", ru: "Активные клиенты" },
  commissionPaid: { en: "Commission paid", ru: "Выплачено комиссии" },
  lifetimeValue: { en: "Client lifetime value", ru: "Пожизненная ценность клиентов" },
  subAffiliates: { en: "Sub-affiliates", ru: "Суб-аффилиаты" },
  countryConcentration: { en: "Country concentration", ru: "Концентрация по стране" },
  ratioWarning: {
    en: "Above 1.0 the programme pays out more than the cohort generates — every referral loses money.",
    ru: "Выше 1.0 программа выплачивает больше, чем генерирует когорта — каждый реферал приносит убыток.",
  },
  ratioHealthy: {
    en: "Below break-even — the cohort still generates more than it costs.",
    ru: "Ниже точки безубыточности — когорта пока генерирует больше, чем стоит.",
  },
  aiNarrative: { en: "AI narrative", ru: "Аналитика ИИ" },
  noSchemes: { en: "No scheme signatures detected", ru: "Сигнатуры схем не выявлены" },
  weeksAhead: { en: "weeks ahead", ru: "нед. вперёд" },
} as const

const SEVERITY_LABELS: Record<Severity, { en: string; ru: string }> = {
  low: { en: "Low", ru: "Низкая" },
  medium: { en: "Medium", ru: "Средняя" },
  high: { en: "High", ru: "Высокая" },
  critical: { en: "Critical", ru: "Критическая" },
}

const SEVERITY_VARIANT: Record<Severity, BadgeVariant> = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
  critical: "critical",
}

const STATUS_VARIANT: Record<AffiliatePartner["status"], BadgeVariant> = {
  healthy: "success",
  watchlist: "warning",
  suspended: "destructive",
  terminated: "critical",
}

function scoreColor(score: number): string {
  if (score > 80) return RED
  if (score > 55) return AMBER
  return EMERALD
}

function scoreTextClass(score: number): string {
  if (score > 80) return "text-red-400"
  if (score > 55) return "text-amber-400"
  return "text-emerald-400"
}

function scoreChipClass(score: number): string {
  if (score > 80) return "bg-red-500/10 text-red-400 border-red-500/20"
  if (score > 55) return "bg-amber-500/10 text-amber-400 border-amber-500/20"
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
}

interface KeyedPartner {
  key: string
  partner: AffiliatePartner
}

const ALL_SCHEMES = Object.keys(SCHEME_META) as AffiliateScheme[]

export default function AffiliatesPage() {
  const { t, locale } = useLocale()
  const [partners, setPartners] = useState<AffiliatePartner[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [schemeFilter, setSchemeFilter] = useState<AffiliateScheme | null>(null)

  // Generated client-side only — the engine uses Math.random/Date.now, which would break hydration.
  useEffect(() => {
    const generated = generateAffiliatePartners(18)
    setPartners(generated)
    setSelectedKey(generated.length > 0 ? `${generated[0].id}-0` : null)
  }, [])

  const loading = partners.length === 0

  const pick = (value: { en: string; ru: string }): string => (locale === "ru" ? value.ru : value.en)

  const keyed = useMemo<KeyedPartner[]>(
    () => partners.map((partner, index) => ({ key: `${partner.id}-${index}`, partner })),
    [partners]
  )

  const visible = useMemo<KeyedPartner[]>(
    () =>
      schemeFilter === null
        ? keyed
        : keyed.filter(entry => entry.partner.schemes.includes(schemeFilter)),
    [keyed, schemeFilter]
  )

  const selected = useMemo<KeyedPartner | null>(
    () => visible.find(entry => entry.key === selectedKey) ?? visible[0] ?? null,
    [visible, selectedKey]
  )

  const summary = useMemo(() => summarizeAffiliates(partners), [partners])

  const schemeCounts = useMemo(() => {
    const counts = {} as Record<AffiliateScheme, number>
    for (const scheme of ALL_SCHEMES) counts[scheme] = 0
    for (const partner of partners) {
      for (const scheme of partner.schemes) counts[scheme] += 1
    }
    return counts
  }, [partners])

  const stats = [
    {
      key: "total",
      title: pick(LABELS.totalPartners),
      value: formatNumber(summary.total),
      icon: Users,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
    {
      key: "flagged",
      title: pick(LABELS.flagged),
      value: formatNumber(summary.flagged),
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      key: "suspended",
      title: pick(LABELS.suspended),
      value: formatNumber(summary.suspended),
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      key: "atRisk",
      title: t.pages.affiliatesCommissionAtRisk,
      value: formatCurrency(summary.commissionAtRisk),
      icon: DollarSign,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      key: "forecast",
      title: pick(LABELS.forecastEscalations),
      value: formatNumber(summary.forecastEscalations),
      icon: TrendingUp,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
  ]

  const selectedPartner = selected?.partner ?? null
  const retention = selectedPartner
    ? ((selectedPartner.activeClients / Math.max(1, selectedPartner.referredClients)) * 100).toFixed(0)
    : "0"
  const ratioIsLossy = selectedPartner ? selectedPartner.commissionRatio > 1 : false

  return (
    <DashboardShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Handshake className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{t.pages.affiliatesTitle}</h1>
            <p className="text-slate-400 text-sm">{t.pages.affiliatesSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Network className="w-4 h-4 text-emerald-400" />
          <span>{t.common.systemOnline}</span>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-t-violet-500 animate-spin" />
          <p className="text-slate-400 text-sm">{t.common.loading}</p>
        </div>
      ) : (
        <>
          {/* Stat row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-slate-900/50 border-slate-800/50 ${stat.borderColor}`}>
                  <CardContent className="p-5">
                    <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-white truncate">{stat.value}</p>
                    <p className="text-sm text-slate-400 mt-1">{stat.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Scheme reference grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg text-white font-semibold">
                      {pick(LABELS.schemeReference)}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">{pick(LABELS.schemeHint)}</p>
                  </div>
                  {schemeFilter !== null && (
                    <button
                      type="button"
                      onClick={() => setSchemeFilter(null)}
                      className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition-colors"
                    >
                      {t.common.all}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {ALL_SCHEMES.map((scheme, index) => {
                    const meta = SCHEME_META[scheme]
                    const isActive = schemeFilter === scheme
                    return (
                      <motion.button
                        key={scheme}
                        type="button"
                        onClick={() => setSchemeFilter(isActive ? null : scheme)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.03 }}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                          isActive
                            ? "bg-violet-500/10 border-violet-500/30 ring-2 ring-violet-500/40"
                            : "bg-slate-800/30 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-semibold text-white">
                            {locale === "ru" ? meta.ru : meta.en}
                          </span>
                          <Badge variant={SEVERITY_VARIANT[meta.severity]} className="shrink-0">
                            {pick(SEVERITY_LABELS[meta.severity])}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {locale === "ru" ? meta.descRu : meta.descEn}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-3">
                          {pick(LABELS.partners)}:{" "}
                          <span className="text-slate-300 font-semibold">
                            {formatNumber(schemeCounts[scheme])}
                          </span>
                        </p>
                      </motion.button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Partner list */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-1"
            >
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg text-white font-semibold">
                      {pick(LABELS.partners)}
                    </CardTitle>
                    <span className="text-xs text-slate-500">
                      {t.common.showing} {formatNumber(visible.length)} {t.common.of}{" "}
                      {formatNumber(keyed.length)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {visible.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">{t.common.noResults}</p>
                  ) : (
                    <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
                      {visible.map((entry, index) => {
                        const partner = entry.partner
                        const isSelected = selected?.key === entry.key
                        return (
                          <motion.button
                            key={entry.key}
                            type="button"
                            onClick={() => setSelectedKey(entry.key)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.02 }}
                            className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? "bg-violet-500/10 border-violet-500/30 ring-2 ring-violet-500/40"
                                : "bg-slate-800/30 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-sm font-semibold text-white truncate">
                                {partner.name}
                              </span>
                              <span
                                className={`shrink-0 px-2 py-0.5 rounded-md border text-xs font-bold ${scoreChipClass(
                                  partner.fraudScore
                                )}`}
                              >
                                {partner.fraudScore.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/40 text-[10px] font-medium text-slate-300">
                                <Crown className="w-3 h-3 text-amber-400" />
                                {pick(TIER_LABELS[partner.tier])}
                              </span>
                              <Badge
                                variant={STATUS_VARIANT[partner.status]}
                                className="px-2 py-0 text-[10px]"
                              >
                                {pick(STATUS_LABELS[partner.status])}
                              </Badge>
                              <span className="text-[11px] font-mono text-slate-500 truncate">
                                {partner.id}
                              </span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: scoreColor(partner.fraudScore) }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, partner.fraudScore)}%` }}
                                transition={{
                                  duration: 0.8,
                                  delay: 0.35 + index * 0.02,
                                  ease: "easeOut",
                                }}
                              />
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Partner detail */}
            <div className="lg:col-span-2 space-y-5">
              {!selectedPartner ? (
                <Card className="bg-slate-900/50 border-slate-800/50">
                  <CardContent className="p-10 text-center text-slate-400 text-sm">
                    {pick(LABELS.selectPartner)}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Detail header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                          <div className="min-w-0">
                            <h2 className="text-xl font-bold text-white truncate">
                              {selectedPartner.name}
                              <span className="text-slate-500 font-mono text-xs ml-2">
                                {selectedPartner.id}
                              </span>
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs font-medium text-slate-200">
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                {pick(TIER_LABELS[selectedPartner.tier])}
                              </span>
                              <Badge variant={STATUS_VARIANT[selectedPartner.status]}>
                                {pick(STATUS_LABELS[selectedPartner.status])}
                              </Badge>
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-sm text-slate-400 mb-1">{pick(LABELS.fraudScore)}</p>
                            <span
                              className={`text-5xl font-bold leading-none ${scoreTextClass(
                                selectedPartner.fraudScore
                              )}`}
                            >
                              {selectedPartner.fraudScore.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Metric grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">
                              {t.pages.affiliatesReferred}
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {formatNumber(selectedPartner.referredClients)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">
                              {pick(LABELS.activeClients)}
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {formatNumber(selectedPartner.activeClients)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">
                              {t.pages.affiliatesRetention}
                            </p>
                            <p className="text-lg font-semibold text-cyan-400">{retention}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">
                              {pick(LABELS.commissionPaid)}
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {formatCurrency(selectedPartner.commissionPaid)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">
                              {pick(LABELS.lifetimeValue)}
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {formatCurrency(selectedPartner.clientLifetimeValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">
                              {pick(LABELS.subAffiliates)}
                            </p>
                            <p className="inline-flex items-center gap-1.5 text-lg font-semibold text-white">
                              <Network className="w-4 h-4 text-violet-400" />
                              {formatNumber(selectedPartner.subAffiliates)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">
                              {pick(LABELS.countryConcentration)}
                            </p>
                            <p
                              className={`text-lg font-semibold ${
                                selectedPartner.countryConcentration > 60
                                  ? "text-amber-400"
                                  : "text-white"
                              }`}
                            >
                              {selectedPartner.countryConcentration.toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {/* Commission ratio — the number that decides whether the partner is profitable */}
                        <div
                          className={`mt-6 p-5 rounded-xl border ${
                            ratioIsLossy
                              ? "bg-red-500/[0.07] border-red-500/25"
                              : "bg-slate-800/30 border-slate-800/60"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-2.5 rounded-xl shrink-0 border ${
                                ratioIsLossy
                                  ? "bg-red-500/15 border-red-500/25"
                                  : "bg-emerald-500/10 border-emerald-500/20"
                              }`}
                            >
                              {ratioIsLossy ? (
                                <TrendingUp className="w-5 h-5 text-red-400" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-emerald-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500 mb-1">
                                {t.pages.affiliatesCommissionRatio}
                              </p>
                              <p
                                className={`text-4xl font-bold leading-none ${
                                  ratioIsLossy ? "text-red-400" : "text-emerald-400"
                                }`}
                              >
                                {selectedPartner.commissionRatio.toFixed(2)}
                              </p>
                              <p
                                className={`text-sm mt-2.5 leading-relaxed ${
                                  ratioIsLossy ? "text-red-300/90" : "text-slate-400"
                                }`}
                              >
                                {ratioIsLossy
                                  ? pick(LABELS.ratioWarning)
                                  : pick(LABELS.ratioHealthy)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Detected schemes */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardHeader>
                        <CardTitle className="text-lg text-white font-semibold">
                          {t.pages.affiliatesSchemes}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedPartner.schemes.length === 0 ? (
                          <p className="py-6 text-center text-sm text-slate-400">
                            {pick(LABELS.noSchemes)}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedPartner.schemes.map(scheme => {
                              const meta = SCHEME_META[scheme]
                              return (
                                <div
                                  key={scheme}
                                  className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/60"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                      {locale === "ru" ? meta.ru : meta.en}
                                    </span>
                                    <Badge
                                      variant={SEVERITY_VARIANT[meta.severity]}
                                      className="shrink-0"
                                    >
                                      {pick(SEVERITY_LABELS[meta.severity])}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed">
                                    {locale === "ru" ? meta.descRu : meta.descEn}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* AI narrative */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <Card className="bg-violet-500/[0.07] border-violet-500/25">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25 shrink-0">
                            <Handshake className="w-5 h-5 text-violet-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white mb-2">
                              {pick(LABELS.aiNarrative)}
                            </h3>
                            <div className="space-y-3">
                              {pick(selectedPartner.narrative)
                                .split("\n\n")
                                .map((paragraph, index) => (
                                  <p
                                    key={index}
                                    className="text-[15px] leading-relaxed text-slate-300"
                                  >
                                    {paragraph}
                                  </p>
                                ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Escalation forecast */}
                  {selectedPartner.escalationForecast && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Card className="bg-amber-500/[0.07] border-amber-500/25">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 shrink-0">
                              <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-white mb-2">
                                {t.pages.affiliatesForecast}
                              </h3>
                              <p className="text-[15px] leading-relaxed text-slate-300">
                                {locale === "ru"
                                  ? selectedPartner.escalationForecast.ru
                                  : selectedPartner.escalationForecast.en}
                              </p>
                              <div className="flex flex-wrap items-center gap-5 mt-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-amber-400" />
                                  <span className="text-sm text-slate-300">
                                    <span className="font-semibold text-amber-400">
                                      {selectedPartner.escalationForecast.weeksAhead}
                                    </span>{" "}
                                    {pick(LABELS.weeksAhead)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-amber-400" />
                                  <span className="text-sm text-slate-300">
                                    {t.common.confidence}:{" "}
                                    <span className="font-semibold text-amber-400">
                                      {(selectedPartner.escalationForecast.confidence * 100).toFixed(
                                        0
                                      )}
                                      %
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
