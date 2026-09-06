"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, MapPin, Clock, AlertCircle, CheckCircle, XCircle, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Transaction } from "@/lib/fraud-detection"
import { formatCurrency, getRiskLevel } from "@/lib/utils"
import { useT } from "@/lib/locale-context"

interface TransactionTableProps {
  transactions: Transaction[]
  onViewDetails: (transaction: Transaction) => void
}

export function TransactionTable({ transactions, onViewDetails }: TransactionTableProps) {
  const t = useT()

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'declined': return <XCircle className="w-4 h-4 text-red-400" />
      case 'flagged': return <AlertCircle className="w-4 h-4 text-amber-400" />
      default: return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'approved': return <Badge variant="success">{t.status.approved}</Badge>
      case 'declined': return <Badge variant="destructive">{t.status.declined}</Badge>
      case 'flagged': return <Badge variant="warning">{t.status.flagged}</Badge>
      default: return <Badge variant="secondary">{t.status.pending}</Badge>
    }
  }

  const getRiskBadge = (score: number) => {
    const level = getRiskLevel(score)
    const variants: Record<string, 'success' | 'warning' | 'destructive' | 'critical'> = {
      low: 'success',
      medium: 'warning',
      high: 'destructive',
      critical: 'critical',
    }
    return (
      <Badge variant={variants[level]}>
        {score.toFixed(0)}% · {t.risk[level as keyof typeof t.risk]}
      </Badge>
    )
  }

  return (
    <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{t.dashboard.liveTransactions}</CardTitle>
          <Badge variant="outline" className="border-violet-500/30 text-violet-400">
            <span className="w-2 h-2 bg-violet-500 rounded-full mr-2 animate-pulse" />
            {t.common.active}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[420px]">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="text-left text-xs font-medium text-slate-400 p-4">{t.transactions.transaction}</th>
                <th className="text-left text-xs font-medium text-slate-400 p-4">{t.transactions.merchant}</th>
                <th className="text-left text-xs font-medium text-slate-400 p-4">{t.transactions.amount}</th>
                <th className="text-left text-xs font-medium text-slate-400 p-4">{t.transactions.riskScore}</th>
                <th className="text-left text-xs font-medium text-slate-400 p-4">{t.transactions.status}</th>
                <th className="text-right text-xs font-medium text-slate-400 p-4">{t.transactions.actions}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">****{transaction.cardLast4}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {transaction.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-white">{transaction.merchantName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {transaction.location}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-white">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-xs text-slate-500">{transaction.merchantCategory}</div>
                    </td>
                    <td className="p-4">
                      {getRiskBadge(transaction.riskScore)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        {getStatusBadge(transaction.status)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(transaction)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
