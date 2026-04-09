import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fichasService, supabase } from "@/lib/supabase";
import type { FichaJugador, Posicion, Categoria, EstadoJugador } from "@/types";

const POSICIONES: Posicion[] = ["Portero", "Defensa Central", "Lateral Derecho", "Lateral Izquierdo", "Mediocentro", "Mediapunta", "Extremo Derecho", "Extremo Izquierdo", "Delantero Centro"];
const CATEGORIAS: Categoria[] = ["Prebenjamín", "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Senior", "Veteranos"];

interface PlayerSheetProps {
  player: FichaJugador | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const PlayerSheet = ({ player, open, onClose, onSaved }: PlayerSheetProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Partial<FichaJugador>>({});

  useEffect(() => {
    if (player) {
      setForm({ ...player });
    }
  }, [player]);

  const set = (key: string, val: string | number) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !player) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${player.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos-jugadores")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("fotos-jugadores")
        .getPublicUrl(path);

      const foto_url = urlData.publicUrl;
      set("foto_url", foto_url);
      toast({ title: "Foto subida correctamente" });
    } catch (err: any) {
      toast({ title: "Error al subir foto", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!player) return;
    setSaving(true);
    try {
      const { id, created_at, ...updates } = form as FichaJugador;
      await fichasService.update(player.id, updates);
      toast({ title: "Jugador actualizado" });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!player) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl uppercase text-primary">
            Editar Jugador
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={form.foto_url} />
              <AvatarFallback className="bg-primary text-primary-foreground font-heading text-xl">
                {form.nombre?.[0]}{form.apellidos?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary transition-colors">
                <Camera size={16} />
                {uploading ? "Subiendo..." : "Cambiar foto"}
              </Label>
              <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Nombre</Label>
              <Input value={form.nombre || ""} onChange={(e) => set("nombre", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Apellidos</Label>
              <Input value={form.apellidos || ""} onChange={(e) => set("apellidos", e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">DNI</Label>
            <Input value={form.dni || ""} onChange={(e) => set("dni", e.target.value)} />
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Email</Label>
            <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Teléfono</Label>
              <Input value={form.telefono || ""} onChange={(e) => set("telefono", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">F. Nacimiento</Label>
              <Input type="date" value={form.fecha_nacimiento || ""} onChange={(e) => set("fecha_nacimiento", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Teléfono Padre</Label>
              <Input value={form.telefono_padre || ""} onChange={(e) => set("telefono_padre", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Teléfono Madre</Label>
              <Input value={form.telefono_madre || ""} onChange={(e) => set("telefono_madre", e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Dirección</Label>
            <Input value={form.direccion || ""} onChange={(e) => set("direccion", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Peso (kg)</Label>
              <Input type="number" value={form.peso ?? ""} onChange={(e) => set("peso", Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Altura (cm)</Label>
              <Input type="number" value={form.altura ?? ""} onChange={(e) => set("altura", Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Posición</Label>
              <Select value={form.posicion || ""} onValueChange={(v) => set("posicion", v)}>
                <SelectTrigger><SelectValue placeholder="Posición" /></SelectTrigger>
                <SelectContent>
                  {POSICIONES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Categoría</Label>
              <Select value={form.categoria || ""} onValueChange={(v) => set("categoria", v)}>
                <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Estado</Label>
            <Select value={form.estado || "Activo"} onValueChange={(v) => set("estado", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo">✅ Activo</SelectItem>
                <SelectItem value="Baja">❌ Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Observaciones del Entrenador</Label>
            <Textarea
              value={form.observaciones_entrenador || ""}
              onChange={(e) => set("observaciones_entrenador", e.target.value)}
              className="min-h-[100px]"
              placeholder="Notas del entrenador..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-secondary text-secondary-foreground hover:bg-red-club-light font-heading uppercase"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlayerSheet;
