"use client"

import { motion } from "framer-motion"
import { Sidebar } from "@/components/dashboard/sidebar"
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context"
import { ReactNode } from "react"

function ShellContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="min-h-screen p-6"
      >
        {children}
      </motion.main>
    </div>
  )
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ShellContent>{children}</ShellContent>
    </SidebarProvider>
  )
}
