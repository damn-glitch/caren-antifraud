"use client"

import { motion } from "framer-motion"
import {
  Brain,
  Shield,
  Zap,
  Globe,
  BarChart3,
  Lock,
  Eye,
  Fingerprint,
  Network,
  Bell,
  RefreshCw,
  Database,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "Neural Network AI",
    description: "Deep learning models trained on millions of transactions using XGBoost and Random Forest ensemble methods.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Zap,
    title: "Real-Time Analysis",
    description: "Sub-50ms transaction analysis with instant fraud detection and automatic blocking.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Multi-Layer Protection",
    description: "Velocity checks, pattern analysis, location verification, and ML predictions combined.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Comprehensive dashboards with real-time metrics, trends, and predictive insights.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Protecting transactions across 190+ countries with localized risk models.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Lock,
    title: "Bank-Grade Security",
    description: "SOC 2 Type II certified with end-to-end encryption and zero-knowledge architecture.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: Eye,
    title: "Behavioral Analysis",
    description: "User behavior profiling to detect account takeover and unusual activity patterns.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Fingerprint,
    title: "Device Fingerprinting",
    description: "Advanced device identification to prevent fraud from compromised devices.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Network,
    title: "Network Analysis",
    description: "Graph-based fraud ring detection to identify organized fraud operations.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Intelligent alert system with severity scoring and automated escalation.",
    gradient: "from-teal-500 to-green-500",
  },
  {
    icon: RefreshCw,
    title: "Adaptive Learning",
    description: "Continuously learning models that adapt to new fraud patterns in real-time.",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    icon: Database,
    title: "Data Intelligence",
    description: "PCA-transformed features for optimal fraud signal extraction and analysis.",
    gradient: "from-rose-500 to-pink-500",
  },
]

export function Features() {
  return (
    <section className="relative py-32 bg-slate-950">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

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
              Enterprise-Grade
            </span>{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              AI Protection
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Powered by advanced machine learning algorithms from our research, CAREN delivers
            unmatched fraud detection with industry-leading accuracy.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="h-full bg-slate-900/50 border-slate-800/50 hover:border-violet-500/30 transition-all duration-300 group" glow>
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
