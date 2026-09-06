"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  LayoutDashboard,
  Activity,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Brain,
  Users,
  FileText,
  Filter,
  Search,
  Network,
  Landmark,
  Waves,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { useT } from "@/lib/locale-context"
import type { TranslationKeys } from "@/lib/i18n"

type NavKey = keyof TranslationKeys["nav"]

const menuItems: { icon: typeof LayoutDashboard; key: NavKey; href: string }[] = [
  { icon: LayoutDashboard, key: "dashboard", href: "/dashboard" },
  { icon: Activity, key: "transactions", href: "/dashboard/transactions" },
  { icon: Bell, key: "alerts", href: "/dashboard/alerts" },
  { icon: Filter, key: "triage", href: "/dashboard/triage" },
  { icon: Search, key: "investigations", href: "/dashboard/investigations" },
  { icon: Network, key: "rings", href: "/dashboard/rings" },
  { icon: Landmark, key: "aml", href: "/dashboard/aml" },
  { icon: Waves, key: "behavioral", href: "/dashboard/behavioral" },
  { icon: BarChart3, key: "analytics", href: "/dashboard/analytics" },
  { icon: Brain, key: "models", href: "/dashboard/models" },
  { icon: Users, key: "team", href: "/dashboard/team" },
  { icon: FileText, key: "reports", href: "/dashboard/reports" },
]

const bottomItems: { icon: typeof Settings; key: NavKey; href: string }[] = [
  { icon: Settings, key: "settings", href: "/dashboard/settings" },
  { icon: HelpCircle, key: "help", href: "/dashboard/help" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, setCollapsed } = useSidebar()
  const t = useT()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-slate-950 border-r border-slate-800/50 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/50 shrink-0">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0"
          >
            <Shield className="w-5 h-5 text-white" />
          </motion.div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold text-white whitespace-nowrap"
            >
              CAREN
            </motion.span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? t.nav[item.key] : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-violet-500/10 text-violet-400 shadow-lg shadow-violet-500/5"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-violet-400")} />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {t.nav[item.key]}
                </span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom items */}
      <div className="px-3 py-3 border-t border-slate-800/50 space-y-1 shrink-0">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? t.nav[item.key] : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{t.nav[item.key]}</span>}
          </Link>
        ))}
        <button className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors",
          collapsed && "justify-center px-2"
        )}>
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{t.nav.logout}</span>}
        </button>
      </div>

      {/* User */}
      <div className="p-3 border-t border-slate-800/50 shrink-0">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl bg-slate-800/30",
          collapsed && "justify-center p-2"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            AB
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Alisher B.</p>
              <p className="text-xs text-slate-500 truncate">{t.nav.admin}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
