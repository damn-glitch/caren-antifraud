"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  Shield,
  Brain,
  BarChart3,
  Bell,
  FileText,
  Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const quickLinks = [
  {
    title: "Getting Started",
    description: "Learn the basics of CAREN fraud detection",
    icon: Book,
    color: "blue",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    title: "AI Models",
    description: "Understand our ML-powered detection engine",
    icon: Brain,
    color: "violet",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    title: "Dashboard Guide",
    description: "Navigate the analytics dashboard",
    icon: BarChart3,
    color: "emerald",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    title: "Alert Management",
    description: "Configure and manage fraud alerts",
    icon: Bell,
    color: "amber",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    title: "API Reference",
    description: "Integrate CAREN with your systems",
    icon: Zap,
    color: "cyan",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
  },
  {
    title: "Reports",
    description: "Generate and customize reports",
    icon: FileText,
    color: "pink",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-400",
  },
]

const faqItems = [
  {
    question: "How does CAREN detect fraud?",
    answer:
      "CAREN uses PCA-transformed features extracted from transaction data and feeds them into an ensemble of machine learning models, including XGBoost and Random Forest. Each transaction is scored in real-time, combining predictions from multiple models to produce a final fraud probability. This ensemble approach significantly reduces false positives while maintaining high detection rates across diverse fraud patterns.",
  },
  {
    question: "What is the detection accuracy?",
    answer:
      "CAREN achieves a 99.94% detection accuracy, based on Alisher Beisembekov's research and evaluation on the Kaggle credit card fraud dataset. This accuracy is measured across both fraudulent and legitimate transactions, ensuring the system reliably identifies true fraud while minimizing disruption to genuine customers.",
  },
  {
    question: "How fast is the real-time analysis?",
    answer:
      "CAREN delivers sub-50ms response times for individual transaction scoring, enabling true real-time fraud detection at scale. The system is architected to process millions of transactions daily without degradation in latency or accuracy, making it suitable for high-throughput financial environments.",
  },
  {
    question: "What machine learning models are used?",
    answer:
      "CAREN employs an ensemble of five machine learning models: XGBoost, Random Forest, Logistic Regression, K-Nearest Neighbors (KNN), and AdaBoost Decision Tree. Each model brings unique strengths — tree-based models capture non-linear patterns, while logistic regression provides interpretable baseline predictions. The ensemble combines their outputs for robust, well-calibrated fraud scores.",
  },
  {
    question: "How are PCA features used?",
    answer:
      "The system utilizes 28 PCA-transformed features (V1 through V28) along with the original Amount and Time features, totaling 30 input dimensions. PCA (Principal Component Analysis) transforms the raw transaction attributes into orthogonal components that maximize variance, enabling optimal fraud signal extraction while preserving data privacy since the original feature meanings are obfuscated.",
  },
  {
    question: "Can I customize detection thresholds?",
    answer:
      "Yes, detection thresholds are fully configurable through the Settings page. You can adjust risk score thresholds for different severity levels (critical, high, medium, low), fine-tune sensitivity per transaction category, and set custom rules that override or augment the ML-based scoring. Changes take effect in real-time without requiring model retraining.",
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const filteredFaqItems = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredQuickLinks = quickLinks.filter(
    (link) =>
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <HelpCircle className="w-7 h-7 text-violet-400" />
            <h1 className="text-2xl font-bold text-white">Help Center</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Everything you need to know about CAREN
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-900/50 border border-slate-800/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all duration-300"
            />
          </div>
        </motion.div>

        {/* Quick Links Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuickLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <motion.div
                  key={link.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                >
                  <Card className="bg-slate-900/50 border-slate-800/50 hover:border-violet-500/30 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg ${link.iconBg} flex items-center justify-center shrink-0`}
                        >
                          <Icon className={`w-5 h-5 ${link.iconColor}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                            {link.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {filteredFaqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + index * 0.05 }}
              >
                <div className="bg-slate-800/30 rounded-xl border border-slate-800/50 overflow-hidden transition-all duration-300 hover:border-violet-500/20">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-sm font-medium text-white pr-4">
                      {item.question}
                    </span>
                    {openFaqIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-violet-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0">
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Need more help?
              </h3>
              <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                Our support team is ready to assist you with any questions about
                CAREN fraud detection system.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button variant="default">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
