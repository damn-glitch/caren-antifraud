"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Bell,
  Shield,
  Eye,
  Globe,
  Palette,
  Database,
  Key,
  Mail,
  Save,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { motion } from "framer-motion"

interface NotificationSetting {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  defaultEnabled: boolean
}

const notificationSettings: NotificationSetting[] = [
  {
    id: "email",
    label: "Email Alerts",
    description: "Receive fraud alerts via email",
    icon: <Mail className="w-4 h-4" />,
    defaultEnabled: true,
  },
  {
    id: "sms",
    label: "SMS Alerts",
    description: "Get text messages for critical alerts",
    icon: <Bell className="w-4 h-4" />,
    defaultEnabled: false,
  },
  {
    id: "push",
    label: "Push Notifications",
    description: "Browser push notifications for real-time alerts",
    icon: <Globe className="w-4 h-4" />,
    defaultEnabled: true,
  },
  {
    id: "slack",
    label: "Slack Integration",
    description: "Post alerts to your Slack channel",
    icon: <Palette className="w-4 h-4" />,
    defaultEnabled: true,
  },
  {
    id: "critical_only",
    label: "Critical Only Mode",
    description: "Only notify for critical severity alerts",
    icon: <Shield className="w-4 h-4" />,
    defaultEnabled: false,
  },
]

function ThresholdBar({ value, max }: { value: number; max: number }) {
  const percentage = (value / max) * 100
  return (
    <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden mt-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
      />
    </div>
  )
}

export default function SettingsPage() {
  const [riskThreshold, setRiskThreshold] = useState(75)
  const [autoBlockThreshold, setAutoBlockThreshold] = useState(90)
  const [velocityLimit, setVelocityLimit] = useState(5)

  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    notificationSettings.forEach((s) => {
      initial[s.id] = s.defaultEnabled
    })
    return initial
  })

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }))
  }

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
              <Settings className="w-6 h-6 text-violet-400" />
              Settings
            </h1>
            <p className="text-slate-400 text-sm">
              Configure your CAREN anti-fraud system
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 px-3 py-1.5 self-start lg:self-auto"
          >
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            CAREN Active
          </Badge>
        </motion.div>

        {/* Detection Thresholds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-400" />
                Detection Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Score Threshold */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Risk Score Threshold
                    </p>
                    <p className="text-xs text-slate-400">
                      Transactions above this score will be flagged
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-violet-400 tabular-nums">
                    {riskThreshold}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={riskThreshold}
                  onChange={(e) => setRiskThreshold(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
                <ThresholdBar value={riskThreshold} max={100} />
              </div>

              {/* Auto-Block Threshold */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Auto-Block Threshold
                    </p>
                    <p className="text-xs text-slate-400">
                      Transactions above this score will be auto-declined
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-red-400 tabular-nums">
                    {autoBlockThreshold}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={autoBlockThreshold}
                  onChange={(e) =>
                    setAutoBlockThreshold(Number(e.target.value))
                  }
                  className="w-full accent-red-500 cursor-pointer"
                />
                <ThresholdBar value={autoBlockThreshold} max={100} />
              </div>

              {/* Velocity Limit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Velocity Limit
                    </p>
                    <p className="text-xs text-slate-400">
                      Max transactions per minute before alert
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-amber-400 tabular-nums">
                    {velocityLimit}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={velocityLimit}
                  onChange={(e) => setVelocityLimit(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <ThresholdBar value={velocityLimit} max={20} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-violet-400" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationSettings.map((setting) => {
                const isOn = toggles[setting.id]
                return (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400">{setting.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {setting.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(setting.id)}
                      className={`rounded-full p-1 transition-colors duration-200 ${
                        isOn ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-400"
                      }`}
                      aria-label={`Toggle ${setting.label}`}
                    >
                      {isOn ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-violet-400" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  API Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-sm text-white">
                    sk-caren-****-****-****-abc123
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:text-white"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Webhook URL */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Webhook URL
                </label>
                <input
                  type="url"
                  defaultValue="https://yourapp.com/webhook"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Rate Limit */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Rate Limit
                </label>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono">
                    1000 req/min
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400"
                  >
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-violet-400" />
                System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Model Version</p>
                  <p className="text-sm font-medium text-white">
                    CAREN v2.4.1 (Random Forest + XGBoost Ensemble)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">
                    Last Model Training
                  </p>
                  <p className="text-sm font-medium text-white">
                    January 28, 2026
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">
                    Database Status
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="success"
                      className="bg-emerald-900/30 text-emerald-400 border-emerald-500/30"
                    >
                      Healthy
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">System Uptime</p>
                  <p className="text-sm font-medium text-emerald-400">
                    99.99%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <Button
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 px-8"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
