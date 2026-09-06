"use client"

// CAREN - Locale Context Provider
// Author: Alisher Beisembekov

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { Locale, translations } from "./i18n"

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: typeof translations.en
  toggleLocale: () => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const STORAGE_KEY = "caren-locale"

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru")

  // Restore persisted locale on mount (client-only to avoid hydration mismatch)
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === "ru" || saved === "en") {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ru" ? "en" : "ru")
  }, [locale, setLocale])

  const t = translations[locale] as typeof translations.en

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider")
  }
  return ctx
}

/** Convenience hook that returns just the translation dictionary. */
export function useT() {
  return useLocale().t
}
