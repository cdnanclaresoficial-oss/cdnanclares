import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Fichas Jugadores ---
export const fichasService = {
  async getAll() {
    const { data, error } = await supabase
      .from("fichas_jugadores")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(ficha: Omit<import("@/types").FichaJugador, "id" | "created_at">) {
    const { data, error } = await supabase.from("fichas_jugadores").insert(ficha).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<import("@/types").FichaJugador>) {
    const { data, error } = await supabase.from("fichas_jugadores").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};

// --- Pedidos Ropa ---
export const pedidosService = {
  async getAll() {
    const { data, error } = await supabase
      .from("pedidos_ropa")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(pedido: Omit<import("@/types").PedidoRopa, "id" | "created_at">) {
    const { data, error } = await supabase.from("pedidos_ropa").insert(pedido).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: Partial<import("@/types").PedidoRopa>) {
    const { data, error } = await supabase.from("pedidos_ropa").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};

// --- Auth ---
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => callback(session));
  },
};
