"use client"

import { motion } from "framer-motion"
import { Shield, Menu, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { useLocale } from "@/lib/locale-context"
import { useState } from "react"

const NAV_LINKS = [
  { href: '#features', label: { en: 'Features', ru: 'Возможности' } },
  { href: '#metrics', label: { en: 'Metrics', ru: 'Метрики' } },
  { href: '#research', label: { en: 'Research', ru: 'Исследование' } },
  { href: '#pricing', label: { en: 'Pricing', ru: 'Тарифы' } },
]

const COPY = {
  signIn: { en: 'Sign In', ru: 'Войти' },
  dashboard: { en: 'Dashboard', ru: 'Панель' },
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { locale } = useLocale()
  const pick = (v: { en: string; ru: string }) => (locale === 'ru' ? v.ru : v.en)

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-800/50 px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-white">CAREN</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {pick(item.label)}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" className="text-slate-300">
              {pick(COPY.signIn)}
            </Button>
            <Link href="/dashboard">
              <Button>{pick(COPY.dashboard)}</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800/50 p-6"
          >
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-slate-400 hover:text-white transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {pick(item.label)}
                </Link>
              ))}
              <hr className="border-slate-800" />
              <LanguageToggle className="self-start" />
              <Button variant="ghost" className="w-full justify-center text-slate-300">
                {pick(COPY.signIn)}
              </Button>
              <Link href="/dashboard">
                <Button className="w-full">{pick(COPY.dashboard)}</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
