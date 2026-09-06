"use client"

import { motion } from "framer-motion"
import {
  Brain, Shield, Zap, Globe, Network, Bell, Database,
  MessageSquare, Scale, ShieldCheck, UserSearch, Handshake,
  Gauge, SlidersHorizontal, Radar, ScrollText, Filter, Waves,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/lib/locale-context"

interface Feature {
  icon: typeof Brain
  title: { en: string; ru: string }
  description: { en: string; ru: string }
  gradient: string
}

const features: Feature[] = [
  {
    icon: Brain,
    title: { en: 'Ensemble ML Engine', ru: 'Ансамблевый ML-движок' },
    description: {
      en: 'Five models — XGBoost, Random Forest, Logistic Regression, KNN and AdaBoost — voting on every transaction across 28 PCA features.',
      ru: 'Пять моделей — XGBoost, Random Forest, логистическая регрессия, KNN и AdaBoost — голосуют по каждой операции на 28 PCA-признаках.',
    },
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Filter,
    title: { en: 'Intelligent Alert Triage', ru: 'Интеллектуальный триаж' },
    description: {
      en: 'Collapses roughly 2,000 raw alerts into about 50 high-confidence cases through deduplication, correlation and confidence gating.',
      ru: 'Сжимает около 2 000 сырых оповещений примерно в 50 кейсов высокой достоверности через дедупликацию, корреляцию и фильтр уверенности.',
    },
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: MessageSquare,
    title: { en: 'Investigation Copilot', ru: 'Ко-пилот расследований' },
    description: {
      en: 'A complete case file — verdict, evidence chain, timeline and recommended actions — assembled in about 30 seconds instead of three hours.',
      ru: 'Полное досье — вердикт, цепочка доказательств, хронология и рекомендации — собирается примерно за 30 секунд вместо трёх часов.',
    },
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Network,
    title: { en: 'Fraud Ring Graph', ru: 'Граф мошеннических сетей' },
    description: {
      en: 'Link analysis exposing coordinated networks: orchestrators, partners, sub-affiliates and mule accounts, correlated on shared attributes.',
      ru: 'Анализ связей раскрывает скоординированные сети: организаторов, партнёров, суб-аффилиатов и дроп-счета по общим атрибутам.',
    },
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Waves,
    title: { en: 'Behavioural Drift', ru: 'Поведенческий дрейф' },
    description: {
      en: 'Each account is measured against its own 90-day baseline across six dimensions, so anomalies are personal rather than population-wide.',
      ru: 'Каждый счёт оценивается относительно собственной 90-дневной базы по шести измерениям, поэтому аномалии персональны, а не усреднены.',
    },
    gradient: 'from-fuchsia-500 to-pink-500',
  },
  {
    icon: Scale,
    title: { en: 'AML Typologies', ru: 'Типологии ПОД/ФТ' },
    description: {
      en: 'Eight laundering patterns — structuring, smurfing, layering, round-tripping and more — each mapped to its FATF or BSA reference.',
      ru: 'Восемь схем отмывания — дробление, смурфинг, расслоение, круговые операции и другие — со ссылками на нормы FATF и BSA.',
    },
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: ShieldCheck,
    title: { en: 'Sanctions Screening', ru: 'Санкционный скрининг' },
    description: {
      en: 'Fuzzy matching against OFAC, EU, UN and PEP lists, with discriminator analysis that clears most false positives automatically.',
      ru: 'Нечёткое сопоставление со списками OFAC, ЕС, ООН и ПДЛ с анализом расхождений, который снимает большинство ложных срабатываний автоматически.',
    },
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Radar,
    title: { en: 'Regulatory Radar', ru: 'Регуляторный радар' },
    description: {
      en: 'Tracks regulatory change across six jurisdictions and proposes the exact threshold adjustments each new rule implies.',
      ru: 'Отслеживает изменения регулирования в шести юрисдикциях и предлагает конкретные изменения порогов, вытекающие из каждой новой нормы.',
    },
    gradient: 'from-teal-500 to-green-500',
  },
  {
    icon: UserSearch,
    title: { en: 'Synthetic Identity', ru: 'Синтетические личности' },
    description: {
      en: 'Detects fabricated identities that pass KYC and are never reported, because no real victim exists to report them.',
      ru: 'Выявляет сфабрикованные личности, которые проходят KYC и о которых никто не заявляет, поскольку реального пострадавшего не существует.',
    },
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Globe,
    title: { en: 'Geo Intelligence', ru: 'Гео-аналитика' },
    description: {
      en: 'Impossible-travel detection that separates genuine credential compromise from ordinary VPN use before anyone gets blocked.',
      ru: 'Обнаружение невозможных перемещений отделяет реальную компрометацию учётных данных от обычного VPN до того, как кого-то заблокируют.',
    },
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Handshake,
    title: { en: 'Affiliate Fraud', ru: 'Фрод аффилиатов' },
    description: {
      en: 'Finds opposite trading, fake traffic and commission churn, and forecasts which partners will escalate weeks in advance.',
      ru: 'Находит встречную торговлю, фиктивный трафик и прокрутку комиссии и прогнозирует, какие партнёры эскалируют, за недели вперёд.',
    },
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: SlidersHorizontal,
    title: { en: 'What-If Simulator', ru: 'What-if симулятор' },
    description: {
      en: 'Change a threshold and see the precision, recall, workload and missed-fraud consequences before the rule ever ships.',
      ru: 'Измените порог и увидьте последствия для precision, recall, нагрузки и пропущенного фрода до того, как правило будет внедрено.',
    },
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Gauge,
    title: { en: 'Payment Automation', ru: 'Автоматизация платежей' },
    description: {
      en: 'Withdrawal decisions in tens of milliseconds, each one carrying the factor breakdown that produced it.',
      ru: 'Решения по выводу средств за десятки миллисекунд, каждое — с разбором факторов, которые к нему привели.',
    },
    gradient: 'from-lime-500 to-emerald-500',
  },
  {
    icon: Zap,
    title: { en: 'Explainable Scoring', ru: 'Объяснимый скоринг' },
    description: {
      en: 'SHAP-style attribution that reconciles to the model score, so every verdict can be defended to a regulator.',
      ru: 'SHAP-атрибуция, сходящаяся с оценкой модели, поэтому каждый вердикт можно обосновать перед регулятором.',
    },
    gradient: 'from-yellow-500 to-amber-500',
  },
  {
    icon: ScrollText,
    title: { en: 'SAR Generation', ru: 'Генерация СПО' },
    description: {
      en: 'Regulatory narratives drafted from case evidence in the five-section structure examiners expect.',
      ru: 'Нормативные тексты, составленные по доказательствам кейса в той пятиразделочной структуре, которую ожидают проверяющие.',
    },
    gradient: 'from-sky-500 to-blue-500',
  },
  {
    icon: Database,
    title: { en: 'Immutable Audit Trail', ru: 'Неизменяемый журнал аудита' },
    description: {
      en: 'Hash-chained record of every decision, so tampering is detectable rather than merely discouraged.',
      ru: 'Запись каждого решения с цепочкой хешей: подделка становится обнаружимой, а не просто нежелательной.',
    },
    gradient: 'from-slate-500 to-slate-400',
  },
  {
    icon: Bell,
    title: { en: 'Model Operations', ru: 'Операции моделей' },
    description: {
      en: 'Population stability, concept-drift alerts and four-fifths fairness testing across every demographic segment.',
      ru: 'Стабильность популяции, оповещения о дрейфе концепции и тест «четырёх пятых» на справедливость по всем демографическим сегментам.',
    },
    gradient: 'from-red-500 to-orange-500',
  },
  {
    icon: Shield,
    title: { en: 'Threat Intelligence', ru: 'Разведка угроз' },
    description: {
      en: 'External feeds correlated against your own estate, so an indicator only raises an alert when it actually matches something.',
      ru: 'Внешние фиды сопоставляются с вашей инфраструктурой, поэтому индикатор поднимает оповещение, только если действительно с чем-то совпал.',
    },
    gradient: 'from-green-500 to-emerald-500',
  },
]

export function Features() {
  const { locale } = useLocale()
  const pick = (v: { en: string; ru: string }) => (locale === 'ru' ? v.ru : v.en)

  const heading = {
    lead: { en: 'Enterprise-Grade', ru: 'Корпоративная' },
    accent: { en: 'AI Protection', ru: 'ИИ-защита' },
    body: {
      en: 'Eighteen intelligence modules built on the research behind CAREN — from ensemble scoring and graph analysis to regulatory drafting and model fairness.',
      ru: 'Восемнадцать интеллектуальных модулей, построенных на исследовании, лежащем в основе CAREN, — от ансамблевого скоринга и графового анализа до подготовки нормативных документов и проверки справедливости моделей.',
    },
  }

  return (
    <section className="relative py-32 bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {pick(heading.lead)}
            </span>{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {pick(heading.accent)}
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {pick(heading.body)}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title.en}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
            >
              <Card className="h-full bg-slate-900/50 border-slate-800/50 hover:border-violet-500/30 transition-all duration-300 group" glow>
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{pick(feature.title)}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{pick(feature.description)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
