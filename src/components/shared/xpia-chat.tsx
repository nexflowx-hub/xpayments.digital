"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Loader2, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface XpIAChatProps {
  open: boolean;
  onClose: () => void;
}

export function XpIAChat({ open, onClose }: XpIAChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou a XpIA, a assistente IA da XPayments. Posso ajudar com pagamentos, FX, onboarding, integração API e muito mais. Como posso ajudar?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // POST /api/v1/ai/chat — see API_SPECIFICATION.md for endpoint details
      const res = await fetch("/api/xpia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.response || data.data?.response || "Desculpe, não consegui processar a resposta. Tente novamente.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Fallback: show a helpful message if the AI endpoint isn't available yet
      const fallbackMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "Estou temporariamente indisponível para chat em tempo real. Para urgências, contacte-nos via Telegram (@XPay_Digital), WhatsApp (+55 62 99288-7416) ou email (contact@xpayments.digital).",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      toast.info("XpIA offline — use os canais de contacto alternativos");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex h-[600px] max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow background */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
                  <Sparkles className="h-5 w-5 text-white" />
                  <div className="absolute inset-0 animate-ping rounded-xl bg-primary/20" style={{ animationDuration: "3s" }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">XpIA</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-muted-foreground">AI Assistant · Online</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="scrollbar-thin relative z-10 flex-1 overflow-y-auto px-5 py-4"
            >
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-primary to-primary/60"
                        : "bg-muted"
                    )}>
                      {msg.role === "assistant" ? (
                        <Bot className="h-4 w-4 text-white" />
                      ) : (
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === "assistant"
                        ? "rounded-tl-sm bg-card border border-border/40 text-foreground"
                        : "rounded-tr-sm bg-primary text-primary-foreground"
                    )}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/40 bg-card px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "300ms" }} />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="relative z-10 border-t border-border/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte sobre pagamentos, FX, onboarding..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="shrink-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                XpIA pode cometer erros. Verifique informações importantes. Powered by OpenRouter.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
