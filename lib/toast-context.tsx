"use client"

// CAREN - Real-time toast notifications
// Author: Alisher Beisembekov

import {
  createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from "lucide-react"

export type ToastKind = 'info' | 'success' | 'warning' | 'critical'

export interface Toast {
  id: string
  kind: ToastKind
  title: string
  message?: string
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
  clear: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const KIND_STYLES: Record<ToastKind, { icon: typeof Info; border: string; iconColor: string; glow: string }> = {
  info: { icon: Info, border: 'border-sky-500/30', iconColor: 'text-sky-400', glow: 'shadow-sky-500/10' },
  success: { icon: CheckCircle2, border: 'border-emerald-500/30', iconColor: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
  warning: { icon: AlertTriangle, border: 'border-amber-500/30', iconColor: 'text-amber-400', glow: 'shadow-amber-500/10' },
  critical: { icon: ShieldAlert, border: 'border-red-500/40', iconColor: 'text-red-400', glow: 'shadow-red-500/20' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  // Timers are tracked so unmount does not leave dangling dismiss callbacks.
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const duration = toast.duration ?? 6000

    // Cap the stack so a burst of alerts cannot cover the whole viewport.
    setToasts(prev => [...prev.slice(-4), { ...toast, id }])

    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    }
  }, [dismiss])

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    setToasts([])
  }, [])

  useEffect(() => {
    const active = timers.current
    return () => {
      active.forEach(clearTimeout)
      active.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss, clear }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const style = KIND_STYLES[toast.kind]
          const Icon = style.icon

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`pointer-events-auto rounded-xl border ${style.border} bg-slate-900/95 p-4 shadow-xl ${style.glow} backdrop-blur-xl`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconColor}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{toast.title}</p>
                  {toast.message && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="shrink-0 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}
