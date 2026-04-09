import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, User, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import logoCdn from "@/assets/logo-cdn.jpg";
import { supabase } from "@/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PublicChatProps {
  autoOpen?: boolean;
  personalityKey?: string;
  mode?: "publico" | "tienda" | "club";
  welcomeMessage?: string;
  assistantName?: string;
  assistantSubtitle?: string;
  includeShopCatalog?: boolean;
}

const FACTUAL_GUARDRAILS = [
  "Norma obligatoria: no inventes datos, nombres, cifras, plantillas, horarios ni resultados.",
  "Si no tienes información verificada en el contexto disponible, di exactamente que no dispones de ese dato confirmado.",
  "En ese caso, ofrece ayuda alternativa con información general del club (ubicación, cómo llegar, distancias, contacto, trámites, tienda o formularios).",
  "No afirmes hechos específicos sin base en datos proporcionados.",
].join(" ");

const PublicChat = ({
  autoOpen = false,
  personalityKey = "asistente_personalidad",
  mode = "publico",
  welcomeMessage = "¡Hola! Soy el asistente del C.D. Nanclares. ¿En qué puedo ayudarte?",
  assistantName = "C.D. Nanclares",
  assistantSubtitle = "Asistente virtual",
  includeShopCatalog = false,
}: PublicChatProps) => {
  const [open, setOpen] = useState(autoOpen);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAutoCloseNotice, setShowAutoCloseNotice] = useState(false);
  const [personality, setPersonality] = useState<string | null>(null);
  const [shopCatalogContext, setShopCatalogContext] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const fetchPersonality = async () => {
      try {
        const { data } = await supabase
          .from("club_config")
          .select("valor")
          .eq("clave", personalityKey)
          .single();
        if (data?.valor) setPersonality(data.valor);
      } catch (err) {
        console.error("Error fetching asistente_personalidad:", err);
      }
    };
    fetchPersonality();
  }, [personalityKey]);

  useEffect(() => {
    if (!includeShopCatalog) {
      setShopCatalogContext(null);
      return;
    }

    const fetchShopCatalog = async () => {
      try {
        const { data } = await supabase.from("productos_tienda").select("*");
        if (data) {
          setShopCatalogContext(JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error fetching productos_tienda:", err);
      }
    };

    fetchShopCatalog();
  }, [includeShopCatalog]);

  useEffect(() => {
    setMessages([{ role: "assistant", content: welcomeMessage }]);
  }, [welcomeMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    userInteractedRef.current = false;
    setShowAutoCloseNotice(false);

    const noticeTimeoutId = setTimeout(() => {
      if (!userInteractedRef.current) {
        setShowAutoCloseNotice(true);
      }
    }, 5000);

    const timeoutId = setTimeout(() => {
      if (!userInteractedRef.current) {
        setOpen(false);
        setExpanded(false);
        setShowAutoCloseNotice(false);
      }
    }, 10000);

    return () => {
      clearTimeout(noticeTimeoutId);
      clearTimeout(timeoutId);
    };
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    userInteractedRef.current = true;
    setShowAutoCloseNotice(false);
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
          modo: mode,
          ...(personality || shopCatalogContext || FACTUAL_GUARDRAILS
            ? {
                system_prompt: [
                  FACTUAL_GUARDRAILS,
                  personality || "",
                  shopCatalogContext ? `Catalogo de tienda en JSON: ${shopCatalogContext}` : "",
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              }
            : {}),
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
  }, [input, loading, personality, mode, shopCatalogContext]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-primary shadow-xl flex items-center justify-center hover:scale-110 transition-transform ring-4 ring-primary/20"
        aria-label="Abrir chat"
      >
        <img src={logoCdn} alt="CDN" className="h-10 w-10 rounded-full object-cover" />
      </button>
    );
  }

  const containerClass = expanded
    ? "fixed bottom-0 right-0 z-50 w-[50vw] h-[100vh] flex flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300"
    : "fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[540px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-primary px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoCdn} alt="CDN" className="h-9 w-9 rounded-full object-cover ring-2 ring-primary-foreground/20" />
          <div>
            <p className="font-heading text-sm font-bold text-primary-foreground uppercase tracking-wider">{assistantName}</p>
            <p className="text-xs text-primary-foreground/50">{assistantSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              userInteractedRef.current = true;
              setExpanded(!expanded);
            }}
            className="text-primary-foreground/60 hover:text-primary-foreground transition-colors p-1"
            aria-label={expanded ? "Minimizar" : "Expandir"}
          >
            {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button onClick={() => { setOpen(false); setExpanded(false); }} className="text-primary-foreground/60 hover:text-primary-foreground transition-colors p-1">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        {showAutoCloseNotice && (
          <div className="rounded-xl border-2 border-amber-500 bg-amber-300 px-4 py-3 text-center font-heading shadow-[0_0_14px_rgba(251,191,36,0.9)]">
            <p className="text-sm md:text-base font-extrabold text-black leading-tight">
              No te molesto mas, si quieres algo aqui me tienes !
            </p>
            <p className="mt-1 text-xs md:text-sm font-bold text-black">
              Este chat se cerrara en unos segundos
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 mt-0.5 ring-1 ring-border">
                <img src={logoCdn} alt="CDN" className="h-full w-full object-cover" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
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
              <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-secondary" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5 items-start">
            <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 ring-1 ring-border">
              <img src={logoCdn} alt="CDN" className="h-full w-full object-cover" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground">
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
      <div className="border-t border-border p-3 flex gap-2 shrink-0 bg-card">
        <Input
          value={input}
          onChange={(e) => {
            userInteractedRef.current = true;
            setInput(e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Escribe tu pregunta..."
          className="text-sm rounded-xl"
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="shrink-0 rounded-xl">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};

export default PublicChat;
