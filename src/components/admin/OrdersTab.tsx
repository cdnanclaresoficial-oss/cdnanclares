import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pedidosService } from "@/lib/supabase";
import type { PedidoRopa, EstadoPedido } from "@/types";

interface OrdersTabProps {
  pedidos: PedidoRopa[];
  onRefresh: () => void;
}

const ESTADOS: EstadoPedido[] = ["Pendiente", "Preparado", "Entregado"];

const OrdersTab = ({ pedidos, onRefresh }: OrdersTabProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filtered = pedidos.filter((p) =>
    `${p.cliente_datos.nombre} ${p.cliente_datos.apellidos} ${p.cliente_datos.dni}`.toLowerCase().includes(search.toLowerCase())
  );

  const updateEstado = async (id: string, estado: EstadoPedido) => {
    try {
      await pedidosService.update(id, { estado_pedido: estado });
      toast({ title: `Estado actualizado a ${estado}` });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <>
      <div className="relative max-w-md mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar pedido..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-primary">{p.cliente_datos.nombre} {p.cliente_datos.apellidos}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.cliente_datos.dni}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.articulos_pedido.map((a) => `${a.nombre} (${a.talla} x${a.cantidad})`).join(", ")}</td>
                <td className="px-4 py-3 font-heading font-bold text-secondary">{p.total_estimado.toFixed(2)} €</td>
                <td className="px-4 py-3">
                  <Select value={p.estado_pedido} onValueChange={(v) => updateEstado(p.id, v as EstadoPedido)}>
                    <SelectTrigger className="w-[130px]">
                      <Badge className={
                        p.estado_pedido === "Pendiente" ? "bg-yellow-500 text-primary-foreground" :
                        p.estado_pedido === "Preparado" ? "bg-blue-500 text-primary-foreground" :
                        "bg-green-600 text-primary-foreground"
                      }>
                        {p.estado_pedido}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No se encontraron pedidos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default OrdersTab;
