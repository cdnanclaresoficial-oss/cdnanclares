import { useMemo, useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sociosService } from "@/lib/supabase";
import { notifyNewSocio } from "@/services/notifications";
import CarnetSocio from "@/components/CarnetSocio";
import {
  CUOTAS_SOCIO,
  NUMEROS_SOCIO_RESERVADOS,
  cuotaPorId,
  textoCuota,
} from "@/data/cuotasSocio";
import type { Socio } from "@/types";

interface SociosTabProps {
  socios: Socio[];
  onRefresh: () => void;
}

const schema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  primer_apellido: z.string().trim().min(1, "Requerido"),
  segundo_apellido: z.string().trim().min(1, "Requerido"),
  dni: z.string().regex(/^\d{8}[A-Z]$/, "DNI inválido"),
  fecha_nacimiento: z.string().min(1, "Requerido"),
  direccion_calle: z.string().trim().min(1, "Requerido"),
  direccion_numero: z.string().trim().min(1, "Requerido"),
  direccion_piso: z.string().trim().optional(),
  direccion_puerta: z.string().trim().optional(),
  direccion_codigo_postal: z.string().regex(/^\d{5}$/, "Código postal inválido"),
  direccion_ciudad: z.string().trim().min(1, "Requerido"),
  direccion_provincia: z.string().trim().min(1, "Requerido"),
  direccion_pais: z.string().trim().min(1, "Requerido"),
  email: z.string().trim().email("Email inválido"),
  telefono: z.string().trim().min(6, "Teléfono inválido"),
  telefono_tutor: z.string().trim().optional(),
});

const INITIAL = {
  nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  dni: "",
  fecha_nacimiento: "",
  direccion_calle: "",
  direccion_numero: "",
  direccion_piso: "",
  direccion_puerta: "",
  direccion_codigo_postal: "",
  direccion_ciudad: "",
  direccion_provincia: "",
  direccion_pais: "España",
  email: "",
  telefono: "",
  telefono_tutor: "",
};

function leerFoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la foto"));
    reader.onload = () => {
      const imagen = new Image();
      imagen.onerror = () => reject(new Error("La foto no es válida"));
      imagen.onload = () => {
        const maximo = 900;
        const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height));
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.max(1, Math.round(imagen.width * escala));
        lienzo.height = Math.max(1, Math.round(imagen.height * escala));
        lienzo.getContext("2d")?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
        resolve(lienzo.toDataURL("image/jpeg", 0.9));
      };
      imagen.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const CAMPOS = [
  { key: "nombre", label: "Nombre" },
  { key: "primer_apellido", label: "Primer apellido" },
  { key: "segundo_apellido", label: "Segundo apellido" },
  { key: "dni", label: "DNI", placeholder: "12345678A" },
  { key: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date" },
  { key: "direccion_calle", label: "Calle" },
  { key: "direccion_numero", label: "Número" },
  { key: "direccion_piso", label: "Piso (opcional)" },
  { key: "direccion_puerta", label: "Puerta (opcional)" },
  { key: "direccion_codigo_postal", label: "Código postal", placeholder: "01010" },
  { key: "direccion_ciudad", label: "Ciudad" },
  { key: "direccion_provincia", label: "Provincia" },
  { key: "direccion_pais", label: "País" },
  { key: "email", label: "Email", type: "email" },
  { key: "telefono", label: "Teléfono", type: "tel" },
  { key: "telefono_tutor", label: "Teléfono del tutor (opcional)", type: "tel" },
] as const;

const SociosTab = ({ socios, onRefresh }: SociosTabProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [abierto, setAbierto] = useState(true);
  const [form, setForm] = useState(INITIAL);
  const [numero, setNumero] = useState("");
  const [cuotaId, setCuotaId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [carnet, setCarnet] = useState<{ nombre: string; apellidos: string; numero: string; cuota: string; foto: string | null } | null>(null);

  const ocupados = useMemo(() => new Set(socios.map((s) => Number(s.numero_socio))), [socios]);
  const libres = useMemo(
    () => Array.from({ length: NUMEROS_SOCIO_RESERVADOS }, (_, i) => i + 1).filter((n) => !ocupados.has(n)),
    [ocupados],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return socios;
    return socios.filter((s) =>
      `${s.numero_socio} ${s.nombre} ${s.primer_apellido} ${s.segundo_apellido} ${s.dni} ${s.email}`
        .toLowerCase()
        .includes(q),
    );
  }, [socios, search]);

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = schema.safeParse({ ...form, dni: form.dni.trim().toUpperCase() });
    const nextErrors: Record<string, string> = {};
    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      });
    }
    const numeroElegido = Number(numero);
    if (!libres.includes(numeroElegido)) nextErrors.numero = "Elige un número libre del 1 al 25";
    const cuota = cuotaPorId(cuotaId);
    if (!cuota) nextErrors.cuota = "Elige la cuota";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!cuota) return;

    setGuardando(true);
    try {
      const creado = await sociosService.createConNumero({
        numero_socio: numeroElegido,
        nombre: form.nombre.trim(),
        primer_apellido: form.primer_apellido.trim(),
        segundo_apellido: form.segundo_apellido.trim(),
        dni: form.dni.trim().toUpperCase(),
        fecha_nacimiento: form.fecha_nacimiento,
        direccion_calle: form.direccion_calle.trim(),
        direccion_numero: form.direccion_numero.trim(),
        direccion_piso: form.direccion_piso.trim() || undefined,
        direccion_puerta: form.direccion_puerta.trim() || undefined,
        direccion_codigo_postal: form.direccion_codigo_postal.trim(),
        direccion_ciudad: form.direccion_ciudad.trim(),
        direccion_provincia: form.direccion_provincia.trim(),
        direccion_pais: form.direccion_pais.trim(),
        email: form.email.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        telefono_tutor: form.telefono_tutor.trim() || undefined,
      });
      const nombre = creado.nombre;
      const apellidos = `${creado.primer_apellido} ${creado.segundo_apellido}`.trim();
      const numeroTexto = String(creado.numero_socio);
      const direccion = [
        creado.direccion_calle,
        creado.direccion_numero,
        creado.direccion_piso && `piso ${creado.direccion_piso}`,
        creado.direccion_puerta && `puerta ${creado.direccion_puerta}`,
        `${creado.direccion_codigo_postal} ${creado.direccion_ciudad}`,
        creado.direccion_provincia,
      ].filter(Boolean).join(", ");
      try {
        await notifyNewSocio({
          numero: numeroTexto,
          nombre,
          apellidos,
          dni: creado.dni,
          fechaNacimiento: creado.fecha_nacimiento,
          direccion,
          email: creado.email,
          telefono: creado.telefono,
          telefonoTutor: creado.telefono_tutor || undefined,
          cuota: textoCuota(cuota.id),
          origen: "Panel de administración",
        });
      } catch (mailError: any) {
        toast({
          title: "Socio guardado, email pendiente",
          description: mailError.message || "El alta está hecha, pero el aviso no ha salido por email.",
          variant: "destructive",
        });
      }
      setCarnet({ nombre, apellidos, numero: numeroTexto, cuota: textoCuota(cuota.id), foto });
      setForm(INITIAL);
      setNumero("");
      setCuotaId("");
      setFoto(null);
      setErrors({});
      onRefresh();
    } catch (err: any) {
      toast({ title: "No se pudo guardar el socio", description: err.message, variant: "destructive" });
    } finally {
      setGuardando(false);
    }
  };

  const elegirFoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Elige una imagen", variant: "destructive" });
      return;
    }
    try {
      setFoto(await leerFoto(file));
    } catch (err: any) {
      toast({ title: "No se pudo usar la foto", description: err.message, variant: "destructive" });
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar socio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button type="button" onClick={() => setAbierto((v) => !v)} className="bg-secondary text-secondary-foreground font-heading uppercase tracking-wider">
          {abierto ? "Cerrar alta" : "Añadir socio 1-25"}
        </Button>
      </div>

      {abierto && (
        <form onSubmit={guardar} className="mb-6 rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-xl uppercase tracking-wide text-primary">Meter socios del 1 al 25</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Elige un número del 1 al 25, la cuota y, si quieres, la foto del carnet. Quedan {libres.length} números libres.
          </p>
          <div className="mt-4">
            <Label className="text-sm font-semibold text-primary">Número de socio</Label>
            <div className={`mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10 ${errors.numero ? "rounded-md ring-2 ring-destructive" : ""}`}>
              {Array.from({ length: NUMEROS_SOCIO_RESERVADOS }, (_, i) => i + 1).map((n) => {
                const ocupado = ocupados.has(n);
                const elegido = numero === String(n);
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={ocupado}
                    onClick={() => {
                      setNumero(String(n));
                      setErrors((prev) => {
                        if (!prev.numero) return prev;
                        const next = { ...prev };
                        delete next.numero;
                        return next;
                      });
                    }}
                    className={`h-10 rounded-md border font-heading text-sm ${
                      elegido
                        ? "border-primary bg-primary text-primary-foreground"
                        : ocupado
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through"
                          : "border-input bg-background text-primary hover:border-primary"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {errors.numero && <p className="mt-1 text-xs text-destructive">{errors.numero}</p>}
            <p className="mt-2 text-xs text-muted-foreground">Los tachados ya están asignados.</p>
          </div>
          {libres.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-secondary">Los 25 números reservados ya están asignados.</p>
          ) : (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="text-sm font-semibold text-primary">Cuota</Label>
                  <select
                    value={cuotaId}
                    onChange={(e) => setCuotaId(e.target.value)}
                    className={`mt-1 flex h-10 w-full rounded-md border bg-background px-3 text-sm ${errors.cuota ? "border-destructive" : "border-input"}`}
                  >
                    <option value="">Elegir</option>
                    {CUOTAS_SOCIO.map((cuota) => (
                      <option key={cuota.id} value={cuota.id}>{cuota.nombre}{cuota.personas ? ` · ${cuota.personas}` : ""} · {cuota.precio} €</option>
                    ))}
                  </select>
                  {errors.cuota && <p className="mt-1 text-xs text-destructive">{errors.cuota}</p>}
                </div>
                {CAMPOS.map((field) => (
                  <div key={field.key} className={field.key === "direccion_calle" ? "sm:col-span-2" : ""}>
                    <Label className="text-sm font-semibold text-primary">{field.label}</Label>
                    <Input
                      type={"type" in field ? field.type : "text"}
                      placeholder={"placeholder" in field ? field.placeholder : ""}
                      value={form[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className={errors[field.key] ? "border-destructive" : ""}
                    />
                    {errors[field.key] && <p className="mt-1 text-xs text-destructive">{errors[field.key]}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-dashed border-border p-4">
                <Label className="text-sm font-semibold text-primary">Foto (opcional)</Label>
                <p className="mt-1 text-xs text-muted-foreground">Si no eliges foto, el carnet llevará la oca del club.</p>
                <div className="mt-3 flex items-center gap-4">
                  {foto ? (
                    <img src={foto} alt="Foto para el carnet" className="h-24 w-24 object-cover border-2 border-primary" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center bg-primary text-[10px] font-heading uppercase tracking-wider text-primary-foreground">
                      Oca
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 font-heading text-sm uppercase tracking-wider text-primary-foreground">
                      Elegir foto
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          void elegirFoto(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {foto && (
                      <button type="button" onClick={() => setFoto(null)} className="text-left text-xs font-semibold text-secondary">
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={guardando} className="mt-6 bg-primary font-heading uppercase tracking-wider text-primary-foreground">
                {guardando ? "Guardando..." : "Guardar socio"}
              </Button>
            </>
          )}
        </form>
      )}

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

      {carnet && (
        <CarnetSocio
          nombre={carnet.nombre}
          apellidos={carnet.apellidos}
          numero={carnet.numero}
          foto={carnet.foto}
          cuota={carnet.cuota}
          onClose={() => setCarnet(null)}
        />
      )}
    </>
  );
};

export default SociosTab;
