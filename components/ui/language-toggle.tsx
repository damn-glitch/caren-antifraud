"use client"

import { motion } from "framer-motion"
import { Languages } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

/** Compact RU/EN switch with a sliding pill indicator. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale()

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-xl border border-slate-800/50 bg-slate-900/50 p-1",
        className
      )}
    >
      <Languages className="ml-1.5 h-4 w-4 shrink-0 text-slate-500" />
      {(["ru", "en"] as const).map((code) => {
        const isActive = locale === code
        return (
          <button
            key={code}
            onClick={() => setLocale(code)}
            className={cn(
              "relative rounded-lg px-2.5 py-1 text-xs font-semibold uppercase transition-colors",
              isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="locale-pill"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 rounded-lg bg-violet-600 shadow-lg shadow-violet-500/30"
              />
            )}
            <span className="relative z-10">{code}</span>
          </button>
        )
      })}
    </div>
  )
}
