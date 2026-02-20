import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, User, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import logoCdn from "@/assets/logo-cdn.jpg";
import { supabase } from "@/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AnalystChat = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "¡Hola! Soy El Analista. Pregúntame sobre jugadores, estadísticas o cualquier dato del club." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState<string | null>(null);
  const [jugadoresContext, setJugadoresContext] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [personalityRes, jugadoresRes] = await Promise.all([
          supabase.from("club_config").select("valor").eq("clave", "asistente_analista").single(),
          supabase.from("fichas_jugadores").select("*"),
        ]);
        if (personalityRes.data?.valor) setPersonality(personalityRes.data.valor);
        if (jugadoresRes.data) setJugadoresContext(JSON.stringify(jugadoresRes.data));
      } catch (err) {
        console.error("Error fetching analyst config:", err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://rwqbrwpzgjhkgnkqtlab.supabase.co/functions/v1/analista-nanclares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cWJyd3B6Z2poa2dua3F0bGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTQwNzUsImV4cCI6MjA4NzA3MDA3NX0.yFCMPJISmJK_BPZ82vKtZzwTY_d-xzOaK3_5VmgCegE`,
        },
        body: JSON.stringify({
          query: text,
          modo: "admin",
          ...(personality ? { system_prompt: personality } : {}),
          ...(jugadoresContext ? { jugadores_data: jugadoresContext } : {}),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || "El analista no ha devuelto respuesta." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "No se pudo conectar con el analista." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, personality, jugadoresContext]);

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

  const containerClass = expanded
    ? "fixed bottom-0 right-0 z-50 w-[50vw] h-[100vh] flex flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300"
    : "fixed bottom-6 right-6 z-50 w-[380px] max-h-[520px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="gradient-navy px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoCdn} alt="CDN" className="h-7 w-7 rounded-full object-cover ring-1 ring-primary-foreground/20" />
          <span className="font-heading text-sm font-bold text-primary-foreground uppercase tracking-wider">El Analista</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary-foreground/60 hover:text-primary-foreground p-1 transition-colors"
            aria-label={expanded ? "Minimizar" : "Expandir"}
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={() => { setOpen(false); setExpanded(false); }} className="text-primary-foreground/60 hover:text-primary-foreground p-1 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-full overflow-hidden shrink-0">
                <img src={logoCdn} alt="CDN" className="h-full w-full object-cover" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            }`}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
                }}
              >
                {m.content}
              </ReactMarkdown>
            </div>
            {m.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <User size={14} className="text-secondary" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="h-7 w-7 rounded-full overflow-hidden shrink-0">
              <img src={logoCdn} alt="CDN" className="h-full w-full object-cover" />
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
      <div className="border-t border-border p-3 flex gap-2 shrink-0">
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
