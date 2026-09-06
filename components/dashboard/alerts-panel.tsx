"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, AlertCircle, Info, XCircle, Bell, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FraudAlert } from "@/lib/fraud-detection"
import { useT } from "@/lib/locale-context"

interface AlertsPanelProps {
  alerts: FraudAlert[]
  onResolve: (alertId: string) => void
}

export function AlertsPanel({ alerts, onResolve }: AlertsPanelProps) {
  const t = useT()

  const getSeverityIcon = (severity: FraudAlert['severity']) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-400" />
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-400" />
      case 'medium': return <AlertCircle className="w-5 h-5 text-amber-400" />
      default: return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getSeverityBadge = (severity: FraudAlert['severity']) => {
    const variants: Record<FraudAlert['severity'], 'critical' | 'destructive' | 'warning' | 'default'> = {
      critical: 'critical',
      high: 'destructive',
      medium: 'warning',
      low: 'default',
    }
    return <Badge variant={variants[severity]}>{t.risk[severity]}</Badge>
  }

  const getSeverityBg = (severity: FraudAlert['severity']) => {
    const colors = {
      critical: 'bg-red-500/5 border-red-500/20 hover:border-red-500/40',
      high: 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40',
      medium: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
      low: 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
    }
    return colors[severity]
  }

  const unresolvedAlerts = alerts.filter(a => !a.resolved)
  const criticalCount = unresolvedAlerts.filter(a => a.severity === 'critical').length

  return (
    <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm h-full">
      <CardHeader className="border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">{t.alerts.title}</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                {unresolvedAlerts.length} · {t.dashboard.activeAlerts}
              </p>
            </div>
          </div>
          {criticalCount > 0 && (
            <Badge variant="critical" className="animate-pulse">
              {criticalCount} · {t.risk.critical}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {unresolvedAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-slate-400">{t.alerts.noAlerts}</p>
            </motion.div>
          ) : (
            unresolvedAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`p-4 rounded-xl border transition-colors ${getSeverityBg(alert.severity)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-xs text-slate-500">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-white mb-1">{alert.message}</p>
                      <p className="text-xs text-slate-500">
                        {t.alerts.title}: {t.alertType[alert.alertType]}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {alert.transactionId}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResolve(alert.id)}
                    className="text-slate-400 hover:text-emerald-400 shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
