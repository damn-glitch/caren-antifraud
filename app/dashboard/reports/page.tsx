"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Download,
  Calendar,
  Clock,
  TrendingUp,
  Shield,
  AlertTriangle,
  Filter,
  Plus,
  Eye,
  BarChart3,
} from "lucide-react"
import { motion } from "framer-motion"

type ReportType = "All" | "Daily" | "Weekly" | "Monthly" | "Custom"

interface Report {
  id: string
  name: string
  type: "Daily" | "Weekly" | "Monthly" | "Custom"
  generatedAgo: string
  metric: string
  status: "Ready" | "Processing"
  transactionsAnalyzed?: string
  fraudDetected?: string
}

const reports: Report[] = [
  {
    id: "rpt-001",
    name: "Daily Fraud Summary - Jan 30, 2026",
    type: "Daily",
    generatedAgo: "2h ago",
    metric: "156 transactions analyzed, 3 fraud detected",
    status: "Ready",
    transactionsAnalyzed: "156",
    fraudDetected: "3",
  },
  {
    id: "rpt-002",
    name: "Weekly Risk Assessment - Week 4",
    type: "Weekly",
    generatedAgo: "1d ago",
    metric: "8,432 transactions analyzed, 21 fraud detected",
    status: "Ready",
    transactionsAnalyzed: "8,432",
    fraudDetected: "21",
  },
  {
    id: "rpt-003",
    name: "Monthly Compliance Report - January 2026",
    type: "Monthly",
    generatedAgo: "3d ago",
    metric: "34,281 transactions analyzed, 67 fraud detected",
    status: "Ready",
    transactionsAnalyzed: "34,281",
    fraudDetected: "67",
  },
  {
    id: "rpt-004",
    name: "Model Performance Report - Q4 2025",
    type: "Monthly",
    generatedAgo: "1w ago",
    metric: "Benchmark results",
    status: "Ready",
  },
  {
    id: "rpt-005",
    name: "Transaction Pattern Analysis",
    type: "Weekly",
    generatedAgo: "2d ago",
    metric: "Anomaly patterns",
    status: "Ready",
  },
  {
    id: "rpt-006",
    name: "High-Risk Merchant Report",
    type: "Weekly",
    generatedAgo: "4d ago",
    metric: "12 flagged merchants",
    status: "Ready",
  },
  {
    id: "rpt-007",
    name: "False Positive Analysis - Jan 2026",
    type: "Monthly",
    generatedAgo: "5d ago",
    metric: "0.02% false positive rate",
    status: "Processing",
  },
  {
    id: "rpt-008",
    name: "Annual Security Audit - 2025",
    type: "Monthly",
    generatedAgo: "2w ago",
    metric: "Full audit",
    status: "Ready",
  },
]

const FILTER_TYPES: ReportType[] = ["All", "Daily", "Weekly", "Monthly", "Custom"]

const TYPE_BADGE_CLASSES: Record<string, string> = {
  Daily: "bg-blue-900/30 text-blue-300 border-transparent",
  Weekly: "bg-violet-900/30 text-violet-300 border-transparent",
  Monthly: "bg-emerald-900/30 text-emerald-300 border-transparent",
  Custom: "bg-amber-900/30 text-amber-300 border-transparent",
}

const quickStats = [
  {
    label: "Total Reports",
    value: "24",
    icon: FileText,
    color: "text-violet-400",
  },
  {
    label: "Generated This Month",
    value: "8",
    icon: Calendar,
    color: "text-blue-400",
  },
  {
    label: "Avg Processing Time",
    value: "12s",
    icon: Clock,
    color: "text-amber-400",
  },
  {
    label: "Compliance Score",
    value: "99.8%",
    icon: Shield,
    color: "text-emerald-400",
  },
]

export default function ReportsPage() {
  const [activeFilter, setActiveFilter] = useState<ReportType>("All")

  const filteredReports =
    activeFilter === "All"
      ? reports
      : reports.filter((r) => r.type === activeFilter)

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
              <BarChart3 className="w-6 h-6 text-violet-400" />
              Reports
            </h1>
            <p className="text-slate-400 text-sm">
              Generate and view fraud detection reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {quickStats.map((stat) => (
            <Card
              key={stat.label}
              className="bg-slate-900/50 border-slate-800/50"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          {FILTER_TYPES.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={
                activeFilter === filter
                  ? ""
                  : "text-slate-400 hover:text-white"
              }
            >
              {filter}
            </Button>
          ))}
        </motion.div>

        {/* Reports List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Card className="bg-slate-900/50 border-slate-800/50 hover:border-violet-500/30 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5 p-2.5 rounded-xl bg-slate-800/80">
                      <FileText className="w-5 h-5 text-violet-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="text-white text-sm font-semibold truncate">
                          {report.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-2.5">
                        <Badge className={TYPE_BADGE_CLASSES[report.type]}>
                          {report.type}
                        </Badge>
                        {report.status === "Ready" ? (
                          <Badge variant="success">{report.status}</Badge>
                        ) : (
                          <Badge
                            variant="warning"
                            className="animate-pulse"
                          >
                            {report.status}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Generated {report.generatedAgo}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {report.metric}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty state for Custom filter */}
        {filteredReports.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">
              No reports found
            </p>
            <p className="text-slate-500 text-sm mt-1">
              No reports match the selected filter. Try a different category or
              generate a new report.
            </p>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  )
}
