"use client"

import { motion } from "framer-motion"
import { Sidebar } from "@/components/dashboard/sidebar"
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { CommandPaletteHint } from "@/components/ui/command-palette"
import { ReactNode } from "react"

function ShellContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 248 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="min-h-screen p-6"
      >
        {/* Utility bar — reachable from every dashboard page. */}
        <div className="mb-4 flex items-center justify-end gap-3">
          <CommandPaletteHint />
          <LanguageToggle />
        </div>
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
