"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Mail, Shield, Activity, Crown, Eye, Settings } from "lucide-react"

interface TeamMember {
  name: string
  role: "Admin" | "Analyst" | "Reviewer" | "Viewer"
  title: string
  avatar: string
  gradient: string
  status: "online" | "offline"
  email: string
}

interface ActivityItem {
  id: number
  message: string
  timestamp: string
}

const teamMembers: TeamMember[] = [
  {
    name: "Alisher Beisembekov",
    role: "Admin",
    title: "Lead Researcher",
    avatar: "AB",
    gradient: "from-violet-500 to-indigo-500",
    status: "online",
    email: "alisher@caren.ai",
  },
  {
    name: "Sarah Chen",
    role: "Analyst",
    title: "Senior Fraud Analyst",
    avatar: "SC",
    gradient: "from-emerald-500 to-teal-500",
    status: "online",
    email: "sarah@caren.ai",
  },
  {
    name: "Marcus Johnson",
    role: "Analyst",
    title: "ML Engineer",
    avatar: "MJ",
    gradient: "from-blue-500 to-cyan-500",
    status: "online",
    email: "marcus@caren.ai",
  },
  {
    name: "Emily Rodriguez",
    role: "Reviewer",
    title: "Risk Manager",
    avatar: "ER",
    gradient: "from-pink-500 to-rose-500",
    status: "online",
    email: "emily@caren.ai",
  },
  {
    name: "David Kim",
    role: "Analyst",
    title: "Data Scientist",
    avatar: "DK",
    gradient: "from-amber-500 to-orange-500",
    status: "offline",
    email: "david@caren.ai",
  },
  {
    name: "Lisa Park",
    role: "Reviewer",
    title: "Compliance Officer",
    avatar: "LP",
    gradient: "from-cyan-500 to-blue-500",
    status: "online",
    email: "lisa@caren.ai",
  },
  {
    name: "James Wilson",
    role: "Viewer",
    title: "QA Engineer",
    avatar: "JW",
    gradient: "from-rose-500 to-pink-500",
    status: "offline",
    email: "james@caren.ai",
  },
  {
    name: "Anna Petrov",
    role: "Analyst",
    title: "Security Engineer",
    avatar: "AP",
    gradient: "from-indigo-500 to-violet-500",
    status: "offline",
    email: "anna@caren.ai",
  },
]

const recentActivity: ActivityItem[] = [
  {
    id: 1,
    message: "Alisher resolved 3 critical alerts in the payment gateway",
    timestamp: "5 minutes ago",
  },
  {
    id: 2,
    message: "Sarah reviewed transaction TXN-2024-8847 and flagged as suspicious",
    timestamp: "12 minutes ago",
  },
  {
    id: 3,
    message: "Marcus deployed updated ML model v2.4.1 for anomaly detection",
    timestamp: "34 minutes ago",
  },
  {
    id: 4,
    message: "Emily approved 12 pending risk assessments for Q4 review",
    timestamp: "1 hour ago",
  },
  {
    id: 5,
    message: "Lisa updated compliance rules for cross-border transactions",
    timestamp: "2 hours ago",
  },
]

const roleBadgeStyles: Record<TeamMember["role"], string> = {
  Admin: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Analyst: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Reviewer: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Viewer: "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

const roleIcons: Record<TeamMember["role"], React.ReactNode> = {
  Admin: <Crown className="w-3 h-3 mr-1" />,
  Analyst: <Activity className="w-3 h-3 mr-1" />,
  Reviewer: <Shield className="w-3 h-3 mr-1" />,
  Viewer: <Eye className="w-3 h-3 mr-1" />,
}

export default function TeamPage() {
  const [members] = useState<TeamMember[]>(teamMembers)

  const totalMembers = members.length
  const activeNow = members.filter((m) => m.status === "online").length

  return (
    <DashboardShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Team</h1>
          <p className="text-slate-400 text-sm">
            Manage your fraud detection team
          </p>
        </div>
        <Button size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {totalMembers}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  Active Now
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-white">{activeNow}</p>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  Avg Response Time
                </p>
                <p className="text-2xl font-bold text-white mt-1">2.3 min</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Members Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
      >
        {members.map((member, index) => (
          <motion.div
            key={member.avatar}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + index * 0.05 }}
          >
            <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {member.avatar}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                        member.status === "online"
                          ? "bg-emerald-500"
                          : "bg-slate-500"
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-white font-semibold text-sm truncate">
                        {member.name}
                      </h3>
                      <Badge
                        className={`text-[10px] px-2 py-0.5 border ${
                          roleBadgeStyles[member.role]
                        }`}
                      >
                        {roleIcons[member.role]}
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-xs">{member.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          member.status === "online"
                            ? "bg-emerald-500"
                            : "bg-slate-600"
                        }`}
                      />
                      {member.status === "online" ? "Online" : "Offline"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-white"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Recent Team Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 pb-4 border-b border-slate-800/50 last:border-0 last:pb-0"
                >
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-sm">{item.message}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {item.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardShell>
  )
}
