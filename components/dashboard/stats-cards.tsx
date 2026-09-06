"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Shield, AlertTriangle, DollarSign, Activity, Ban, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { useT } from "@/lib/locale-context"

interface StatsCardsProps {
  stats: {
    totalTransactions: number
    fraudBlocked: number
    amountProtected: number
    activeAlerts: number
    approvalRate: number
    avgResponseTime: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useT()

  const cards = [
    {
      title: t.dashboard.totalTransactions,
      value: formatNumber(stats.totalTransactions),
      change: "+12.5%",
      trend: "up" as const,
      icon: Activity,
      gradient: "from-violet-500 to-indigo-500",
      bgGradient: "from-violet-500/10 to-indigo-500/10",
    },
    {
      title: t.dashboard.fraudBlocked,
      value: formatNumber(stats.fraudBlocked),
      change: "-8.3%",
      trend: "down" as const,
      icon: Ban,
      gradient: "from-rose-500 to-red-500",
      bgGradient: "from-rose-500/10 to-red-500/10",
    },
    {
      title: t.dashboard.amountProtected,
      value: formatCurrency(stats.amountProtected),
      change: "+23.1%",
      trend: "up" as const,
      icon: Shield,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
    },
    {
      title: t.dashboard.activeAlerts,
      value: formatNumber(stats.activeAlerts),
      change: stats.activeAlerts > 10 ? "+5" : "-2",
      trend: stats.activeAlerts > 10 ? "up" : "down",
      icon: AlertTriangle,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
    },
    {
      title: t.dashboard.approvalRate,
      value: `${stats.approvalRate.toFixed(1)}%`,
      change: "+0.3%",
      trend: "up" as const,
      icon: CheckCircle,
      gradient: "from-cyan-500 to-blue-500",
      bgGradient: "from-cyan-500/10 to-blue-500/10",
    },
    {
      title: t.dashboard.avgResponse,
      value: `${stats.avgResponseTime}ms`,
      change: "-5ms",
      trend: "down" as const,
      icon: Activity,
      gradient: "from-fuchsia-500 to-pink-500",
      bgGradient: "from-fuchsia-500/10 to-pink-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <Card className="relative overflow-hidden border-slate-800/50 bg-slate-900/50 backdrop-blur-sm hover:border-violet-500/30 transition-all duration-300" glow>
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50`} />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${card.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {card.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {card.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
              <div className="text-xs text-slate-400">{card.title}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
