"use client"

import { motion } from "framer-motion"
import { CAREN_MODEL_METRICS, FEATURE_IMPORTANCE } from "@/lib/fraud-detection"

export function Metrics() {
  const metrics = [
    { label: "Accuracy", value: CAREN_MODEL_METRICS.accuracy, color: "from-emerald-500 to-teal-500" },
    { label: "Precision", value: CAREN_MODEL_METRICS.precision, color: "from-violet-500 to-purple-500" },
    { label: "Recall", value: CAREN_MODEL_METRICS.recall, color: "from-blue-500 to-cyan-500" },
    { label: "F1 Score", value: CAREN_MODEL_METRICS.f1Score, color: "from-pink-500 to-rose-500" },
    { label: "AUC-ROC", value: CAREN_MODEL_METRICS.auc, color: "from-amber-500 to-orange-500" },
    { label: "Specificity", value: CAREN_MODEL_METRICS.specificity, color: "from-indigo-500 to-violet-500" },
  ]

  return (
    <section className="relative py-32 bg-gradient-to-b from-slate-950 via-violet-950/20 to-slate-950">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[200px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Model Performance
            </span>{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Metrics
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Based on research by Alisher Beisembekov, CAREN achieves state-of-the-art
            performance on credit card fraud detection benchmarks.
          </p>
        </motion.div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-20">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity duration-300 ${metric.color}" />
              <div className="relative bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 text-center hover:border-violet-500/30 transition-colors">
                <div className={`text-4xl font-bold mb-2 bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`}>
                  {(metric.value * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-slate-400 font-medium">{metric.label}</div>
                {/* Progress ring */}
                <svg className="absolute top-2 right-2 w-8 h-8 -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-slate-800"
                  />
                  <motion.circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={88}
                    initial={{ strokeDashoffset: 88 }}
                    whileInView={{ strokeDashoffset: 88 * (1 - metric.value) }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                  <defs>
                    <linearGradient id="gradient">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature importance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-3xl p-8"
        >
          <h3 className="text-2xl font-bold text-white mb-8 text-center">Feature Importance Analysis</h3>
          <div className="space-y-4">
            {FEATURE_IMPORTANCE.map((feature, index) => (
              <motion.div
                key={feature.feature}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex items-center gap-4"
              >
                <div className="w-20 text-sm font-mono text-violet-400">{feature.feature}</div>
                <div className="flex-1 h-8 bg-slate-800/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full flex items-center justify-end pr-3"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${feature.importance * 100 * 5}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.05 }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {(feature.importance * 100).toFixed(1)}%
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
