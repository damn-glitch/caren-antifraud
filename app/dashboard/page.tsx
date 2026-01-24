"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Sidebar } from "@/components/dashboard/sidebar"
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { TransactionTable } from "@/components/dashboard/transaction-table"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { FraudTrendChart, RiskDistributionChart, AmountSavedChart, TransactionVolumeChart } from "@/components/dashboard/charts"
import { FraudAnalyzer } from "@/components/dashboard/fraud-analyzer"
import { Transaction, FraudAlert, generateTransaction, generateAlert, generateHistoricalData } from "@/lib/fraud-detection"
import { RefreshCw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function DashboardContent() {
  const { collapsed } = useSidebar()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [historicalData, setHistoricalData] = useState<ReturnType<typeof generateHistoricalData>>([])
  const [stats, setStats] = useState({
    totalTransactions: 0,
    fraudBlocked: 0,
    amountProtected: 0,
    activeAlerts: 0,
    approvalRate: 98.2,
    avgResponseTime: 34,
  })

  // Generate initial data
  useEffect(() => {
    const initialTransactions: Transaction[] = []
    const initialAlerts: FraudAlert[] = []

    for (let i = 0; i < 20; i++) {
      const tx = generateTransaction()
      initialTransactions.push(tx)
      const alert = generateAlert(tx)
      if (alert) initialAlerts.push(alert)
    }

    setTransactions(initialTransactions)
    setAlerts(initialAlerts)
    setHistoricalData(generateHistoricalData(30))

    setStats({
      totalTransactions: 156842,
      fraudBlocked: 312,
      amountProtected: 2145678.90,
      activeAlerts: initialAlerts.filter(a => !a.resolved).length,
      approvalRate: 98.2,
      avgResponseTime: 34,
    })
  }, [])

  // Simulate real-time transactions
  useEffect(() => {
    const interval = setInterval(() => {
      const newTx = generateTransaction()
      setTransactions(prev => [newTx, ...prev.slice(0, 49)])

      const newAlert = generateAlert(newTx)
      if (newAlert) {
        setAlerts(prev => [newAlert, ...prev.slice(0, 19)])
        setStats(prev => ({
          ...prev,
          activeAlerts: prev.activeAlerts + 1,
        }))
      }

      setStats(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        fraudBlocked: newTx.status === 'flagged' || newTx.status === 'declined'
          ? prev.fraudBlocked + 1
          : prev.fraudBlocked,
        amountProtected: newTx.status === 'flagged' || newTx.status === 'declined'
          ? prev.amountProtected + newTx.amount
          : prev.amountProtected,
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleResolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, resolved: true } : a
    ))
    setStats(prev => ({
      ...prev,
      activeAlerts: Math.max(0, prev.activeAlerts - 1),
    }))
  }, [])

  const handleViewTransaction = useCallback((transaction: Transaction) => {
    console.log("View transaction:", transaction)
  }, [])

  const addFraudulentTransaction = useCallback(() => {
    const fraudTx = generateTransaction(true)
    setTransactions(prev => [fraudTx, ...prev.slice(0, 49)])

    const alert = generateAlert(fraudTx)
    if (alert) {
      setAlerts(prev => [alert, ...prev.slice(0, 19)])
      setStats(prev => ({
        ...prev,
        activeAlerts: prev.activeAlerts + 1,
        fraudBlocked: prev.fraudBlocked + 1,
        amountProtected: prev.amountProtected + fraudTx.amount,
      }))
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <motion.main
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="min-h-screen p-6"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-slate-400 text-sm">Welcome back, Alisher. Here&apos;s your fraud detection overview.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 px-3 py-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              System Online
            </Badge>
            <Button onClick={addFraudulentTransaction} variant="warning" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Simulate Fraud
            </Button>
            <Button variant="outline" size="sm" className="border-slate-700">
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <StatsCards stats={stats} />
        </motion.div>

        {/* Main Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Fraud Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8"
          >
            <FraudTrendChart historicalData={historicalData} />
          </motion.div>

          {/* Risk Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4"
          >
            <RiskDistributionChart />
          </motion.div>

          {/* Transaction Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-8"
          >
            <TransactionTable
              transactions={transactions}
              onViewDetails={handleViewTransaction}
            />
          </motion.div>

          {/* Alerts Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-4"
          >
            <AlertsPanel
              alerts={alerts}
              onResolve={handleResolveAlert}
            />
          </motion.div>

          {/* Volume Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-4"
          >
            <TransactionVolumeChart historicalData={historicalData} />
          </motion.div>

          {/* AI Fraud Analyzer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-4"
          >
            <FraudAnalyzer />
          </motion.div>

          {/* Amount Saved Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-4"
          >
            <AmountSavedChart historicalData={historicalData} />
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  )
}
