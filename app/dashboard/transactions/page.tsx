"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  Transaction,
  generateTransaction,
  generateAlert,
  FraudAlert,
  MERCHANT_CATEGORIES,
} from "@/lib/fraud-detection"
import { formatCurrency, getRiskLevel } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  Download,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"

const PAGE_SIZE = 15

const statusVariantMap: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  approved: "success",
  declined: "destructive",
  flagged: "warning",
  pending: "secondary",
}

const riskVariantMap: Record<string, "success" | "warning" | "destructive" | "critical"> = {
  low: "success",
  medium: "warning",
  high: "destructive",
  critical: "critical",
}

const statusIconMap: Record<string, typeof CheckCircle> = {
  approved: CheckCircle,
  declined: XCircle,
  flagged: AlertCircle,
  pending: Clock,
}

function getRiskScoreColor(score: number): string {
  if (score < 25) return "text-emerald-400"
  if (score < 50) return "text-amber-400"
  if (score < 75) return "text-orange-400"
  return "text-red-400"
}

function getRiskGaugeColor(score: number): string {
  if (score < 25) return "#34d399"
  if (score < 50) return "#fbbf24"
  if (score < 75) return "#fb923c"
  return "#ef4444"
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

function TransactionDetailPanel({
  transaction,
  onClose,
}: {
  transaction: Transaction
  onClose: () => void
}) {
  const riskLevel = getRiskLevel(transaction.riskScore)
  const gaugeColor = getRiskGaugeColor(transaction.riskScore)
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (transaction.riskScore / 100) * circumference

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800/50 shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Transaction Details</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="w-5 h-5 text-slate-400" />
          </Button>
        </div>

        {/* Transaction ID */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transaction ID</p>
          <p className="text-sm text-white font-mono break-all">{transaction.id}</p>
        </div>

        {/* Risk Score Gauge */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-800"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke={gaugeColor}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${getRiskScoreColor(transaction.riskScore)}`}>
                {transaction.riskScore.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">Risk Score</span>
            </div>
          </div>
          <Badge variant={riskVariantMap[riskLevel]} className="mt-2">
            {riskLevel.toUpperCase()} RISK
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Card Number</p>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-400" />
                <p className="text-sm text-white">**** {transaction.cardLast4}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Amount</p>
              <p className="text-sm text-white font-semibold">
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Merchant</p>
            <p className="text-sm text-white">{transaction.merchantName}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Category</p>
            <p className="text-sm text-white">{transaction.merchantCategory}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-400" />
              <p className="text-sm text-white">{transaction.location}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Timestamp</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <p className="text-sm text-white">
                {transaction.timestamp.toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <Badge variant={statusVariantMap[transaction.status]}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fraud Flag</p>
              <Badge variant={transaction.isFraud ? "destructive" : "success"}>
                {transaction.isFraud ? "Fraudulent" : "Legitimate"}
              </Badge>
            </div>
          </div>
        </div>

        {/* PCA Feature Values */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-white mb-3">PCA Feature Values</h4>
          <div className="space-y-2">
            {transaction.features.slice(0, 5).map((value, index) => {
              const absVal = Math.abs(value)
              const maxVal = 10
              const barWidth = Math.min((absVal / maxVal) * 100, 100)
              const isNegative = value < 0

              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-8 font-mono">V{index + 1}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-full rounded-full ${
                        isNegative ? "bg-red-500/70" : "bg-violet-500/70"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right font-mono">
                    {value.toFixed(4)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" size="sm" className="flex-1 border-slate-700">
            Approve
          </Button>
          <Button variant="destructive" size="sm" className="flex-1">
            Decline
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [sortField, setSortField] = useState<"timestamp" | "amount" | "riskScore">("timestamp")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Generate initial transactions on mount
  useEffect(() => {
    const initial: Transaction[] = []
    for (let i = 0; i < 100; i++) {
      initial.push(generateTransaction())
    }
    setTransactions(initial)
  }, [])

  // Real-time: add a new transaction every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newTx = generateTransaction()
      setTransactions((prev) => [newTx, ...prev])
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !tx.merchantName.toLowerCase().includes(query) &&
        !tx.cardLast4.includes(query)
      ) {
        return false
      }
    }

    // Category filter
    if (categoryFilter !== "all" && tx.merchantCategory !== categoryFilter) {
      return false
    }

    // Status filter
    if (statusFilter !== "all" && tx.status !== statusFilter) {
      return false
    }

    // Risk level filter
    if (riskFilter !== "all" && getRiskLevel(tx.riskScore) !== riskFilter) {
      return false
    }

    return true
  })

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "timestamp":
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        break
      case "amount":
        comparison = a.amount - b.amount
        break
      case "riskScore":
        comparison = a.riskScore - b.riskScore
        break
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, statusFilter, riskFilter])

  const handleSort = useCallback(
    (field: "timestamp" | "amount" | "riskScore") => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortField(field)
        setSortDirection("desc")
      }
    },
    [sortField]
  )

  const handleExportCSV = useCallback(() => {
    const headers = [
      "ID",
      "Timestamp",
      "Card",
      "Merchant",
      "Category",
      "Location",
      "Amount",
      "Risk Score",
      "Status",
      "Fraud",
    ]
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.timestamp.toISOString(),
      `****${tx.cardLast4}`,
      tx.merchantName,
      tx.merchantCategory,
      tx.location,
      tx.amount.toFixed(2),
      tx.riskScore.toFixed(2),
      tx.status,
      tx.isFraud ? "Yes" : "No",
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `caren-transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredTransactions])

  return (
    <DashboardShell>
      <div className="relative min-h-screen">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Transactions</h1>
            <p className="text-slate-400 text-sm">
              Monitor and manage all card transactions in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700"
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" className="border-slate-700">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search card number or merchant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {MERCHANT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Status Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                  <option value="flagged">Flagged</option>
                  <option value="pending">Pending</option>
                </select>

                {/* Risk Level Dropdown */}
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-slate-800/50 bg-slate-900/50 overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">
                All Transactions
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({filteredTransactions.length} total)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <button
                          className="flex items-center gap-1 hover:text-white transition-colors"
                          onClick={() => handleSort("timestamp")}
                        >
                          Transaction
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Merchant
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <button
                          className="flex items-center gap-1 hover:text-white transition-colors"
                          onClick={() => handleSort("amount")}
                        >
                          Amount
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <button
                          className="flex items-center gap-1 hover:text-white transition-colors"
                          onClick={() => handleSort("riskScore")}
                        >
                          Risk Score
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {paginatedTransactions.map((tx) => {
                        const riskLevel = getRiskLevel(tx.riskScore)
                        const StatusIcon = statusIconMap[tx.status] || Clock

                        return (
                          <motion.tr
                            key={tx.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors group"
                          >
                            {/* Transaction Column */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                  <CreditCard className="w-4 h-4 text-violet-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    **** {tx.cardLast4}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatTimestamp(tx.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Merchant Column */}
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm text-white">{tx.merchantName}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  <p className="text-xs text-slate-500">{tx.location}</p>
                                </div>
                              </div>
                            </td>

                            {/* Category Column */}
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-300">
                                {tx.merchantCategory}
                              </span>
                            </td>

                            {/* Amount Column */}
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-white">
                                {formatCurrency(tx.amount)}
                              </span>
                            </td>

                            {/* Risk Score Column */}
                            <td className="px-6 py-4">
                              <Badge variant={riskVariantMap[riskLevel]}>
                                <span className={getRiskScoreColor(tx.riskScore)}>
                                  {tx.riskScore.toFixed(1)}%
                                </span>
                              </Badge>
                            </td>

                            {/* Status Column */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <StatusIcon className="w-3.5 h-3.5" />
                                <Badge variant={statusVariantMap[tx.status]}>
                                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                </Badge>
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setSelectedTransaction(tx)}
                              >
                                <Eye className="w-4 h-4 text-slate-400 hover:text-violet-400" />
                              </Button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>

                    {paginatedTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <p className="text-slate-500 text-sm">
                            No transactions found matching your filters.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/50">
                <p className="text-sm text-slate-400">
                  Showing{" "}
                  <span className="text-white font-medium">
                    {filteredTransactions.length === 0 ? 0 : startIndex + 1}
                  </span>
                  -
                  <span className="text-white font-medium">
                    {Math.min(endIndex, filteredTransactions.length)}
                  </span>{" "}
                  of{" "}
                  <span className="text-white font-medium">
                    {filteredTransactions.length}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (safeCurrentPage <= 3) {
                        pageNum = i + 1
                      } else if (safeCurrentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = safeCurrentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            safeCurrentPage === pageNum
                              ? "bg-violet-600 text-white"
                              : "text-slate-400 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Detail Slide-Over Panel */}
        <AnimatePresence>
          {selectedTransaction && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setSelectedTransaction(null)}
              />
              <div className="fixed top-0 right-0 h-full w-full max-w-md z-50">
                <TransactionDetailPanel
                  transaction={selectedTransaction}
                  onClose={() => setSelectedTransaction(null)}
                />
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  )
}
