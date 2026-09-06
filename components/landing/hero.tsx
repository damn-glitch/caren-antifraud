"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Brain, Zap, Lock, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"

interface Particle {
  x: number
  y: number
  drift: number
  duration: number
  delay: number
}

const COPY = {
  badge: { en: 'AI-Powered Fraud Protection', ru: 'Защита от мошенничества на базе ИИ' },
  tagline: {
    en: 'Credit Analysis & Risk Evaluation Network',
    ru: 'Сеть кредитного анализа и оценки рисков',
  },
  body: {
    en: 'Eighteen intelligence modules covering detection, investigation, compliance and model governance — scoring every transaction in under 50ms at 99.94% accuracy.',
    ru: 'Восемнадцать интеллектуальных модулей — обнаружение, расследование, комплаенс и управление моделями — оценивают каждую операцию менее чем за 50 мс с точностью 99,94%.',
  },
  launch: { en: 'Launch Dashboard', ru: 'Открыть панель' },
  demo: { en: 'Watch Demo', ru: 'Смотреть демо' },
  accuracy: { en: 'Accuracy', ru: 'Точность' },
  protected: { en: 'Protected', ru: 'Защищено' },
  responseTime: { en: 'Response Time', ru: 'Время отклика' },
  uptime: { en: 'Uptime SLA', ru: 'Доступность SLA' },
}

export function Hero() {
  const { locale } = useLocale()
  const pick = (v: { en: string; ru: string }) => (locale === 'ru' ? v.ru : v.en)

  // Particles are randomised on the client only — generating them during render
  // would produce different markup on server and client and break hydration.
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        drift: Math.random() * -500,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5,
      }))
    )
  }, [])

  const stats = [
    { value: "99.94%", label: pick(COPY.accuracy), icon: Brain },
    { value: "$2.1B+", label: pick(COPY.protected), icon: Shield },
    { value: "<50ms", label: pick(COPY.responseTime), icon: Zap },
    { value: "100%", label: pick(COPY.uptime), icon: Lock },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />

        {/* Glowing orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[128px]"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Floating particles — populated client-side after mount */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-violet-400/50 rounded-full"
          initial={{ x: particle.x, y: particle.y, opacity: 0 }}
          animate={{ y: particle.y + particle.drift, opacity: [0, 1, 0] }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
        {/* Logo badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-violet-300">{pick(COPY.badge)}</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tight mb-6"
        >
          <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
            CAREN
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl md:text-3xl font-medium text-violet-200/80 mb-4"
        >
          {pick(COPY.tagline)}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          {pick(COPY.body)}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
        >
          <Link href="/dashboard">
            <Button size="xl" className="group">
              {pick(COPY.launch)}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button size="xl" variant="outline" className="border-violet-500/30 text-violet-300 hover:text-white hover:border-violet-500/50">
            {pick(COPY.demo)}
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 mb-3">
                <stat.icon className="w-6 h-6 text-violet-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
    </section>
  )
}
