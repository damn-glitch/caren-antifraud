"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useT } from "@/lib/locale-context"

interface ChartsProps {
  historicalData: {
    date: string
    totalTransactions: number
    fraudAttempts: number
    blocked: number
    amountProcessed: number
    amountSaved: number
  }[]
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899']

export function FraudTrendChart({ historicalData }: ChartsProps) {
  const t = useT()

  return (
    <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{t.dashboard.fraudTrend}</CardTitle>
          <Badge variant="outline" className="border-violet-500/30 text-violet-400">
            30 {t.common.days}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={historicalData}>
            <defs>
              <linearGradient id="fraudGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                color: '#fff'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="fraudAttempts"
              stroke="#ef4444"
              fill="url(#fraudGradient)"
              strokeWidth={2}
              name={t.analytics.fraudAttempts}
            />
            <Area
              type="monotone"
              dataKey="blocked"
              stroke="#10b981"
              fill="url(#blockedGradient)"
              strokeWidth={2}
              name={t.analytics.blocked}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function TransactionVolumeChart({ historicalData }: ChartsProps) {
  const t = useT()

  return (
    <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/50">
        <CardTitle className="text-white">{t.dashboard.transactionVolume}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={historicalData.slice(-14)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => value.slice(8)}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                color: '#fff'
              }}
            />
            <Bar
              dataKey="totalTransactions"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              name={t.transactions.title}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function RiskDistributionChart() {
  const t = useT()

  const data = [
    { name: t.risk.low, value: 75, color: '#10b981' },
    { name: t.risk.medium, value: 15, color: '#f59e0b' },
    { name: t.risk.high, value: 7, color: '#f97316' },
    { name: t.risk.critical, value: 3, color: '#ef4444' },
  ]

  return (
    <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/50">
        <CardTitle className="text-white">{t.dashboard.riskDistribution}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                color: '#fff'
              }}
            />
            <Legend
              formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function AmountSavedChart({ historicalData }: ChartsProps) {
  const t = useT()

  return (
    <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{t.dashboard.amountProtected}</CardTitle>
          <Badge variant="success">
            +${(historicalData.reduce((sum, d) => sum + d.amountSaved, 0) / 1000).toFixed(0)}K
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={historicalData}>
            <defs>
              <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                color: '#fff'
              }}
              formatter={(value) => value !== undefined ? [`$${Number(value).toLocaleString()}`, t.dashboard.amountProtected] : ['', '']}
            />
            <Line
              type="monotone"
              dataKey="amountSaved"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ fill: '#06b6d4', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#06b6d4' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
