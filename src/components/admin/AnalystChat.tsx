import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AnalystChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "¡Hola! Soy El Analista. Pregúntame sobre jugadores, estadísticas o cualquier dato del club." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Replace YOUR_PROJECT_ID with actual Supabase project ID
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rwqbrwpzgjhkgnkqtlab.supabase.co";
      const res = await fetch(`${supabaseUrl}/functions/v1/analista-nanclares`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ""}` },
        body: JSON.stringify({ messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.message || "Sin respuesta." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error al conectar con el analista. Verifica la Edge Function." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Abrir chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[520px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="gradient-navy px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-primary-foreground" />
          <span className="font-heading text-sm font-bold text-primary-foreground uppercase tracking-wider">El Analista</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-primary-foreground/60 hover:text-primary-foreground"><X size={18} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-primary" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            }`}>
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-secondary" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot size={14} className="text-primary" />
            </div>
            <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Escribe tu pregunta..."
          className="text-sm"
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="shrink-0">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};

export default AnalystChat;
