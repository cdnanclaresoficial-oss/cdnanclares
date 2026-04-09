import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { fichasService, supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Check, Camera } from "lucide-react";
import type { Posicion, Categoria } from "@/types";
import { z } from "zod";

const POSICIONES: Posicion[] = ["Portero", "Defensa Central", "Lateral Derecho", "Lateral Izquierdo", "Mediocentro", "Mediapunta", "Extremo Derecho", "Extremo Izquierdo", "Delantero Centro"];
const CATEGORIAS: Categoria[] = ["Prebenjamín", "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Senior", "Veteranos"];

const steps = ["Datos Personales", "Datos Físicos", "Club", "Confirmación"];

const fichaSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido").max(50),
  apellidos: z.string().trim().min(1, "Requerido").max(100),
  dni: z.string().regex(/^\d{8}[A-Z]$/, "DNI inválido"),
  email: z.string().trim().email("Email inválido"),
  telefono: z.string().trim().min(6, "Teléfono inválido"),
  direccion: z.string().trim().min(1, "Requerido"),
  fecha_nacimiento: z.string().min(1, "Requerido"),
  peso: z.number().min(20).max(200),
  altura: z.number().min(100).max(230),
  posicion: z.string().min(1, "Selecciona posición"),
  categoria: z.string().min(1, "Selecciona categoría"),
});

/* Stable field component — defined outside to avoid re-creation */
const FormField = ({
  k,
  label,
  type = "text",
  placeholder = "",
  value,
  error,
  onChange,
}: {
  k: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (key: string, val: string) => void;
}) => (
  <div>
    <Label className="text-sm font-semibold text-primary">{label}</Label>
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(k, e.target.value)}
      className={error ? "border-destructive" : ""}
    />
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const INITIAL_FORM = {
  nombre: "", apellidos: "", dni: "", email: "", telefono: "", direccion: "",
  telefono_padre: "", telefono_madre: "",
  fecha_nacimiento: "", peso: "", altura: "", posicion: "", categoria: "", observaciones: "",
  foto_url: "",
};

const Inscripcion = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(INITIAL_FORM);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `inscripcion_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("fotos-jugadores")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("fotos-jugadores")
        .getPublicUrl(path);
      set("foto_url", urlData.publicUrl);
      toast({ title: "Foto subida correctamente" });
    } catch (err: any) {
      toast({ title: "Error al subir foto", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const set = useCallback((key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldsPerStep: string[][] = [
      ["nombre", "apellidos", "dni", "email", "telefono", "direccion", "fecha_nacimiento"],
      ["peso", "altura"],
      ["posicion", "categoria"],
      [],
    ];
    const fields = fieldsPerStep[step];
    const dataToValidate: any = { ...form, peso: Number(form.peso) || 0, altura: Number(form.altura) || 0 };
    const result = fichaSchema.safeParse(dataToValidate);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (fields.includes(key)) newErrors[key] = issue.message;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => { if (validateStep()) setStep(step + 1); };
  const prev = () => setStep(step - 1);

  const handleSubmit = async () => {
    try {
      await fichasService.create({
        nombre: form.nombre,
        apellidos: form.apellidos,
        dni: form.dni,
        email: form.email,
        telefono: form.telefono,
        telefono_padre: form.telefono_padre || "",
        telefono_madre: form.telefono_madre || "",
        direccion: form.direccion,
        fecha_nacimiento: form.fecha_nacimiento,
        peso: Number(form.peso),
        altura: Number(form.altura),
        posicion: form.posicion as any,
        categoria: form.categoria as any,
        observaciones_entrenador: form.observaciones || "",
        estado: "Activo",
        ...(form.foto_url ? { foto_url: form.foto_url } : {}),
      });
      toast({ title: "✅ Inscripción enviada", description: "Recibirás confirmación por email." });
      setStep(0);
      setForm(INITIAL_FORM);
    } catch (err: any) {
      toast({ title: "Error al enviar", description: err.message || "Inténtalo de nuevo.", variant: "destructive" });
    }
  };

  return (
  <main className="pt-32 md:pt-40 min-h-screen bg-background">
      <section className="gradient-navy py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground uppercase tracking-tight">Inscripción de Jugadores</h1>
          <p className="text-primary-foreground/60 mt-2">Rellena tu ficha para unirte al club</p>
          <p className="text-primary-foreground/60 mt-1 text-sm md:text-base max-w-2xl mx-auto">
            El formulario tarda menos de 5 minutos. Si tienes dudas, puedes escribirnos al correo del club o en la propia sede.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm ${
                i < step ? "bg-secondary text-secondary-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check size={18} /> : i + 1}
              </div>
              <span className={`hidden sm:block ml-2 text-xs font-semibold uppercase ${i <= step ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${i < step ? "bg-secondary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {step === 0 && (
            <div className="grid gap-4">
              {/* Photo upload */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={form.foto_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-heading text-xl">
                    {form.nombre?.[0] || "?"}{form.apellidos?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="photo-inscripcion" className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary transition-colors">
                    <Camera size={16} />
                    {uploading ? "Subiendo..." : "Subir foto"}
                  </Label>
                  <input id="photo-inscripcion" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  <p className="text-xs text-muted-foreground mt-1">Opcional</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField k="nombre" label="Nombre" value={form.nombre} error={errors.nombre} onChange={set} />
                <FormField k="apellidos" label="Apellidos" value={form.apellidos} error={errors.apellidos} onChange={set} />
              </div>
              <FormField k="dni" label="DNI" placeholder="12345678A" value={form.dni} error={errors.dni} onChange={set} />
              <FormField k="email" label="Email" type="email" value={form.email} error={errors.email} onChange={set} />
              <FormField k="telefono" label="Teléfono" type="tel" value={form.telefono} error={errors.telefono} onChange={set} />
              <FormField k="telefono_padre" label="Teléfono del padre (opcional)" type="tel" value={form.telefono_padre} error={errors.telefono_padre} onChange={set} />
              <FormField k="telefono_madre" label="Teléfono de la madre (opcional)" type="tel" value={form.telefono_madre} error={errors.telefono_madre} onChange={set} />
              <FormField k="direccion" label="Dirección" value={form.direccion} error={errors.direccion} onChange={set} />
              <FormField k="fecha_nacimiento" label="Fecha de Nacimiento" type="date" value={form.fecha_nacimiento} error={errors.fecha_nacimiento} onChange={set} />
            </div>
          )}

          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField k="peso" label="Peso (kg)" type="number" placeholder="70" value={form.peso} error={errors.peso} onChange={set} />
              <FormField k="altura" label="Altura (cm)" type="number" placeholder="175" value={form.altura} error={errors.altura} onChange={set} />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div>
                <Label className="text-sm font-semibold text-primary">Posición</Label>
                <Select value={form.posicion} onValueChange={(v) => set("posicion", v)}>
                  <SelectTrigger className={errors.posicion ? "border-destructive" : ""}><SelectValue placeholder="Selecciona posición" /></SelectTrigger>
                  <SelectContent>{POSICIONES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                {errors.posicion && <p className="text-xs text-destructive mt-1">{errors.posicion}</p>}
              </div>
              <div>
                <Label className="text-sm font-semibold text-primary">Categoría</Label>
                <Select value={form.categoria} onValueChange={(v) => set("categoria", v)}>
                  <SelectTrigger className={errors.categoria ? "border-destructive" : ""}><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                {errors.categoria && <p className="text-xs text-destructive mt-1">{errors.categoria}</p>}
              </div>
              <div>
                <Label className="text-sm font-semibold text-primary">Observaciones (opcional)</Label>
                <Textarea value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} placeholder="Lesiones previas, experiencia..." className="min-h-[100px]" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-heading text-xl font-bold text-primary uppercase">Resumen de Inscripción</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  ["Nombre", `${form.nombre} ${form.apellidos}`],
                  ["DNI", form.dni],
                  ["Email", form.email],
                  ["Teléfono", form.telefono],
                  ["Tel. Padre", form.telefono_padre || "No indicado"],
                  ["Tel. Madre", form.telefono_madre || "No indicado"],
                  ["Dirección", form.direccion],
                  ["F. Nacimiento", form.fecha_nacimiento],
                  ["Peso", `${form.peso} kg`],
                  ["Altura", `${form.altura} cm`],
                  ["Posición", form.posicion],
                  ["Categoría", form.categoria],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between border-b border-border pb-2">
                    <span className="font-semibold text-primary">{label}</span>
                    <span className="text-muted-foreground">{val}</span>
                  </div>
                ))}
              </div>
              {form.observaciones && (
                <div>
                  <span className="font-semibold text-primary text-sm">Observaciones:</span>
                  <p className="text-muted-foreground text-sm mt-1">{form.observaciones}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <Button variant="outline" onClick={prev} className="font-heading uppercase tracking-wider">Anterior</Button>
            ) : <div />}
            {step < steps.length - 1 ? (
              <Button onClick={next} className="bg-primary text-primary-foreground hover:bg-navy-light font-heading uppercase tracking-wider">Siguiente</Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-secondary text-secondary-foreground hover:bg-red-club-light font-heading uppercase tracking-wider">Enviar Inscripción</Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Inscripcion;
