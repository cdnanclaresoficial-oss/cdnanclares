import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, LogIn, LogOut, Download, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { FichaJugador, PedidoRopa } from "@/types";

// Mock data for demo
const MOCK_JUGADORES: FichaJugador[] = [
  { id: "1", created_at: "2024-01-15", nombre: "Mikel", apellidos: "García López", dni: "12345678A", email: "mikel@email.com", telefono: "600111222", direccion: "Calle Mayor 5", fecha_nacimiento: "1995-03-20", peso: 75, altura: 180, posicion: "Mediocentro", categoria: "Senior", observaciones_entrenador: "Buen pie derecho", estado: "Activo" },
  { id: "2", created_at: "2024-02-10", nombre: "Ander", apellidos: "Ruiz Etxeberria", dni: "87654321B", email: "ander@email.com", telefono: "600333444", direccion: "Plaza Nueva 12", fecha_nacimiento: "1998-07-11", peso: 70, altura: 175, posicion: "Extremo Derecho", categoria: "Senior", observaciones_entrenador: "", estado: "Activo" },
  { id: "3", created_at: "2024-03-01", nombre: "Jon", apellidos: "Martínez Aguirre", dni: "11223344C", email: "jon@email.com", telefono: "600555666", direccion: "Av. Vitoria 8", fecha_nacimiento: "2008-11-05", peso: 55, altura: 165, posicion: "Delantero Centro", categoria: "Cadete", observaciones_entrenador: "Potencial alto", estado: "Activo" },
];

const MOCK_PEDIDOS: PedidoRopa[] = [
  { id: "1", created_at: "2024-03-10", cliente_datos: { nombre: "Laura", apellidos: "Fernández", dni: "99887766D", email: "laura@email.com", telefono: "600777888" }, articulos_pedido: [{ id: "1", nombre: "Camiseta 1ª Equipación", talla: "M", cantidad: 2, precio: 45 }], estado_pedido: "Pendiente", total_estimado: 90 },
  { id: "2", created_at: "2024-03-12", cliente_datos: { nombre: "Pedro", apellidos: "Sanz", dni: "55443322E", email: "pedro@email.com", telefono: "600999000" }, articulos_pedido: [{ id: "4", nombre: "Chándal Completo", talla: "L", cantidad: 1, precio: 65 }], estado_pedido: "Preparado", total_estimado: 65 },
];

const Admin = () => {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchJugadores, setSearchJugadores] = useState("");
  const [searchPedidos, setSearchPedidos] = useState("");
  const [filterPos, setFilterPos] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [editingPlayer, setEditingPlayer] = useState<FichaJugador | null>(null);
  const [obsText, setObsText] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      toast({ title: "Introduce tus credenciales", variant: "destructive" });
      return;
    }
    setIsLoggedIn(true);
    toast({ title: "Sesión iniciada" });
  };

  const filteredJugadores = MOCK_JUGADORES.filter((j) => {
    const matchSearch = `${j.nombre} ${j.apellidos} ${j.dni}`.toLowerCase().includes(searchJugadores.toLowerCase());
    const matchPos = filterPos === "all" || j.posicion === filterPos;
    const matchCat = filterCat === "all" || j.categoria === filterCat;
    return matchSearch && matchPos && matchCat;
  });

  const filteredPedidos = MOCK_PEDIDOS.filter((p) =>
    `${p.cliente_datos.nombre} ${p.cliente_datos.apellidos} ${p.cliente_datos.dni}`.toLowerCase().includes(searchPedidos.toLowerCase())
  );

  const openEditObs = (player: FichaJugador) => {
    setEditingPlayer(player);
    setObsText(player.observaciones_entrenador);
  };

  const saveObs = () => {
    toast({ title: "Observaciones guardadas" });
    setEditingPlayer(null);
  };

  const exportCSV = () => {
    toast({ title: "Exportación simulada", description: "Se generaría un CSV con los datos filtrados." });
  };

  if (!isLoggedIn) {
    return (
      <main className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <LogIn className="mx-auto text-primary mb-4" size={40} />
            <h1 className="font-heading text-3xl font-bold text-primary uppercase">Panel Admin</h1>
            <p className="text-muted-foreground text-sm mt-2">Acceso restringido para gestores del club</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-primary">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@cdnanclares.com" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-primary">Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleLogin} className="w-full bg-primary text-primary-foreground hover:bg-navy-light font-heading uppercase tracking-wider">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen bg-background">
      <section className="gradient-navy py-8">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold text-primary-foreground uppercase tracking-tight">Dashboard</h1>
          <Button variant="ghost" onClick={() => setIsLoggedIn(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
            <LogOut size={18} className="mr-2" /> Salir
          </Button>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="jugadores">
          <TabsList className="mb-6">
            <TabsTrigger value="jugadores" className="font-heading uppercase tracking-wider">Jugadores</TabsTrigger>
            <TabsTrigger value="pedidos" className="font-heading uppercase tracking-wider">Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="jugadores">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar jugador..." value={searchJugadores} onChange={(e) => setSearchJugadores(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterPos} onValueChange={setFilterPos}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Posición" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las posiciones</SelectItem>
                  {["Portero", "Defensa Central", "Lateral Derecho", "Lateral Izquierdo", "Mediocentro", "Mediapunta", "Extremo Derecho", "Extremo Izquierdo", "Delantero Centro"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {["Prebenjamín", "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Senior", "Veteranos"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportCSV}>
                <Download size={16} className="mr-2" /> Exportar
              </Button>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {["Nombre", "DNI", "Categoría", "Posición", "Estado", "Acciones"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-heading text-xs uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredJugadores.map((j) => (
                    <tr key={j.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{j.nombre} {j.apellidos}</td>
                      <td className="px-4 py-3 text-muted-foreground">{j.dni}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="font-heading text-xs uppercase">{j.categoria}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{j.posicion}</td>
                      <td className="px-4 py-3">
                        <Badge className={j.estado === "Activo" ? "bg-green-600 text-primary-foreground" : "bg-muted text-muted-foreground"}>
                          {j.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => openEditObs(j)} className="text-primary hover:text-secondary">
                          <Edit size={14} className="mr-1" /> Obs.
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="pedidos">
            <div className="relative max-w-md mb-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar pedido..." value={searchPedidos} onChange={(e) => setSearchPedidos(e.target.value)} className="pl-10" />
            </div>
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {["Cliente", "DNI", "Artículos", "Total", "Estado"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-heading text-xs uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPedidos.map((p) => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{p.cliente_datos.nombre} {p.cliente_datos.apellidos}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.cliente_datos.dni}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.articulos_pedido.map((a) => `${a.nombre} (${a.talla} x${a.cantidad})`).join(", ")}</td>
                      <td className="px-4 py-3 font-heading font-bold text-secondary">{p.total_estimado.toFixed(2)} €</td>
                      <td className="px-4 py-3">
                        <Badge className={
                          p.estado_pedido === "Pendiente" ? "bg-yellow-500 text-primary-foreground" :
                          p.estado_pedido === "Preparado" ? "bg-blue-500 text-primary-foreground" :
                          "bg-green-600 text-primary-foreground"
                        }>
                          {p.estado_pedido}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit observations modal */}
      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase text-primary">
              Observaciones — {editingPlayer?.nombre} {editingPlayer?.apellidos}
            </DialogTitle>
          </DialogHeader>
          <Textarea value={obsText} onChange={(e) => setObsText(e.target.value)} className="min-h-[120px]" placeholder="Notas del entrenador..." />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>Cancelar</Button>
            <Button onClick={saveObs} className="bg-secondary text-secondary-foreground hover:bg-red-club-light font-heading uppercase">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Admin;
