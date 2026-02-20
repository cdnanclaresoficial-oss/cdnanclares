import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, Ruler, Weight } from "lucide-react";
import type { FichaJugador, Categoria } from "@/types";

const CATEGORIAS: Categoria[] = ["Prebenjamín", "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Senior", "Veteranos"];
const PIE_COLORS = ["hsl(142, 71%, 45%)", "hsl(0, 0%, 60%)"];

interface DashboardTabProps {
  jugadores: FichaJugador[];
}

const DashboardTab = ({ jugadores }: DashboardTabProps) => {
  const [filterCat, setFilterCat] = useState("all");
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterPos, setFilterPos] = useState("all");

  const filtered = useMemo(() => {
    return jugadores.filter((j) => {
      if (filterCat !== "all" && j.categoria !== filterCat) return false;
      if (filterEstado !== "all" && j.estado !== filterEstado) return false;
      if (filterPos !== "all" && j.posicion !== filterPos) return false;
      return true;
    });
  }, [jugadores, filterCat, filterEstado, filterPos]);

  const barData = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIAS.forEach((c) => (counts[c] = 0));
    filtered.forEach((j) => { counts[j.categoria] = (counts[j.categoria] || 0) + 1; });
    return CATEGORIAS.map((c) => ({ name: c, total: counts[c] }));
  }, [filtered]);

  const pieData = useMemo(() => {
    const activos = filtered.filter((j) => j.estado === "Activo").length;
    const bajas = filtered.length - activos;
    return [
      { name: "Activo", value: activos },
      { name: "Baja", value: bajas },
    ];
  }, [filtered]);

  const metrics = useMemo(() => {
    const count = filtered.length;
    if (count === 0) return { total: 0, avgAltura: 0, avgPeso: 0 };
    const avgAltura = filtered.reduce((s, j) => s + (j.altura || 0), 0) / count;
    const avgPeso = filtered.reduce((s, j) => s + (j.peso || 0), 0) / count;
    return { total: count, avgAltura: Math.round(avgAltura * 10) / 10, avgPeso: Math.round(avgPeso * 10) / 10 };
  }, [filtered]);

  const posiciones = useMemo(() => [...new Set(jugadores.map((j) => j.posicion))].sort(), [jugadores]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Activo">Activo</SelectItem>
            <SelectItem value="Baja">Baja</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPos} onValueChange={setFilterPos}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Posición" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las posiciones</SelectItem>
            {posiciones.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jugadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-3xl font-heading font-bold text-primary">{metrics.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Altura Media</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-3xl font-heading font-bold text-primary">{metrics.avgAltura} <span className="text-sm text-muted-foreground">cm</span></p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Peso Medio</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-3xl font-heading font-bold text-primary">{metrics.avgPeso} <span className="text-sm text-muted-foreground">kg</span></p></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-heading text-lg uppercase tracking-wide">Jugadores por Categoría</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ total: { label: "Jugadores", color: "hsl(var(--primary))" } }} className="h-[300px] w-full">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-heading text-lg uppercase tracking-wide">Estado de Fichas</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={{ Activo: { label: "Activo", color: PIE_COLORS[0] }, Baja: { label: "Baja", color: PIE_COLORS[1] } }} className="h-[250px] w-full">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
