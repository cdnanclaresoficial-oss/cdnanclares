import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PlayerSheet from "./PlayerSheet";
import type { FichaJugador } from "@/types";

const POSICIONES = ["Portero", "Defensa Central", "Lateral Derecho", "Lateral Izquierdo", "Mediocentro", "Mediapunta", "Extremo Derecho", "Extremo Izquierdo", "Delantero Centro"];
const CATEGORIAS = ["Prebenjamín", "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Senior", "Veteranos"];

interface PlayersTabProps {
  jugadores: FichaJugador[];
  onRefresh: () => void;
}

const PlayersTab = ({ jugadores, onRefresh }: PlayersTabProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState<FichaJugador | null>(null);

  const filtered = jugadores.filter((j) => {
    const matchSearch = `${j.nombre} ${j.apellidos} ${j.dni}`.toLowerCase().includes(search.toLowerCase());
    const matchPos = filterPos === "all" || j.posicion === filterPos;
    const matchCat = filterCat === "all" || j.categoria === filterCat;
    return matchSearch && matchPos && matchCat;
  });

  const exportCSV = () => {
    const headers = ["Nombre", "Apellidos", "DNI", "Email", "Teléfono", "Categoría", "Posición", "Estado"];
    const rows = filtered.map((j) => [j.nombre, j.apellidos, j.dni, j.email, j.telefono, j.categoria, j.posicion, j.estado]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jugadores.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado" });
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar jugador..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterPos} onValueChange={setFilterPos}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Posición" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las posiciones</SelectItem>
            {POSICIONES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
              {["", "Nombre", "DNI", "Categoría", "Posición", "Estado"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-heading text-xs uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((j) => (
              <tr
                key={j.id}
                className="border-t border-border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedPlayer(j)}
              >
                <td className="px-4 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={j.foto_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-heading">
                      {j.nombre[0]}{j.apellidos[0]}
                    </AvatarFallback>
                  </Avatar>
                </td>
                <td className="px-4 py-3 font-semibold text-primary">{j.nombre} {j.apellidos}</td>
                <td className="px-4 py-3 text-muted-foreground">{j.dni}</td>
                <td className="px-4 py-3"><Badge variant="secondary" className="font-heading text-xs uppercase">{j.categoria}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{j.posicion}</td>
                <td className="px-4 py-3">
                  <Badge className={j.estado === "Activo" ? "bg-green-600 text-primary-foreground" : "bg-muted text-muted-foreground"}>
                    {j.estado}
                  </Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No se encontraron jugadores</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <PlayerSheet
        player={selectedPlayer}
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onSaved={onRefresh}
      />
    </>
  );
};

export default PlayersTab;
