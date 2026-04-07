import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { Socio } from "@/types";

interface SociosTabProps {
  socios: Socio[];
}

const SociosTab = ({ socios }: SociosTabProps) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return socios;
    return socios.filter((s) =>
      `${s.numero_socio} ${s.nombre} ${s.primer_apellido} ${s.segundo_apellido} ${s.dni} ${s.email}`
        .toLowerCase()
        .includes(q),
    );
  }, [socios, search]);

  return (
    <>
      <div className="relative max-w-md mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar socio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {["Nº Socio", "Nombre", "DNI", "Contacto", "Dirección"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="font-heading">{s.numero_socio}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-primary">
                  {s.nombre} {s.primer_apellido} {s.segundo_apellido}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.dni}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div>{s.email}</div>
                  <div>{s.telefono}{s.telefono_tutor ? ` · Tutor: ${s.telefono_tutor}` : ""}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.direccion_calle}, {s.direccion_numero}
                  {s.direccion_piso ? `, Piso ${s.direccion_piso}` : ""}
                  {s.direccion_puerta ? `, Puerta ${s.direccion_puerta}` : ""}
                  {" · "}
                  {s.direccion_codigo_postal} {s.direccion_ciudad} ({s.direccion_provincia})
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron socios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SociosTab;
