"use client"

// CAREN - Fraud Ring Detection (Graph Intelligence)
// Author: Alisher Beisembekov

import { useState, useEffect, useMemo } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  Network,
  Users,
  DollarSign,
  Share2,
  Activity,
  Fingerprint,
  Calendar,
  Clock,
  Loader2,
  ShieldAlert,
} from "lucide-react"
import {
  generateFraudRings,
  summarizeRings,
  LINK_LABELS,
  ROLE_LABELS,
  ROLE_COLORS,
  type FraudRing,
  type RingNode,
  type NodeRole,
  type LinkType,
} from "@/lib/fraud-rings"
import { useLocale } from "@/lib/locale-context"
import { formatCurrency, formatNumber } from "@/lib/utils"

// ---- Graph geometry ----------------------------------------------------

const VIEW_W = 800
const VIEW_H = 600

const ROLE_RADIUS: Record<NodeRole, number> = {
  orchestrator: 18,
  partner: 13,
  sub_affiliate: 9,
  mule: 8,
  client: 5,
}

const LINK_COLORS: Record<LinkType, string> = {
  money_flow: "#8b5cf6",
  referral: "#64748b",
  shared_device: "#06b6d4",
  shared_ip: "#f59e0b",
  shared_card_bin: "#ec4899",
  shared_address: "#10b981",
}

const STATUS_BADGE: Record<
  FraudRing["status"],
  "secondary" | "destructive" | "success"
> = {
  monitoring: "secondary",
  escalated: "destructive",
  dismantled: "success",
}

const ROLE_ORDER: NodeRole[] = [
  "orchestrator",
  "partner",
  "sub_affiliate",
  "mule",
  "client",
]

const LINK_ORDER: LinkType[] = [
  "money_flow",
  "referral",
  "shared_device",
  "shared_ip",
  "shared_card_bin",
  "shared_address",
]

export default function RingsPage() {
  const { t, locale } = useLocale()

  const [rings, setRings] = useState<FraudRing[]>([])
  const [selectedRingId, setSelectedRingId] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<RingNode | null>(null)

  // Math.random() inside the generator would break hydration if run during
  // render, so the network is built once on the client after mount.
  useEffect(() => {
    const generated = generateFraudRings(5)
    setRings(generated)
    setSelectedRingId(generated[0]?.id ?? null)
  }, [])

  const roleLabel = (role: NodeRole): string =>
    locale === "ru" ? ROLE_LABELS[role].ru : ROLE_LABELS[role].en

  const linkLabel = (type: LinkType): string =>
    locale === "ru" ? LINK_LABELS[type].ru : LINK_LABELS[type].en

  const formatDate = (date: Date): string =>
    date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  const formatDateTime = (date: Date): string =>
    date.toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const statusLabel = (status: FraudRing["status"]): string => {
    if (status === "monitoring") return t.rings.monitoring
    if (status === "escalated") return t.rings.escalated
    return t.rings.dismantled
  }

  const summary = useMemo(() => summarizeRings(rings), [rings])

  const selectedRing = useMemo(
    () => rings.find((r) => r.id === selectedRingId) ?? rings[0] ?? null,
    [rings, selectedRingId]
  )

  // id -> node lookup so edges can resolve their endpoints in O(1)
  const nodeById = useMemo(() => {
    const map = new Map<string, RingNode>()
    if (selectedRing) {
      for (const node of selectedRing.nodes) map.set(node.id, node)
    }
    return map
  }, [selectedRing])

  const orchestrator = useMemo(
    () => selectedRing?.nodes.find((n) => n.role === "orchestrator") ?? null,
    [selectedRing]
  )

  const roleBreakdown: { role: NodeRole; count: number }[] = selectedRing
    ? [
        { role: "orchestrator", count: selectedRing.counts.orchestrators },
        { role: "partner", count: selectedRing.counts.partners },
        { role: "sub_affiliate", count: selectedRing.counts.subAffiliates },
        { role: "mule", count: selectedRing.counts.mules },
        { role: "client", count: selectedRing.counts.clients },
      ]
    : []

  // ---- Loading state ---------------------------------------------------

  if (!selectedRing) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Network className="w-6 h-6 text-violet-400" />
              {t.rings.title}
            </h1>
            <p className="text-slate-400 text-sm">{t.rings.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="p-6">
                  <div className="h-4 w-24 bg-slate-800 rounded animate-pulse mb-3" />
                  <div className="h-7 w-20 bg-slate-800 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                <p className="text-slate-400 text-sm">{t.common.loading}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  // ---- Loaded ----------------------------------------------------------

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Network className="w-6 h-6 text-violet-400" />
              {t.rings.title}
            </h1>
            <p className="text-slate-400 text-sm">{t.rings.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 px-3 py-1.5"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              {t.common.systemOnline}
            </Badge>
            <Badge
              variant="outline"
              className="border-red-500/30 text-red-400 px-3 py-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
              {t.rings.escalated}: {summary.escalated}
            </Badge>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.rings.ringsDetected}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.ringsDetected)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.rings.accountsInvolved}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.accountsInvolved)}
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
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">
                  {formatCurrency(summary.totalExposure)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.rings.avgRingSize}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl font-bold text-white">
                  {formatNumber(summary.avgRingSize)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ring selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <p className="text-xs uppercase tracking-wider text-slate-500">
            {t.rings.selectRing}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {rings.map((ring) => {
              const isSelected = ring.id === selectedRing.id
              const members =
                ring.counts.orchestrators +
                ring.counts.partners +
                ring.counts.subAffiliates +
                ring.counts.mules +
                ring.counts.clients

              return (
                <button
                  key={ring.id}
                  type="button"
                  onClick={() => {
                    setSelectedRingId(ring.id)
                    setHoveredNode(null)
                  }}
                  className={`text-left shrink-0 w-64 rounded-2xl border p-4 transition-all duration-300 ${
                    isSelected
                      ? "bg-slate-900/80 border-violet-500/60 ring-2 ring-violet-500/40"
                      : "bg-slate-900/50 border-slate-800/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-white text-sm font-semibold truncate">
                      {ring.name}
                    </span>
                    <Badge
                      variant={STATUS_BADGE[ring.status]}
                      className="text-[10px] shrink-0"
                    >
                      {statusLabel(ring.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>{t.common.confidence}</span>
                      <span className="text-violet-300 font-mono">
                        {(ring.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t.rings.exposureAmount}</span>
                      <span className="text-amber-300 font-mono">
                        {formatCurrency(ring.exposure)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t.rings.members}</span>
                      <span className="text-slate-200 font-mono">
                        {formatNumber(members)}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Graph + details */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Network graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:col-span-2"
          >
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-base font-semibold text-white">
                    {t.rings.networkGraph}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono">
                      {formatNumber(selectedRing.nodes.length)} {t.rings.nodes}
                    </span>
                    <span className="font-mono">
                      {formatNumber(selectedRing.edges.length)} {t.rings.edges}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-xl bg-slate-950/50 border border-slate-800/60 overflow-hidden">
                  <svg
                    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                    className="w-full h-auto block"
                    role="img"
                    aria-label={t.rings.networkGraph}
                  >
                    {/* Edges first so they render behind the nodes */}
                    <g>
                      {selectedRing.edges.map((edge, i) => {
                        const source = nodeById.get(edge.source)
                        const target = nodeById.get(edge.target)
                        if (!source || !target) return null

                        return (
                          <motion.line
                            key={`${selectedRing.id}-e-${i}`}
                            x1={source.x * VIEW_W}
                            y1={source.y * VIEW_H}
                            x2={target.x * VIEW_W}
                            y2={target.y * VIEW_H}
                            stroke={LINK_COLORS[edge.type]}
                            strokeWidth={0.5 + edge.strength * 1.8}
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                              pathLength: 1,
                              opacity: 0.15 + edge.strength * 0.5,
                            }}
                            transition={{
                              duration: 0.6,
                              delay: Math.min(i * 0.012, 1.2),
                              ease: "easeOut",
                            }}
                          />
                        )
                      })}
                    </g>

                    {/* Pulsing halo behind the orchestrator */}
                    {orchestrator && (
                      <motion.circle
                        cx={orchestrator.x * VIEW_W}
                        cy={orchestrator.y * VIEW_H}
                        r={ROLE_RADIUS.orchestrator}
                        fill={ROLE_COLORS.orchestrator}
                        fillOpacity={0.22}
                        stroke={ROLE_COLORS.orchestrator}
                        strokeOpacity={0.4}
                        strokeWidth={1}
                        animate={{ scale: [1, 2.4, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{
                          duration: 2.6,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{ transformOrigin: "center", transformBox: "fill-box" }}
                      />
                    )}

                    {/* Nodes */}
                    <g>
                      {selectedRing.nodes.map((node, i) => {
                        const isHovered = hoveredNode?.id === node.id
                        return (
                          <motion.circle
                            key={`${selectedRing.id}-n-${node.id}`}
                            cx={node.x * VIEW_W}
                            cy={node.y * VIEW_H}
                            r={ROLE_RADIUS[node.role]}
                            fill={ROLE_COLORS[node.role]}
                            stroke={isHovered ? "#ffffff" : "#0f172a"}
                            strokeWidth={isHovered ? 2 : 1.2}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                              delay: Math.min(i * 0.014, 1.3),
                            }}
                            style={{
                              cursor: "pointer",
                              transformOrigin: "center",
                              transformBox: "fill-box",
                            }}
                            onMouseEnter={() => setHoveredNode(node)}
                            onMouseLeave={() => setHoveredNode(null)}
                          />
                        )
                      })}
                    </g>
                  </svg>

                  {/* Hover tooltip */}
                  {hoveredNode && (
                    <div
                      className="pointer-events-none absolute z-20 w-56 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur"
                      style={{
                        left: `${hoveredNode.x * 100}%`,
                        top: `calc(${hoveredNode.y * 100}% - 14px)`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: ROLE_COLORS[hoveredNode.role] }}
                        />
                        <span className="text-white text-sm font-semibold truncate">
                          {hoveredNode.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">
                        {roleLabel(hoveredNode.role)}
                      </p>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">
                            {t.transactions.riskScore}
                          </span>
                          <span className="font-mono text-red-300">
                            {hoveredNode.riskScore.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">
                            {t.nav.transactions}
                          </span>
                          <span className="font-mono text-slate-200">
                            {formatNumber(hoveredNode.transactionCount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">
                            {t.dashboard.transactionVolume}
                          </span>
                          <span className="font-mono text-amber-300">
                            {formatCurrency(hoveredNode.totalVolume)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legends */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                      {t.rings.members}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {ROLE_ORDER.map((role) => (
                        <div key={role} className="flex items-center gap-1.5">
                          <span
                            className="inline-block rounded-full shrink-0"
                            style={{
                              backgroundColor: ROLE_COLORS[role],
                              width: 10,
                              height: 10,
                            }}
                          />
                          <span className="text-xs text-slate-400">
                            {roleLabel(role)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                      {t.rings.connectionStrength}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {LINK_ORDER.map((type) => (
                        <div key={type} className="flex items-center gap-1.5">
                          <span
                            className="inline-block rounded-full shrink-0"
                            style={{
                              backgroundColor: LINK_COLORS[type],
                              width: 14,
                              height: 3,
                            }}
                          />
                          <span className="text-xs text-slate-400">
                            {linkLabel(type)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ring details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-6"
          >
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-white">
                    {t.rings.ringDetails}
                  </CardTitle>
                  <Badge variant={STATUS_BADGE[selectedRing.status]}>
                    {statusLabel(selectedRing.status)}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">{selectedRing.name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800/60 p-3">
                    <p className="text-slate-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t.rings.firstSeen}
                    </p>
                    <p className="text-slate-200 font-medium">
                      {formatDate(selectedRing.detectedAt)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800/60 p-3">
                    <p className="text-slate-500 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.rings.lastActivity}
                    </p>
                    <p className="text-slate-200 font-medium">
                      {formatDateTime(selectedRing.lastActivity)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800/60 p-3">
                    <p className="text-slate-500 mb-1">{t.common.confidence}</p>
                    <p className="text-violet-300 font-mono font-semibold">
                      {(selectedRing.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800/60 p-3">
                    <p className="text-slate-500 mb-1">
                      {t.rings.exposureAmount}
                    </p>
                    <p className="text-amber-300 font-mono font-semibold">
                      {formatCurrency(selectedRing.exposure)}
                    </p>
                  </div>
                </div>

                {/* Role breakdown */}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                    {t.rings.members}
                  </p>
                  <div className="space-y-1.5">
                    {roleBreakdown.map(({ role, count }) => (
                      <div
                        key={role}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="flex items-center gap-2 text-slate-400">
                          <span
                            className="inline-block rounded-full shrink-0"
                            style={{
                              backgroundColor: ROLE_COLORS[role],
                              width: 10,
                              height: 10,
                            }}
                          />
                          {roleLabel(role)}
                        </span>
                        <span className="font-mono text-slate-200">
                          {formatNumber(count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Central node */}
                {orchestrator && (
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800/60 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">
                      {t.rings.centralNode}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white font-medium truncate">
                        {orchestrator.label}
                      </span>
                      <span className="font-mono text-xs text-red-300">
                        {orchestrator.riskScore.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {orchestrator.id}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shared attributes */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                  {t.rings.sharedAttributes}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedRing.sharedAttributes.map((attr) => (
                  <div
                    key={`${attr.type}-${attr.value}`}
                    className="rounded-xl bg-slate-950/50 border border-slate-800/60 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-block rounded-full shrink-0"
                        style={{
                          backgroundColor: LINK_COLORS[attr.type],
                          width: 8,
                          height: 8,
                        }}
                      />
                      <span className="text-xs text-slate-300 font-medium">
                        {linkLabel(attr.type)}
                      </span>
                    </div>
                    <p className="font-mono text-sm text-white break-all">
                      {attr.value}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {locale === "ru"
                        ? `Общий у ${formatNumber(attr.sharedBy)} счетов`
                        : `Shared by ${formatNumber(attr.sharedBy)} accounts`}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detection methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white">
                {t.rings.detectionMethod}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedRing.detectionMethods.map((method) => (
                  <Badge
                    key={method}
                    variant="outline"
                    className="border-slate-700 text-slate-300"
                    style={{ borderColor: `${LINK_COLORS[method]}66` }}
                  >
                    <span
                      className="inline-block rounded-full mr-1.5 shrink-0"
                      style={{
                        backgroundColor: LINK_COLORS[method],
                        width: 8,
                        height: 8,
                      }}
                    />
                    {linkLabel(method)}
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white ml-auto"
                >
                  {t.common.investigate}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
