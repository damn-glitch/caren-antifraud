"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { FraudAlert, generateTransaction, generateAlert } from "@/lib/fraud-detection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Info,
  CheckCircle2,
  Filter,
  Clock,
  Shield,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low"

const SEVERITY_ICON: Record<FraudAlert["severity"], React.ReactNode> = {
  critical: <XCircle className="w-5 h-5 text-red-500" />,
  high: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  medium: <AlertCircle className="w-5 h-5 text-amber-400" />,
  low: <Info className="w-5 h-5 text-blue-400" />,
}

const SEVERITY_BADGE_VARIANT: Record<
  FraudAlert["severity"],
  "critical" | "destructive" | "warning" | "default"
> = {
  critical: "critical",
  high: "destructive",
  medium: "warning",
  low: "default",
}

const SEVERITY_BORDER: Record<FraudAlert["severity"], string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-amber-400",
  low: "border-l-blue-400",
}

const ALERT_TYPE_LABEL: Record<FraudAlert["alertType"], string> = {
  velocity: "VELOCITY",
  amount: "AMOUNT",
  location: "LOCATION",
  pattern: "PATTERN",
  ml_prediction: "ML_PREDICTION",
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return date.toLocaleDateString()
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all")
  const [showResolved, setShowResolved] = useState(false)

  // Generate initial alerts on mount
  useEffect(() => {
    const initialAlerts: FraudAlert[] = []

    // Generate 40 normal transactions and collect alerts
    for (let i = 0; i < 40; i++) {
      const tx = generateTransaction()
      const alert = generateAlert(tx)
      if (alert) initialAlerts.push(alert)
    }

    // Generate 10 forced-fraud transactions to ensure critical alerts
    for (let i = 0; i < 10; i++) {
      const tx = generateTransaction(true)
      const alert = generateAlert(tx)
      if (alert) initialAlerts.push(alert)
    }

    // Sort by timestamp descending
    initialAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setAlerts(initialAlerts)
  }, [])

  // Real-time: generate a new transaction every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const tx = generateTransaction()
      const alert = generateAlert(tx)
      if (alert) {
        setAlerts((prev) => [alert, ...prev])
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Resolve an alert
  const handleResolve = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    )
  }, [])

  // Derived counts
  const totalAlerts = alerts.length
  const criticalCount = alerts.filter((a) => a.severity === "critical").length
  const unresolvedCount = alerts.filter((a) => !a.resolved).length
  const resolvedTodayCount = alerts.filter((a) => {
    if (!a.resolved) return false
    const today = new Date()
    return (
      a.timestamp.getDate() === today.getDate() &&
      a.timestamp.getMonth() === today.getMonth() &&
      a.timestamp.getFullYear() === today.getFullYear()
    )
  }).length

  // Severity counts for filter tabs
  const severityCounts: Record<SeverityFilter, number> = {
    all: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
  }

  // Filtered alerts
  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false
    if (!showResolved && a.resolved) return false
    return true
  })

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
              <Bell className="w-6 h-6 text-violet-400" />
              Fraud Alerts
            </h1>
            <p className="text-slate-400 text-sm">
              Review and manage fraud detection alerts
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 px-3 py-1.5"
            >
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              CAREN Active
            </Badge>
            <Button variant="outline" size="sm" className="border-slate-700">
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>
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
                Total Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {totalAlerts}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-400">
                  {criticalCount}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Unresolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">
                  {unresolvedCount}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Resolved Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">
                  {resolvedTodayCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {(
              ["all", "critical", "high", "medium", "low"] as SeverityFilter[]
            ).map((filter) => (
              <Button
                key={filter}
                variant={severityFilter === filter ? "default" : "ghost"}
                size="sm"
                onClick={() => setSeverityFilter(filter)}
                className={
                  severityFilter === filter
                    ? ""
                    : "text-slate-400 hover:text-white"
                }
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                <span className="ml-1.5 text-xs opacity-70">
                  ({severityCounts[filter]})
                </span>
              </Button>
            ))}
          </div>
          <Button
            variant={showResolved ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
            className={showResolved ? "" : "text-slate-400 hover:text-white"}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            {showResolved ? "Showing Resolved" : "Show Resolved"}
          </Button>
        </motion.div>

        {/* Alert List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg font-medium">
                  No alerts match your filters
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Try adjusting the severity filter or enabling resolved alerts
                </p>
              </motion.div>
            )}

            {filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: alert.resolved ? 0.5 : 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={`bg-slate-900/50 border-slate-800/50 border-l-4 ${
                    SEVERITY_BORDER[alert.severity]
                  } ${alert.resolved ? "opacity-50" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: icon + content */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {SEVERITY_ICON[alert.severity]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant={SEVERITY_BADGE_VARIANT[alert.severity]}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-slate-700 text-slate-300 text-[10px]"
                            >
                              {ALERT_TYPE_LABEL[alert.alertType]}
                            </Badge>
                          </div>
                          <p className="text-white text-sm font-medium truncate">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(alert.timestamp)}
                            </span>
                            <span className="font-mono text-slate-500">
                              {alert.transactionId}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 shrink-0 sm:ml-4">
                        {!alert.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                        {alert.resolved && (
                          <Badge variant="success" className="text-xs">
                            Resolved
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                        >
                          Investigate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </DashboardShell>
  )
}
