"use client"

// CAREN - Conversational Fraud Analyst (AI Copilot)
// Author: Alisher Beisembekov

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Quote,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import {
  STARTER_PROMPTS,
  chunkContent,
  generateResponse,
  type ChatMessage,
  type Intent,
} from "@/lib/copilot-chat"

/** How long the "thinking" indicator shows before the reply starts streaming. */
const THINKING_MS = 700
/** Interval between streamed chunks — fast enough to read, slow enough to feel live. */
const STREAM_TICK_MS = 28

/** Intent badges are technical labels, so they stay identical in both locales. */
const INTENT_BADGE: Record<Intent, string> = {
  account_risk: "account risk",
  why_flagged: "why flagged",
  ring_lookup: "ring lookup",
  portfolio_summary: "portfolio summary",
  pattern_trend: "pattern trend",
  compare_baseline: "compare baseline",
  recommend_action: "recommend action",
  regulatory_question: "regulatory",
  unknown: "general",
}

/** Split assistant content into paragraphs, preserving blank-line breaks. */
function toParagraphs(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.93) return "from-emerald-500 to-emerald-300"
  if (confidence >= 0.85) return "from-violet-500 to-violet-300"
  return "from-amber-500 to-amber-300"
}

export default function CopilotPage() {
  const { t, locale } = useLocale()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(
    null
  )
  const [streamedText, setStreamedText] = useState("")
  const [openSources, setOpenSources] = useState<Record<string, boolean>>({})

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const streamIntervalRef = useRef<number | null>(null)
  const thinkingTimeoutRef = useRef<number | null>(null)
  // Monotonic counter keeps user-message ids stable without Math.random().
  const messageCounterRef = useRef(0)

  const isBusy = isThinking || streamingMessage !== null

  /** Grow the composer with its content, up to the CSS max height. */
  const resizeComposer = useCallback(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = "auto"
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`
  }, [])

  // Clear any in-flight timers so a fast unmount cannot setState afterwards.
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current !== null) {
        window.clearInterval(streamIntervalRef.current)
        streamIntervalRef.current = null
      }
      if (thinkingTimeoutRef.current !== null) {
        window.clearTimeout(thinkingTimeoutRef.current)
        thinkingTimeoutRef.current = null
      }
    }
  }, [])

  // Follow the conversation as it grows and as text streams in.
  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" })
  }, [messages, streamedText, isThinking, streamingMessage])

  const submitQuery = useCallback(
    (rawQuery: string) => {
      const query = rawQuery.trim()
      if (!query || isBusy) return

      messageCounterRef.current += 1
      const userMessage: ChatMessage = {
        id: `MSG-U-${messageCounterRef.current}`,
        role: "user",
        content: query,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      if (textareaRef.current) {
        textareaRef.current.style.height = ""
      }
      setIsThinking(true)

      thinkingTimeoutRef.current = window.setTimeout(() => {
        thinkingTimeoutRef.current = null

        const reply = generateResponse(query, locale)
        const chunks = chunkContent(reply.content)

        setIsThinking(false)
        setStreamedText("")
        setStreamingMessage(reply)

        let index = 0
        streamIntervalRef.current = window.setInterval(() => {
          index += 1
          setStreamedText(chunks.slice(0, index).join(" "))

          if (index >= chunks.length) {
            if (streamIntervalRef.current !== null) {
              window.clearInterval(streamIntervalRef.current)
              streamIntervalRef.current = null
            }
            setStreamingMessage(null)
            setStreamedText("")
            setMessages((prev) => [...prev, reply])
          }
        }, STREAM_TICK_MS)
      }, THINKING_MS)
    },
    [isBusy, locale]
  )

  const handleStarter = useCallback(
    (prompt: string) => {
      submitQuery(prompt)
    },
    [submitQuery]
  )

  const handleFollowUp = useCallback(
    (prompt: string) => {
      setInput(prompt)
      textareaRef.current?.focus()
      window.requestAnimationFrame(resizeComposer)
    },
    [resizeComposer]
  )

  const toggleSources = useCallback((messageId: string) => {
    setOpenSources((prev) => ({ ...prev, [messageId]: !prev[messageId] }))
  }, [])

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        submitQuery(input)
      }
    },
    [input, submitQuery]
  )

  const renderAssistantBody = (
    message: ChatMessage,
    content: string,
    streaming: boolean
  ) => {
    const paragraphs = toParagraphs(content)
    const sourcesOpen = Boolean(openSources[message.id])
    const citations = message.citations ?? []
    const metrics = message.metrics ?? []
    const followUps = message.followUps ?? []

    return (
      <div className="min-w-0 flex-1 space-y-4">
        {/* ---- Intent + latency ---- */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="border-violet-500/30 text-violet-300 px-2.5 py-0.5 text-[10px] uppercase tracking-wider"
          >
            {INTENT_BADGE[message.intent ?? "unknown"]}
          </Badge>
          {message.latencyMs !== undefined && (
            <span className="text-[10px] font-mono text-slate-600">
              {message.latencyMs} ms
            </span>
          )}
        </div>

        {/* ---- Streamed answer ---- */}
        <div className="space-y-3">
          {paragraphs.map((paragraph, index) => (
            <p
              key={`${message.id}-p-${index}`}
              className="text-sm text-slate-300 leading-relaxed"
            >
              {paragraph}
              {streaming && index === paragraphs.length - 1 && (
                <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-violet-400" />
              )}
            </p>
          ))}
        </div>

        {/* Metrics, sources and follow-ups only settle once streaming finishes. */}
        {!streaming && metrics.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {metrics.map((metric, index) => (
              <div
                key={`${message.id}-metric-${index}`}
                className="rounded-xl border border-slate-800/50 bg-slate-950/50 px-3 py-2 min-w-[110px]"
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {locale === "ru" ? metric.label.ru : metric.label.en}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-base font-bold font-mono text-white">
                    {metric.value}
                  </span>
                  {metric.trend === "up" && (
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {metric.trend === "down" && (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!streaming && citations.length > 0 && (
          <div className="rounded-xl border border-slate-800/50 bg-slate-950/40 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSources(message.id)}
              aria-expanded={sourcesOpen}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-900/60"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                <Quote className="w-3.5 h-3.5" />
                {t.pages.copilotSources}
                <span className="font-mono text-slate-500 normal-case tracking-normal">
                  {citations.length}
                </span>
              </span>
              <motion.span
                animate={{ rotate: sourcesOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-500"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {sourcesOpen && (
                <motion.div
                  key="sources"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 border-t border-slate-800/50 px-3.5 py-3">
                    {citations.map((citation, index) => (
                      <div
                        key={`${message.id}-cite-${index}`}
                        className="space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs text-slate-300 min-w-0">
                            {locale === "ru"
                              ? citation.label.ru
                              : citation.label.en}
                          </span>
                          <span className="shrink-0 rounded-full border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400">
                            {citation.source}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-800/60 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${citation.confidence * 100}%` }}
                              transition={{
                                duration: 0.6,
                                delay: 0.05 * index,
                                ease: "easeOut",
                              }}
                              className={`h-full rounded-full bg-gradient-to-r ${confidenceColor(
                                citation.confidence
                              )}`}
                            />
                          </div>
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">
                            {t.common.confidence}{" "}
                            {(citation.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!streaming && followUps.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {t.pages.copilotFollowUp}
            </p>
            <div className="flex flex-wrap gap-2">
              {followUps.map((followUp, index) => {
                const text = locale === "ru" ? followUp.ru : followUp.en
                return (
                  <button
                    key={`${message.id}-follow-${index}`}
                    type="button"
                    onClick={() => handleFollowUp(text)}
                    className="rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 text-xs text-violet-200 transition-colors hover:border-violet-500/40 hover:bg-violet-500/15"
                  >
                    {text}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <DashboardShell>
      <div className="flex flex-col h-[calc(100vh-8.5rem)]">
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 mb-4"
        >
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-violet-400" />
            {t.pages.copilotTitle}
          </h1>
          <p className="text-slate-400 text-sm">{t.pages.copilotSubtitle}</p>
        </motion.div>

        {/* ---- Conversation ---- */}
        <Card className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-900/50 border-slate-800/50">
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6"
          >
            {messages.length === 0 && !isBusy ? (
              /* ---- Empty state ---- */
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center gap-5 py-10"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {t.pages.copilotEmpty}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {t.pages.copilotSubtitle}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
                  {STARTER_PROMPTS.map((prompt, index) => {
                    const text = locale === "ru" ? prompt.ru : prompt.en
                    return (
                      <motion.button
                        key={prompt.intent}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                        onClick={() => handleStarter(text)}
                        className="rounded-full border border-slate-800/80 bg-slate-950/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-200"
                      >
                        {text}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              <>
                {messages.map((message) =>
                  message.role === "user" ? (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end gap-3"
                    >
                      <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-md border border-violet-500/20 bg-violet-500/10 px-4 py-3">
                        <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-300" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      {renderAssistantBody(message, message.content, false)}
                    </motion.div>
                  )
                )}

                {/* ---- Thinking indicator ---- */}
                <AnimatePresence initial={false}>
                  {isThinking && (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3 items-center"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-800/50 bg-slate-950/50 px-4 py-2.5">
                        <span className="text-sm text-slate-400">
                          {t.pages.copilotThinking}
                        </span>
                        <span className="flex items-center gap-1">
                          {[0, 1, 2].map((dot) => (
                            <motion.span
                              key={dot}
                              className="w-1.5 h-1.5 rounded-full bg-violet-400"
                              animate={{ opacity: [0.25, 1, 0.25] }}
                              transition={{
                                duration: 1.1,
                                repeat: Infinity,
                                delay: dot * 0.18,
                                ease: "easeInOut",
                              }}
                            />
                          ))}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ---- Streaming reply ---- */}
                {streamingMessage && (
                  <div key={streamingMessage.id} className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    {renderAssistantBody(streamingMessage, streamedText, true)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ---- Composer ---- */}
          <div className="shrink-0 border-t border-slate-800/50 bg-slate-950/40 p-3 sm:p-4">
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value)
                  resizeComposer()
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={t.pages.copilotPlaceholder}
                disabled={isBusy}
                className="flex-1 min-h-[46px] max-h-40 resize-none rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 disabled:opacity-60"
              />
              <Button
                type="button"
                size="icon"
                onClick={() => submitQuery(input)}
                disabled={isBusy || input.trim().length === 0}
                aria-label={t.pages.copilotPlaceholder}
                className="h-[46px] w-[46px] shrink-0 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
