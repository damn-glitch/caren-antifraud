"use client"

// CAREN - Command Palette (Cmd/Ctrl + K)
// Author: Alisher Beisembekov

import {
  useState, useEffect, useMemo, useRef, useCallback, createContext, useContext, ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  Search, LayoutDashboard, Activity, Bell, Filter, Network, Landmark, Waves,
  BarChart3, Brain, Users, FileText, Settings, HelpCircle, MessageSquare,
  Scale, ShieldCheck, UserSearch, Globe, Handshake, KanbanSquare, SlidersHorizontal,
  Gauge, Radar, ScrollText, CornerDownLeft, ArrowUp, ArrowDown, Command,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

interface CommandItem {
  id: string
  href: string
  icon: typeof LayoutDashboard
  label: { en: string; ru: string }
  group: { en: string; ru: string }
  keywords: string
}

const GROUPS = {
  overview: { en: 'Overview', ru: 'Обзор' },
  detection: { en: 'Detection', ru: 'Обнаружение' },
  investigation: { en: 'Investigation', ru: 'Расследование' },
  compliance: { en: 'Compliance', ru: 'Комплаенс' },
  operations: { en: 'Operations', ru: 'Операции' },
  platform: { en: 'Platform', ru: 'Платформа' },
}

const COMMANDS: CommandItem[] = [
  { id: 'dashboard', href: '/dashboard', icon: LayoutDashboard, label: { en: 'Dashboard', ru: 'Панель управления' }, group: GROUPS.overview, keywords: 'home main overview панель главная' },
  { id: 'transactions', href: '/dashboard/transactions', icon: Activity, label: { en: 'Transactions', ru: 'Транзакции' }, group: GROUPS.overview, keywords: 'payments txn операции платежи' },
  { id: 'analytics', href: '/dashboard/analytics', icon: BarChart3, label: { en: 'Analytics', ru: 'Аналитика' }, group: GROUPS.overview, keywords: 'charts metrics графики метрики' },

  { id: 'alerts', href: '/dashboard/alerts', icon: Bell, label: { en: 'Alerts', ru: 'Оповещения' }, group: GROUPS.detection, keywords: 'notifications warnings уведомления' },
  { id: 'triage', href: '/dashboard/triage', icon: Filter, label: { en: 'Alert Triage', ru: 'Триаж оповещений' }, group: GROUPS.detection, keywords: 'noise reduction dedup приоритет шум' },
  { id: 'rings', href: '/dashboard/rings', icon: Network, label: { en: 'Fraud Rings', ru: 'Мошеннические сети' }, group: GROUPS.detection, keywords: 'graph network cluster граф сеть кластер' },
  { id: 'behavioral', href: '/dashboard/behavioral', icon: Waves, label: { en: 'Behavioral AI', ru: 'Поведенческий ИИ' }, group: GROUPS.detection, keywords: 'drift baseline дрейф профиль' },
  { id: 'synthetic', href: '/dashboard/synthetic', icon: UserSearch, label: { en: 'Synthetic Identity', ru: 'Синтетические личности' }, group: GROUPS.detection, keywords: 'fake identity kyc поддельные личности' },
  { id: 'geo', href: '/dashboard/geo', icon: Globe, label: { en: 'Geo Intelligence', ru: 'Гео-аналитика' }, group: GROUPS.detection, keywords: 'travel location map карта перемещения' },
  { id: 'threats', href: '/dashboard/threats', icon: Radar, label: { en: 'Threat Intel', ru: 'Разведка угроз' }, group: GROUPS.detection, keywords: 'intelligence feed dark web угрозы' },

  { id: 'investigations', href: '/dashboard/investigations', icon: Brain, label: { en: 'Investigation Copilot', ru: 'Ко-пилот расследований' }, group: GROUPS.investigation, keywords: 'case file evidence досье доказательства' },
  { id: 'cases', href: '/dashboard/cases', icon: KanbanSquare, label: { en: 'Case Management', ru: 'Управление кейсами' }, group: GROUPS.investigation, keywords: 'kanban workflow sla канбан очередь' },
  { id: 'copilot', href: '/dashboard/copilot', icon: MessageSquare, label: { en: 'AI Copilot Chat', ru: 'Чат ИИ-аналитика' }, group: GROUPS.investigation, keywords: 'chat ask question чат вопрос помощник' },

  { id: 'aml', href: '/dashboard/aml', icon: Landmark, label: { en: 'AML Monitor', ru: 'Мониторинг ПОД/ФТ' }, group: GROUPS.compliance, keywords: 'laundering fatf отмывание типологии' },
  { id: 'screening', href: '/dashboard/screening', icon: ShieldCheck, label: { en: 'Sanctions Screening', ru: 'Санкционный скрининг' }, group: GROUPS.compliance, keywords: 'ofac pep watchlist санкции пдл' },
  { id: 'regulatory', href: '/dashboard/regulatory', icon: Scale, label: { en: 'Regulatory Radar', ru: 'Регуляторный радар' }, group: GROUPS.compliance, keywords: 'compliance change law регулирование нормы' },
  { id: 'sar', href: '/dashboard/sar', icon: ScrollText, label: { en: 'SAR Generator', ru: 'Генератор СПО' }, group: GROUPS.compliance, keywords: 'suspicious activity report отчёт подозрительн' },
  { id: 'audit', href: '/dashboard/audit', icon: ScrollText, label: { en: 'Audit Trail', ru: 'Журнал аудита' }, group: GROUPS.compliance, keywords: 'log history immutable журнал история' },

  { id: 'payments', href: '/dashboard/payments', icon: Gauge, label: { en: 'Payment Approval', ru: 'Одобрение платежей' }, group: GROUPS.operations, keywords: 'withdrawal auto approve вывод одобрение' },
  { id: 'affiliates', href: '/dashboard/affiliates', icon: Handshake, label: { en: 'Affiliate Fraud', ru: 'Фрод аффилиатов' }, group: GROUPS.operations, keywords: 'partner commission партнёр комиссия' },
  { id: 'rules', href: '/dashboard/rules', icon: SlidersHorizontal, label: { en: 'Rule Builder', ru: 'Конструктор правил' }, group: GROUPS.operations, keywords: 'simulator what-if threshold правила симулятор порог' },
  { id: 'team', href: '/dashboard/team', icon: Users, label: { en: 'Team', ru: 'Команда' }, group: GROUPS.operations, keywords: 'people analysts команда сотрудники' },
  { id: 'reports', href: '/dashboard/reports', icon: FileText, label: { en: 'Reports', ru: 'Отчёты' }, group: GROUPS.operations, keywords: 'export pdf отчёты выгрузка' },

  { id: 'models', href: '/dashboard/models', icon: Brain, label: { en: 'AI Models', ru: 'Модели ИИ' }, group: GROUPS.platform, keywords: 'ml ensemble модели ансамбль' },
  { id: 'modelops', href: '/dashboard/modelops', icon: Gauge, label: { en: 'Model Ops', ru: 'Операции моделей' }, group: GROUPS.platform, keywords: 'drift psi fairness дрейф справедливость' },
  { id: 'settings', href: '/dashboard/settings', icon: Settings, label: { en: 'Settings', ru: 'Настройки' }, group: GROUPS.platform, keywords: 'config preferences настройки' },
  { id: 'help', href: '/dashboard/help', icon: HelpCircle, label: { en: 'Help', ru: 'Помощь' }, group: GROUPS.platform, keywords: 'docs faq support помощь справка' },
]

interface PaletteContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined)

/** Wraps the app so any component can open the palette without synthetic events. */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <PaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette open={open} setOpen={setOpen} />
    </PaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(PaletteContext)
  if (!ctx) throw new Error("useCommandPalette must be used within a CommandPaletteProvider")
  return ctx
}

function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const router = useRouter()
  const { locale } = useLocale()
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const pick = (c: CommandItem) => (locale === 'ru' ? c.label.ru : c.label.en)

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS

    const q = query.toLowerCase()
    return COMMANDS.filter(c =>
      c.label.en.toLowerCase().includes(q) ||
      c.label.ru.toLowerCase().includes(q) ||
      c.keywords.toLowerCase().includes(q)
    )
  }, [query])

  // Group the filtered results while preserving the declaration order.
  const grouped = useMemo(() => {
    const map = new Map<string, { label: { en: string; ru: string }; items: CommandItem[] }>()
    for (const item of filtered) {
      const key = item.group.en
      if (!map.has(key)) map.set(key, { label: item.group, items: [] })
      map.get(key)!.items.push(item)
    }
    return Array.from(map.values())
  }, [filtered])

  const flatIndexed = useMemo(() => grouped.flatMap(g => g.items), [grouped])

  const navigate = useCallback((item: CommandItem) => {
    setOpen(false)
    setQuery("")
    router.push(item.href)
  }, [router])

  // Global hotkey: Cmd/Ctrl+K toggles, Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
        return
      }
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  // Reset selection whenever the result set changes.
  useEffect(() => setActiveIndex(0), [query, open])

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(flatIndexed.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatIndexed[activeIndex]
      if (item) navigate(item)
    }
  }

  // Keep the highlighted row inside the scroll viewport.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  let runningIndex = -1

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/80 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-violet-500/10"
          >
            <div className="flex items-center gap-3 border-b border-slate-800 px-4">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={locale === 'ru' ? 'Поиск разделов и действий...' : 'Search pages and actions...'}
                className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <kbd className="hidden shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 sm:block">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {flatIndexed.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-500">
                  {locale === 'ru' ? 'Ничего не найдено' : 'No results found'}
                </p>
              ) : (
                grouped.map(group => (
                  <div key={group.label.en} className="mb-2">
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {locale === 'ru' ? group.label.ru : group.label.en}
                    </p>
                    {group.items.map(item => {
                      runningIndex += 1
                      const index = runningIndex
                      const isActive = index === activeIndex

                      return (
                        <button
                          key={item.id}
                          data-index={index}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => navigate(item)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                            isActive ? "bg-violet-500/15 text-white" : "text-slate-300 hover:bg-slate-800/50"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-violet-400" : "text-slate-500")} />
                          <span className="flex-1 truncate text-sm">{pick(item)}</span>
                          {isActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  <ArrowDown className="h-3 w-3" />
                  {locale === 'ru' ? 'навигация' : 'navigate'}
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" />
                  {locale === 'ru' ? 'открыть' : 'open'}
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" />K
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Small affordance that tells users the palette exists. */
export function CommandPaletteHint() {
  const { locale } = useLocale()
  const { setOpen } = useCommandPalette()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    // userAgent avoids the deprecated navigator.platform.
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent))
  }, [])

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 rounded-xl border border-slate-800/50 bg-slate-900/50 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{locale === 'ru' ? 'Поиск' : 'Search'}</span>
      <kbd className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px]">
        {isMac ? '⌘' : 'Ctrl'} K
      </kbd>
    </button>
  )
}
