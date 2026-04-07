import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sociosService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const socioSchema = z.object({
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

const INITIAL_FORM = {
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

const HazteSocio = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = socioSchema.safeParse(form);
    if (!validation.success) {
      const nextErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }
    const age = calculateAge(form.fecha_nacimiento);
    if (age < 18 && !form.telefono_tutor.trim()) {
      setErrors((prev) => ({ ...prev, telefono_tutor: "Obligatorio para menores de edad" }));
      return;
    }

    setLoading(true);
    try {
      const numeroSocio = await sociosService.create({
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

      toast({
        title: "Alta completada",
        description: `Bienvenido/a. Tu número de socio es el ${numeroSocio}.`,
      });
      setForm(INITIAL_FORM);
      setErrors({});
    } catch (err: any) {
      toast({
        title: "Error al registrar socio",
        description: err.message || "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
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
  ];

  return (
    <main className="pt-32 md:pt-40 min-h-screen bg-background">
      <section className="gradient-navy py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground uppercase tracking-tight">
            Hazte Socio
          </h1>
          <p className="text-primary-foreground/60 mt-2">
            Únete al C.D. Nanclares y forma parte del club.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key} className={field.key === "direccion_calle" ? "sm:col-span-2" : ""}>
                <Label className="text-sm font-semibold text-primary">{field.label}</Label>
                <Input
                  type={field.type || "text"}
                  placeholder={field.placeholder || ""}
                  value={(form as Record<string, string>)[field.key]}
                  onChange={(e) => setField(field.key, e.target.value)}
                  className={errors[field.key] ? "border-destructive" : ""}
                />
                {errors[field.key] && <p className="text-xs text-destructive mt-1">{errors[field.key]}</p>}
              </div>
            ))}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-secondary text-secondary-foreground hover:bg-red-club-light font-heading uppercase tracking-wider"
          >
            {loading ? "Enviando..." : "Enviar alta de socio"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default HazteSocio;
