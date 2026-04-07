import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, X, Send, User, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import logoCdn from "@/assets/logo-cdn.jpg";
import { supabase } from "@/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CoachChat = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola, soy el asistente para entrenadores. Te ayudo con análisis y seguimiento de fichas de jugadores." },
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
          supabase.from("club_config").select("valor").eq("clave", "asistente_entrenadores").single(),
          supabase.from("fichas_jugadores").select("*"),
        ]);
        if (personalityRes.data?.valor) setPersonality(personalityRes.data.valor);
        if (jugadoresRes.data) setJugadoresContext(JSON.stringify(jugadoresRes.data));
      } catch (err) {
        console.error("Error fetching coach config:", err);
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
          modo: "entrenadores",
          ...(personality ? { system_prompt: personality } : {}),
          ...(jugadoresContext ? { jugadores_data: jugadoresContext } : {}),
        }),
      });
      const data = await res.json();
      const reply = data.answer || data.text || data.response || JSON.stringify(data);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error de conexión: ${err?.message || "desconocido"}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, personality, jugadoresContext]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Abrir chat entrenadores"
      >
        <ShieldCheck size={22} />
      </button>
    );
  }

  const containerClass = expanded
    ? "fixed bottom-0 right-0 z-50 w-[50vw] h-[100vh] flex flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300"
    : "fixed bottom-24 right-6 z-50 w-[420px] max-h-[520px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in";

  return (
    <div className={containerClass}>
      <div className="bg-secondary px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoCdn} alt="CDN" className="h-7 w-7 rounded-full object-cover ring-1 ring-secondary-foreground/20" />
          <span className="font-heading text-sm font-bold text-secondary-foreground uppercase tracking-wider">Coach IA</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="text-secondary-foreground/70 hover:text-secondary-foreground p-1 transition-colors">
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={() => { setOpen(false); setExpanded(false); }} className="text-secondary-foreground/70 hover:text-secondary-foreground p-1 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

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
              <ReactMarkdown>{m.content}</ReactMarkdown>
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
            <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground">Pensando...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Consulta sobre fichas y entrenamientos..."
          className="text-sm"
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="shrink-0">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};

export default CoachChat;
