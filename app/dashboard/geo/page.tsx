"use client"

// CAREN - Geographic Intelligence
// Impossible travel on a world projection + jurisdiction exposure.
// Author: Alisher Beisembekov

import { useState, useEffect, useMemo } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  Globe,
  MapPin,
  Plane,
  AlertTriangle,
  Shield,
  Wifi,
  ArrowRight,
  Loader2,
} from "lucide-react"
import {
  generateTravelEvents,
  generateJurisdictionExposure,
  summarizeGeo,
  projectToUnit,
  CITIES,
  RISK_TIER_LABELS,
  type TravelEvent,
  type JurisdictionExposure,
  type GeoPoint,
} from "@/lib/geo-intelligence"
import { useLocale } from "@/lib/locale-context"
import { formatCurrency } from "@/lib/utils"

// ---- Map geometry ------------------------------------------------------

const MAP_W = 1000
const MAP_H = 500

/** Graticule spacing, in viewBox units (10 columns x 10 rows). */
const GRID_X = 100
const GRID_Y = 50

const MIN_CITY_R = 3
const MAX_CITY_R = 9

/** Commercial aviation ceiling — above this the implied speed reads red. */
const MAX_COMMERCIAL_SPEED_KMH = 950

const TIER_ORDER: GeoPoint["riskTier"][] = ["low", "medium", "high", "prohibited"]

const VERDICT_COLORS: Record<TravelEvent["verdict"], string> = {
  impossible: "#ef4444",
  implausible: "#f59e0b",
  plausible: "#10b981",
}

const VERDICT_BADGE: Record<
  TravelEvent["verdict"],
  "destructive" | "warning" | "success"
> = {
  impossible: "destructive",
  implausible: "warning",
  plausible: "success",
}

const VERDICT_LABELS: Record<
  TravelEvent["verdict"],
  { en: string; ru: string }
> = {
  impossible: { en: "Impossible", ru: "Невозможно" },
  implausible: { en: "Implausible", ru: "Неправдоподобно" },
  plausible: { en: "Plausible", ru: "Правдоподобно" },
}

/** Strings this page needs that the shared dictionary does not carry. */
const UI = {
  events: { en: "Travel events", ru: "События перемещений" },
  selectEvent: {
    en: "Select an event to plot its route",
    ru: "Выберите событие, чтобы построить маршрут",
  },
  proxy: { en: "Proxy", ru: "Прокси" },
  km: { en: "km", ru: "км" },
  kmh: { en: "km/h", ru: "км/ч" },
  min: { en: "min", ru: "мин" },
} as const

interface HoveredCity {
  point: GeoPoint
  exposure: JurisdictionExposure | undefined
  x: number
  y: number
}

export default function GeoPage() {
  const { t, locale } = useLocale()

  const [events, setEvents] = useState<TravelEvent[]>([])
  const [exposure, setExposure] = useState<JurisdictionExposure[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [hoveredCity, setHoveredCity] = useState<HoveredCity | null>(null)

  // The generators call Math.random()/Date.now(), so they run once on the
  // client after mount rather than during render (which would break hydration).
  useEffect(() => {
    const generatedEvents = generateTravelEvents(16)
    setEvents(generatedEvents)
    setExposure(generateJurisdictionExposure())
    setSelectedEventId(generatedEvents[0]?.id ?? null)
  }, [])

  // ---- Localization helpers --------------------------------------------

  const bi = (pair: { en: string; ru: string }): string =>
    locale === "ru" ? pair.ru : pair.en

  const nf = useMemo(
    () => new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US"),
    [locale]
  )

  const num = (value: number): string => nf.format(value)

  const tierLabel = (tier: GeoPoint["riskTier"]): string =>
    locale === "ru" ? RISK_TIER_LABELS[tier].ru : RISK_TIER_LABELS[tier].en

  const formatDateTime = (date: Date): string =>
    date.toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  // ---- Derived data -----------------------------------------------------

  const summary = useMemo(
    () => summarizeGeo(events, exposure),
    [events, exposure]
  )

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? events[0] ?? null,
    [events, selectedEventId]
  )

  const exposureByCity = useMemo(() => {
    const map = new Map<string, JurisdictionExposure>()
    for (const item of exposure) map.set(item.point.city, item)
    return map
  }, [exposure])

  // City markers: equirectangular projection scaled into the viewBox, with the
  // radius carrying transaction volume for that jurisdiction.
  const cityMarkers = useMemo(() => {
    const counts = exposure.map((e) => e.transactionCount)
    const min = counts.length ? Math.min(...counts) : 0
    const max = counts.length ? Math.max(...counts) : 1
    const span = max - min || 1

    return CITIES.map((point) => {
      const unit = projectToUnit(point)
      const item = exposureByCity.get(point.city)
      const ratio = item ? (item.transactionCount - min) / span : 0

      return {
        point,
        exposure: item,
        x: unit.x * MAP_W,
        y: unit.y * MAP_H,
        r: Math.min(
          MAX_CITY_R,
          Math.max(MIN_CITY_R, MIN_CITY_R + ratio * (MAX_CITY_R - MIN_CITY_R))
        ),
      }
    })
  }, [exposure, exposureByCity])

  // Quadratic arc for the selected route, with the control point lifted above
  // the midpoint so long hops bow away from the straight line.
  const arc = useMemo(() => {
    if (!selectedEvent) return null

    const from = projectToUnit(selectedEvent.from)
    const to = projectToUnit(selectedEvent.to)
    const x1 = from.x * MAP_W
    const y1 = from.y * MAP_H
    const x2 = to.x * MAP_W
    const y2 = to.y * MAP_H

    const span = Math.hypot(x2 - x1, y2 - y1)
    const lift = Math.min(180, 40 + span * 0.28)
    const cx = (x1 + x2) / 2
    const cy = (y1 + y2) / 2 - lift

    return {
      x1,
      y1,
      x2,
      y2,
      d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
      color: VERDICT_COLORS[selectedEvent.verdict],
    }
  }, [selectedEvent])

  const gridX = useMemo(
    () => Array.from({ length: MAP_W / GRID_X + 1 }, (_, i) => i * GRID_X),
    []
  )
  const gridY = useMemo(
    () => Array.from({ length: MAP_H / GRID_Y + 1 }, (_, i) => i * GRID_Y),
    []
  )

  // ---- Loading state ----------------------------------------------------

  if (!selectedEvent) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Globe className="w-6 h-6 text-violet-400" />
              {t.pages.geoTitle}
            </h1>
            <p className="text-slate-400 text-sm">{t.pages.geoSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[0, 1, 2, 3, 4].map((i) => (
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

  // ---- Loaded -----------------------------------------------------------

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
              <Globe className="w-6 h-6 text-violet-400" />
              {t.pages.geoTitle}
            </h1>
            <p className="text-slate-400 text-sm">{t.pages.geoSubtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 px-3 py-1.5"
            >
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              {t.common.systemOnline}
            </Badge>
            <Badge
              variant="outline"
              className="border-red-500/30 text-red-400 px-3 py-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              {t.pages.geoCredentialCompromise}: {num(summary.credentialCompromise)}
            </Badge>
          </div>
        </motion.div>

        {/* Stats row */}
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
                <Plane className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {num(summary.totalEvents)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.pages.geoImpossible}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-2xl font-bold text-red-400">
                  {num(summary.impossible)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.pages.geoProxyExplained}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-slate-400" />
                <span className="text-2xl font-bold text-slate-300">
                  {num(summary.proxyExplained)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {t.pages.geoCredentialCompromise}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                <span className="text-2xl font-bold text-red-400">
                  {num(summary.credentialCompromise)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {tierLabel("prohibited")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-400" />
                <span className="text-2xl font-bold text-white">
                  {num(summary.prohibitedJurisdictions)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Map + event list */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* World map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="xl:col-span-2"
          >
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-violet-400" />
                    {t.behavioral.geoSpread}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-300">
                      {selectedEvent.from.city}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium text-slate-300">
                      {selectedEvent.to.city}
                    </span>
                    <Badge
                      variant={VERDICT_BADGE[selectedEvent.verdict]}
                      className="text-[10px] ml-1"
                    >
                      {bi(VERDICT_LABELS[selectedEvent.verdict])}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-xl bg-slate-950/60 border border-slate-800/60 overflow-hidden">
                  <svg
                    viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                    className="w-full h-auto block"
                    role="img"
                    aria-label={t.pages.geoTitle}
                  >
                    {/* Equirectangular graticule */}
                    <g stroke="#1e293b" strokeWidth={1} opacity={0.55}>
                      {gridX.map((x) => (
                        <line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={MAP_H} />
                      ))}
                      {gridY.map((y) => (
                        <line key={`gy-${y}`} x1={0} y1={y} x2={MAP_W} y2={y} />
                      ))}
                    </g>
                    {/* Equator and prime meridian read a touch stronger */}
                    <g stroke="#334155" strokeWidth={1} opacity={0.5}>
                      <line x1={0} y1={MAP_H / 2} x2={MAP_W} y2={MAP_H / 2} />
                      <line x1={MAP_W / 2} y1={0} x2={MAP_W / 2} y2={MAP_H} />
                    </g>

                    {/* Selected route */}
                    {arc && (
                      <g>
                        <motion.path
                          key={`arc-${selectedEvent.id}`}
                          d={arc.d}
                          fill="none"
                          stroke={arc.color}
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.9 }}
                          transition={{ duration: 1.4, ease: "easeInOut" }}
                        />

                        {/* Dot flying the route */}
                        <circle
                          key={`mover-${selectedEvent.id}`}
                          r={4}
                          fill={arc.color}
                          opacity={0.95}
                        >
                          <animateMotion
                            path={arc.d}
                            dur="3s"
                            repeatCount="indefinite"
                            begin="0s"
                          />
                        </circle>

                        {/* Endpoint halos */}
                        {[
                          { x: arc.x1, y: arc.y1, key: "from" },
                          { x: arc.x2, y: arc.y2, key: "to" },
                        ].map((end, i) => (
                          <motion.circle
                            key={`${selectedEvent.id}-${end.key}`}
                            cx={end.x}
                            cy={end.y}
                            r={7}
                            fill={arc.color}
                            fillOpacity={0.25}
                            stroke={arc.color}
                            strokeOpacity={0.6}
                            strokeWidth={1}
                            animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                            transition={{
                              duration: 2.4,
                              repeat: Infinity,
                              ease: "easeOut",
                              delay: i * 0.4,
                            }}
                            style={{
                              transformOrigin: "center",
                              transformBox: "fill-box",
                            }}
                          />
                        ))}
                      </g>
                    )}

                    {/* Jurisdiction markers */}
                    <g>
                      {cityMarkers.map((marker) => {
                        const isEndpoint =
                          marker.point.city === selectedEvent.from.city ||
                          marker.point.city === selectedEvent.to.city
                        const isHovered =
                          hoveredCity?.point.city === marker.point.city

                        return (
                          <motion.circle
                            key={`city-${marker.point.city}`}
                            cx={marker.x}
                            cy={marker.y}
                            r={marker.r}
                            fill={RISK_TIER_LABELS[marker.point.riskTier].color}
                            fillOpacity={isEndpoint || isHovered ? 1 : 0.75}
                            stroke={
                              isHovered || isEndpoint ? "#ffffff" : "#0f172a"
                            }
                            strokeWidth={isHovered || isEndpoint ? 1.6 : 1}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                              delay: 0.2,
                            }}
                            style={{
                              cursor: "pointer",
                              transformOrigin: "center",
                              transformBox: "fill-box",
                            }}
                            onMouseEnter={() =>
                              setHoveredCity({
                                point: marker.point,
                                exposure: marker.exposure,
                                x: marker.x,
                                y: marker.y,
                              })
                            }
                            onMouseLeave={() => setHoveredCity(null)}
                          />
                        )
                      })}
                    </g>
                  </svg>

                  {/* City tooltip */}
                  {hoveredCity && (
                    <div
                      className="pointer-events-none absolute z-20 w-56 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur"
                      style={{
                        left: `${(hoveredCity.x / MAP_W) * 100}%`,
                        top: `calc(${(hoveredCity.y / MAP_H) * 100}% - 12px)`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              RISK_TIER_LABELS[hoveredCity.point.riskTier].color,
                          }}
                        />
                        <span className="text-white text-sm font-semibold truncate">
                          {hoveredCity.point.city}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">
                        {hoveredCity.point.country} ·{" "}
                        {tierLabel(hoveredCity.point.riskTier)}
                      </p>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">
                            {t.nav.transactions}
                          </span>
                          <span className="font-mono text-slate-200">
                            {num(hoveredCity.exposure?.transactionCount ?? 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">
                            {t.dashboard.transactionVolume}
                          </span>
                          <span className="font-mono text-amber-300">
                            {formatCurrency(hoveredCity.exposure?.volume ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Risk-tier legend */}
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                    {t.aml.riskLevel}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {TIER_ORDER.map((tier) => (
                      <div key={tier} className="flex items-center gap-1.5">
                        <span
                          className="inline-block rounded-full shrink-0"
                          style={{
                            backgroundColor: RISK_TIER_LABELS[tier].color,
                            width: 10,
                            height: 10,
                          }}
                        />
                        <span className="text-xs text-slate-400">
                          {tierLabel(tier)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Travel events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Plane className="w-4 h-4 text-violet-400" />
                  {bi(UI.events)}
                </CardTitle>
                <p className="text-xs text-slate-500">{bi(UI.selectEvent)}</p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[640px] overflow-y-auto">
                {events.map((event) => {
                  const isSelected = event.id === selectedEvent.id
                  const speedIsRed =
                    event.impliedSpeedKmh > MAX_COMMERCIAL_SPEED_KMH

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEventId(event.id)}
                      className={`w-full text-left rounded-xl border p-3 transition-all duration-300 ${
                        isSelected
                          ? "bg-slate-950/70 border-violet-500/60 ring-2 ring-violet-500/30"
                          : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-white truncate">
                          {event.accountName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {event.proxyDetected && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-2 py-0.5"
                            >
                              <Wifi className="w-3 h-3 mr-1" />
                              {bi(UI.proxy)}
                            </Badge>
                          )}
                          <Badge
                            variant={VERDICT_BADGE[event.verdict]}
                            className="text-[10px] px-2 py-0.5"
                          >
                            {bi(VERDICT_LABELS[event.verdict])}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-2">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{event.from.city}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{event.to.city}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="text-slate-500">{t.pages.geoDistance}</p>
                          <p className="font-mono text-slate-200">
                            {num(Math.round(event.distanceKm))} {bi(UI.km)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">{t.pages.geoElapsed}</p>
                          <p className="font-mono text-slate-200">
                            {num(Math.round(event.elapsedMinutes))} {bi(UI.min)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">
                            {t.pages.geoImpliedSpeed}
                          </p>
                          <p
                            className={`font-mono font-semibold ${
                              speedIsRed ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {num(Math.round(event.impliedSpeedKmh))}{" "}
                            {bi(UI.kmh)}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                              {t.common.summary}
                            </p>
                            {(locale === "ru"
                              ? event.narrative.ru
                              : event.narrative.en
                            )
                              .split("\n\n")
                              .map((paragraph, i) => (
                                <p
                                  key={i}
                                  className="text-xs text-slate-400 leading-relaxed"
                                >
                                  {paragraph}
                                </p>
                              ))}
                            <p className="text-[11px] text-slate-500 font-mono pt-1">
                              {event.accountId} · {formatDateTime(event.arrivedAt)}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Jurisdiction exposure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-400" />
                {t.pages.geoJurisdictions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-left">
                      <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        {t.transactions.location}
                      </th>
                      <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        {t.aml.riskLevel}
                      </th>
                      <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-slate-500 text-right">
                        {t.nav.transactions}
                      </th>
                      <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-slate-500 text-right">
                        {t.dashboard.transactionVolume}
                      </th>
                      <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-slate-500 text-right">
                        {t.status.flagged}
                      </th>
                      <th className="py-2 text-xs font-medium uppercase tracking-wider text-slate-500 w-40">
                        {t.transactions.riskScore}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exposure.map((item) => {
                      const color = RISK_TIER_LABELS[item.point.riskTier].color

                      return (
                        <tr
                          key={item.point.city}
                          className="border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <div className="min-w-0">
                                <p className="text-white font-medium truncate">
                                  {item.point.city}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {item.point.country} ({item.point.countryCode})
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{
                                color,
                                borderColor: `${color}55`,
                                backgroundColor: `${color}1a`,
                              }}
                            >
                              {tierLabel(item.point.riskTier)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right font-mono text-slate-200">
                            {num(item.transactionCount)}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono text-amber-300">
                            {formatCurrency(item.volume)}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono text-red-300">
                            {num(item.flaggedCount)}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: color }}
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${Math.min(100, item.riskScore)}%`,
                                  }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-slate-400 w-9 text-right">
                                {item.riskScore.toFixed(0)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
