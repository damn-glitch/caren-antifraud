"use client"

// CAREN - Immutable Audit Trail page
// Renders the hash-chained decision log: every entry links to the previous one,
// and the banner re-derives the whole chain so tampering is visible at a glance.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  ScrollText,
  ShieldCheck,
  ShieldAlert,
  Search,
  User,
  Bot,
  Server,
  Cpu,
  ArrowRight,
  Link2,
  Loader2,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import {
  generateAuditTrail,
  verifyChain,
  summarizeAudit,
  ACTION_META,
  ACTOR_LABELS,
  type AuditEntry,
  type ActorType,
} from "@/lib/audit-trail"

type Bilingual = { en: string; ru: string }

type ChainState = { valid: boolean; brokenAt?: number }

const ACTOR_TYPES: ActorType[] = ["analyst", "system", "model", "api_client"]

const ACTOR_ICON: Record<ActorType, typeof User> = {
  analyst: User,
  system: Server,
  model: Bot,
  api_client: Cpu,
}

/** Chip styling per actor type — kept local, the engine ships labels only. */
const ACTOR_CHIP: Record<ActorType, string> = {
  analyst: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  system: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  model: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  api_client: "bg-amber-500/10 text-amber-300 border-amber-500/20",
}

type Severity = "info" | "notice" | "critical"

const SEVERITY_DOT: Record<Severity, string> = {
  info: "bg-slate-500 ring-slate-500/20",
  notice: "bg-cyan-400 ring-cyan-400/20",
  critical: "bg-red-500 ring-red-500/20",
}

const SEVERITY_TEXT: Record<Severity, string> = {
  info: "text-slate-300",
  notice: "text-cyan-300",
  critical: "text-red-300",
}

/** Strings this page needs that the shared dictionary does not carry. */
const LABELS = {
  chainSubtitleValid: {
    en: "entries re-derived, every link matches",
    ru: "записей пересчитано, все связи совпадают",
  },
  chainSubtitleBroken: {
    en: "Recomputed digest diverges at entry",
    ru: "Пересчитанный хеш расходится на записи",
  },
  verifying: { en: "Verifying...", ru: "Проверка..." },
  totalEntries: { en: "Entries", ru: "Записи" },
  criticalActions: { en: "Critical actions", ru: "Критические действия" },
  byAnalyst: { en: "By analyst", ru: "Аналитиками" },
  byModel: { en: "By model", ru: "Моделями" },
  bySystem: { en: "By system", ru: "Системой" },
  uniqueActors: { en: "Unique actors", ru: "Уникальных субъектов" },
  searchPlaceholder: {
    en: "Search actor, subject or action...",
    ru: "Поиск по субъекту, объекту или действию...",
  },
  chainLog: { en: "Chain log", ru: "Журнал цепочки" },
  previousHash: { en: "Previous hash", ru: "Предыдущий хеш" },
  ipAddress: { en: "IP address", ru: "IP-адрес" },
  linksTo: { en: "links to entry", ru: "ссылается на запись" },
  genesis: { en: "genesis block", ru: "генезис-блок" },
  matched: { en: "match confirmed", ru: "совпадение подтверждено" },
  expandHint: { en: "Click a row to expand the chain link", ru: "Нажмите на строку, чтобы раскрыть связь цепочки" },
  sequence: { en: "Seq", ru: "№" },
} as const satisfies Record<string, Bilingual>

const GENESIS_HASH = "0000000000000000"

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export default function AuditPage() {
  const { t, locale } = useLocale()

  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [chain, setChain] = useState<ChainState | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [actorFilter, setActorFilter] = useState<ActorType | "all">("all")
  const [query, setQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The engine uses Math.random/Date.now, so generation must stay client-only.
  useEffect(() => {
    const generated = generateAuditTrail(40)
    setEntries(generated)
    setChain(verifyChain(generated))
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  /** Pick the active language out of any bilingual object. */
  const bi = useCallback(
    (value: Bilingual): string => (locale === "ru" ? value.ru : value.en),
    [locale]
  )

  const loading = entries.length === 0 || chain === null

  const summary = useMemo(() => summarizeAudit(entries), [entries])

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [locale]
  )

  /** Newest first, which is also the order the engine hands them back. */
  const ordered = useMemo(
    () => [...entries].sort((a, b) => b.sequence - a.sequence),
    [entries]
  )

  /** Lets a row prove its previousHash equals the hash of the entry before it. */
  const bySequence = useMemo(() => {
    const map = new Map<number, AuditEntry>()
    for (const entry of entries) map.set(entry.sequence, entry)
    return map
  }, [entries])

  const actorCounts = useMemo(() => {
    const counts: Record<ActorType, number> = {
      analyst: 0,
      system: 0,
      model: 0,
      api_client: 0,
    }
    for (const entry of entries) counts[entry.actorType] += 1
    return counts
  }, [entries])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return ordered.filter(entry => {
      if (actorFilter !== "all" && entry.actorType !== actorFilter) return false
      if (needle.length === 0) return true
      const actionLabel = bi(ACTION_META[entry.action])
      return (
        entry.actor.toLowerCase().includes(needle) ||
        entry.subject.toLowerCase().includes(needle) ||
        entry.action.toLowerCase().includes(needle) ||
        actionLabel.toLowerCase().includes(needle)
      )
    })
  }, [ordered, actorFilter, query, bi])

  const handleVerify = useCallback(() => {
    if (verifying) return
    setVerifying(true)
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setChain(verifyChain(entries))
      setVerifying(false)
      timerRef.current = null
    }, 800)
  }, [entries, verifying])

  const stats = [
    {
      key: "total",
      title: bi(LABELS.totalEntries),
      value: String(summary.total),
      icon: ScrollText,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
    {
      key: "critical",
      title: bi(LABELS.criticalActions),
      value: String(summary.critical),
      icon: ShieldAlert,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      key: "analyst",
      title: bi(LABELS.byAnalyst),
      value: String(summary.byAnalyst),
      icon: User,
      color: "text-violet-300",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
    {
      key: "model",
      title: bi(LABELS.byModel),
      value: String(summary.byModel),
      icon: Bot,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      key: "system",
      title: bi(LABELS.bySystem),
      value: String(summary.bySystem),
      icon: Server,
      color: "text-slate-300",
      bgColor: "bg-slate-500/10",
      borderColor: "border-slate-500/20",
    },
    {
      key: "actors",
      title: bi(LABELS.uniqueActors),
      value: String(summary.uniqueActors),
      icon: Cpu,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
  ]

  const tabs: { key: ActorType | "all"; label: string; count: number }[] = [
    { key: "all", label: t.common.all, count: entries.length },
    ...ACTOR_TYPES.map(type => ({
      key: type as ActorType | "all",
      label: bi(ACTOR_LABELS[type]),
      count: actorCounts[type],
    })),
  ]

  const chainValid = chain?.valid ?? true

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
            <ScrollText className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{t.pages.auditTitle}</h1>
            <p className="text-slate-400 text-sm">{t.pages.auditSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link2 className="w-4 h-4 text-emerald-400" />
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
          {/* Chain integrity banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card
              className={`bg-slate-900/50 border-slate-800/50 overflow-hidden ${
                chainValid ? "border-emerald-500/30" : "border-red-500/40"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-2xl border ${
                        chainValid
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-red-500/10 border-red-500/20"
                      }`}
                    >
                      {chainValid ? (
                        <ShieldCheck className="w-7 h-7 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-7 h-7 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-lg font-bold ${
                          chainValid ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {chainValid ? t.pages.auditChainValid : t.pages.auditChainBroken}
                      </p>
                      {chainValid ? (
                        <p className="text-sm text-slate-400 mt-1">
                          <span className="text-white font-semibold">{summary.total}</span>{" "}
                          {bi(LABELS.chainSubtitleValid)}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 mt-1">
                          {bi(LABELS.chainSubtitleBroken)}{" "}
                          <span className="text-red-300 font-semibold font-mono">
                            #{chain?.brokenAt}
                          </span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-mono">
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{GENESIS_HASH}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-slate-400">
                          {truncateHash(ordered[0].hash)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={chainValid ? "outline" : "destructive"}
                    className={chainValid ? "border-emerald-500/30" : ""}
                    onClick={handleVerify}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {bi(LABELS.verifying)}
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        {t.pages.auditVerify}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {tabs.map(tab => {
                      const isActive = actorFilter === tab.key
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActorFilter(tab.key)}
                          className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors border ${
                            isActive
                              ? "bg-violet-500/15 border-violet-500/40 text-violet-200"
                              : "bg-slate-800/40 border-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800/70"
                          }`}
                        >
                          {tab.label}
                          <span
                            className={`ml-2 text-xs font-mono ${
                              isActive ? "text-violet-300" : "text-slate-500"
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="relative lg:ml-auto lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder={bi(LABELS.searchPlaceholder)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chain log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-lg text-white font-semibold">
                  {bi(LABELS.chainLog)}
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({filtered.length})
                  </span>
                </CardTitle>
                <span className="text-xs text-slate-500">{bi(LABELS.expandHint)}</span>
              </CardHeader>
              <CardContent>
                {filtered.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-slate-500 text-sm">{t.common.noResults}</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Vertical chain rail */}
                    <div className="absolute left-[13px] top-3 bottom-3 w-px bg-slate-800" />

                    <div className="space-y-1">
                      {filtered.map((entry, index) => {
                        const meta = ACTION_META[entry.action]
                        const severity: Severity = meta.severity
                        const ActorIcon = ACTOR_ICON[entry.actorType]
                        const isExpanded = expandedId === entry.id
                        const previous = bySequence.get(entry.sequence - 1)
                        const linkOk = previous
                          ? previous.hash === entry.previousHash
                          : entry.previousHash === GENESIS_HASH

                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.015, 0.3) }}
                            className="relative pl-9 group"
                          >
                            {/* Severity dot on the rail */}
                            <span
                              className={`absolute left-[7px] top-5 w-3.5 h-3.5 rounded-full ring-4 ${SEVERITY_DOT[severity]}`}
                            />

                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
                                isExpanded
                                  ? "bg-slate-800/50 border-violet-500/30"
                                  : "bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/40"
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="text-xs font-mono text-slate-500">
                                  {bi(LABELS.sequence)} {String(entry.sequence).padStart(3, "0")}
                                </span>
                                <span className={`text-sm font-semibold ${SEVERITY_TEXT[severity]}`}>
                                  {bi(meta)}
                                </span>
                                <span className="text-sm text-slate-400">{entry.actor}</span>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${ACTOR_CHIP[entry.actorType]}`}
                                >
                                  <ActorIcon className="w-3 h-3" />
                                  {bi(ACTOR_LABELS[entry.actorType])}
                                </span>
                                <span className="text-xs font-mono text-white bg-slate-800/70 border border-slate-700/60 rounded-md px-2 py-0.5">
                                  {entry.subject}
                                </span>
                                <span className="ml-auto text-xs text-slate-500">
                                  {dateFormatter.format(entry.at)}
                                </span>
                                <span className="text-xs font-mono text-slate-500">
                                  {entry.ipAddress}
                                </span>
                              </div>

                              <p className="text-sm text-slate-400 mt-2">{bi(entry.detail)}</p>

                              {/* before -> after */}
                              {entry.before !== undefined && entry.after !== undefined && (
                                <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                                  <span className="text-slate-500 uppercase tracking-wider">
                                    {t.pages.auditBefore}
                                  </span>
                                  <span className="font-mono text-slate-400 line-through">
                                    {entry.before}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                                  <span className="text-slate-500 uppercase tracking-wider">
                                    {t.pages.auditAfter}
                                  </span>
                                  <span className="font-mono text-emerald-400">{entry.after}</span>
                                </div>
                              )}

                              {/* Hash line: truncated by default, full on hover or expand */}
                              <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                                <span className="text-slate-500 uppercase tracking-wider">
                                  {t.pages.auditHash}
                                </span>
                                <span
                                  className={`font-mono text-violet-300 ${
                                    isExpanded ? "hidden" : "group-hover:hidden"
                                  }`}
                                >
                                  {truncateHash(entry.hash)}
                                </span>
                                <span
                                  className={`font-mono text-violet-300 break-all ${
                                    isExpanded ? "inline" : "hidden group-hover:inline"
                                  }`}
                                >
                                  {entry.hash}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1.5 font-mono ${
                                    isExpanded ? "" : "hidden group-hover:inline-flex"
                                  } ${linkOk ? "text-emerald-400/80" : "text-red-400"}`}
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                  {bi(LABELS.previousHash)}: {entry.previousHash}
                                </span>
                              </div>

                              {/* Expanded chain-link proof */}
                              {isExpanded && (
                                <div className="mt-3 rounded-lg border border-slate-800/70 bg-slate-950/40 p-3.5 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-slate-500 uppercase tracking-wider">
                                      {bi(LABELS.previousHash)}
                                    </span>
                                    <span
                                      className={`font-mono break-all ${
                                        linkOk ? "text-emerald-400" : "text-red-400"
                                      }`}
                                    >
                                      {entry.previousHash}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                                    <span className="text-slate-400">
                                      {previous ? (
                                        <>
                                          {bi(LABELS.linksTo)}{" "}
                                          <span className="font-mono text-white">
                                            #{previous.sequence}
                                          </span>{" "}
                                          <span className="font-mono text-slate-400">
                                            {previous.hash}
                                          </span>
                                        </>
                                      ) : (
                                        bi(LABELS.genesis)
                                      )}
                                    </span>
                                    {linkOk && (
                                      <span className="inline-flex items-center gap-1 text-emerald-400">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        {bi(LABELS.matched)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-slate-500 uppercase tracking-wider">
                                      {t.pages.auditHash}
                                    </span>
                                    <span className="font-mono text-violet-300 break-all">
                                      {entry.hash}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                    <span>
                                      {t.pages.auditActor}:{" "}
                                      <span className="text-slate-300">{entry.actor}</span>
                                    </span>
                                    <span>
                                      {bi(LABELS.ipAddress)}:{" "}
                                      <span className="font-mono text-slate-300">
                                        {entry.ipAddress}
                                      </span>
                                    </span>
                                    <span className="font-mono text-slate-400">{entry.id}</span>
                                  </div>
                                </div>
                              )}
                            </button>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </DashboardShell>
  )
}
