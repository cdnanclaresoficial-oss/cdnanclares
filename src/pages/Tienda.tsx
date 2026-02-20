import { useState } from "react";
import { ShoppingCart, Plus, Minus, X } from "lucide-react";
import { pedidosService } from "@/lib/supabase";
import PublicChat from "@/components/PublicChat";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Producto, ArticuloPedido, ClienteDatos } from "@/types";
import { z } from "zod";

const PRODUCTOS: Producto[] = [
  { id: "1", nombre: "Camiseta 1ª Equipación", descripcion: "Camiseta oficial azulgrana temporada 24/25", precio: 45, imagen: "", tallas: ["XS", "S", "M", "L", "XL", "XXL"], categoria: "Camisetas" },
  { id: "2", nombre: "Camiseta 2ª Equipación", descripcion: "Camiseta visitante blanca", precio: 45, imagen: "", tallas: ["XS", "S", "M", "L", "XL", "XXL"], categoria: "Camisetas" },
  { id: "3", nombre: "Pantalón Oficial", descripcion: "Pantalón corto de competición", precio: 25, imagen: "", tallas: ["XS", "S", "M", "L", "XL"], categoria: "Pantalones" },
  { id: "4", nombre: "Chándal Completo", descripcion: "Chándal de entrenamiento con escudo", precio: 65, imagen: "", tallas: ["S", "M", "L", "XL", "XXL"], categoria: "Chándales" },
  { id: "5", nombre: "Sudadera Club", descripcion: "Sudadera con capucha bordada", precio: 40, imagen: "", tallas: ["S", "M", "L", "XL"], categoria: "Sudaderas" },
  { id: "6", nombre: "Medias Oficiales", descripcion: "Medias azulgranas de competición", precio: 12, imagen: "", tallas: ["Junior", "Senior"], categoria: "Accesorios" },
];

const dniSchema = z.string().regex(/^\d{8}[A-Z]$/, "DNI inválido (8 dígitos + letra)");
const emailSchema = z.string().email("Email inválido");

const Tienda = () => {
  const { toast } = useToast();
  const [carrito, setCarrito] = useState<ArticuloPedido[]>([]);
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<Record<string, string>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState<ClienteDatos>({ nombre: "", apellidos: "", dni: "", email: "", telefono: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addToCart = (p: Producto) => {
    const talla = tallasSeleccionadas[p.id];
    if (!talla) {
      toast({ title: "Selecciona una talla", variant: "destructive" });
      return;
    }
    const existing = carrito.find((i) => i.id === p.id && i.talla === talla);
    if (existing) {
      setCarrito(carrito.map((i) => (i.id === p.id && i.talla === talla ? { ...i, cantidad: i.cantidad + 1 } : i)));
    } else {
      setCarrito([...carrito, { id: p.id, nombre: p.nombre, talla, cantidad: 1, precio: p.precio }]);
    }
    toast({ title: `${p.nombre} (${talla}) añadido` });
  };

  const updateQty = (idx: number, delta: number) => {
    setCarrito((prev) => prev.map((item, i) => (i === idx ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item)));
  };

  const removeItem = (idx: number) => setCarrito((prev) => prev.filter((_, i) => i !== idx));
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const handleSubmitOrder = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "Requerido";
    if (!formData.apellidos.trim()) newErrors.apellidos = "Requerido";
    const dniResult = dniSchema.safeParse(formData.dni);
    if (!dniResult.success) newErrors.dni = dniResult.error.errors[0].message;
    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    if (!formData.telefono.trim()) newErrors.telefono = "Requerido";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await pedidosService.create({
        cliente_datos: formData,
        articulos_pedido: carrito,
        estado_pedido: "Pendiente",
        total_estimado: total,
      });
      // Email enviado automáticamente por Supabase Database Webhook
      toast({ title: "✅ Pedido enviado", description: "Te enviaremos confirmación por email." });
      setCarrito([]);
      setShowCheckout(false);
      setFormData({ nombre: "", apellidos: "", dni: "", email: "", telefono: "" });
    } catch (err: any) {
      toast({ title: "Error al enviar pedido", description: err.message || "Inténtalo de nuevo.", variant: "destructive" });
    }
  };

  return (
    <main className="pt-20 min-h-screen bg-background">
      {/* Header */}
      <section className="gradient-navy py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground uppercase tracking-tight">Tienda Oficial</h1>
          <p className="text-primary-foreground/60 mt-2">Equipaciones y merchandising del C.D. Nanclares</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {/* Cart summary bar */}
        {carrito.length > 0 && !showCheckout && (
          <div className="mb-8 p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <ShoppingCart className="text-secondary" size={24} />
              <span className="font-heading font-semibold text-primary">{carrito.length} artículo(s) — {total.toFixed(2)} €</span>
            </div>
            <Button onClick={() => setShowCheckout(true)} className="bg-secondary text-secondary-foreground hover:bg-red-club-light font-heading uppercase tracking-wider">
              Finalizar Pedido
            </Button>
          </div>
        )}

        {showCheckout ? (
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => setShowCheckout(false)} className="mb-6 text-muted-foreground">
              ← Seguir comprando
            </Button>
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <h2 className="section-title text-2xl mb-6">Datos del Pedido</h2>

              {/* Order summary */}
              <div className="mb-6 space-y-2 border-b border-border pb-6">
                {carrito.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                      <span>{item.nombre} ({item.talla})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(idx, -1)} className="p-1 rounded bg-muted hover:bg-muted/80"><Minus size={12} /></button>
                      <span className="w-6 text-center font-semibold">{item.cantidad}</span>
                      <button onClick={() => updateQty(idx, 1)} className="p-1 rounded bg-muted hover:bg-muted/80"><Plus size={12} /></button>
                      <span className="w-20 text-right font-semibold">{(item.precio * item.cantidad).toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-heading text-lg font-bold text-primary pt-4">
                  <span>Total</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
              </div>

              {/* Form */}
              <div className="grid gap-4">
                {[
                  { key: "nombre", label: "Nombre", type: "text" },
                  { key: "apellidos", label: "Apellidos", type: "text" },
                  { key: "dni", label: "DNI", type: "text", placeholder: "12345678A" },
                  { key: "email", label: "Email", type: "email" },
                  { key: "telefono", label: "Teléfono", type: "tel" },
                ].map((field) => (
                  <div key={field.key}>
                    <Label className="text-sm font-semibold text-primary">{field.label}</Label>
                    <Input
                      type={field.type}
                      placeholder={field.placeholder || ""}
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className={errors[field.key] ? "border-destructive" : ""}
                    />
                    {errors[field.key] && <p className="text-xs text-destructive mt-1">{errors[field.key]}</p>}
                  </div>
                ))}
                <Button onClick={handleSubmitOrder} className="w-full bg-secondary text-secondary-foreground hover:bg-red-club-light font-heading uppercase tracking-wider text-lg py-6 mt-4">
                  Confirmar Pedido
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTOS.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="h-48 gradient-navy flex items-center justify-center">
                  <span className="text-6xl opacity-30 group-hover:scale-110 transition-transform">⚽</span>
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold text-primary uppercase">{p.nombre}</h3>
                  <p className="text-muted-foreground text-sm mt-1 mb-3">{p.descripcion}</p>
                  <p className="font-heading text-2xl font-bold text-secondary mb-4">{p.precio.toFixed(2)} €</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.tallas.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTallasSeleccionadas({ ...tallasSeleccionadas, [p.id]: t })}
                        className={`px-3 py-1 rounded-md text-xs font-semibold uppercase border transition-colors ${
                          tallasSeleccionadas[p.id] === t
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <Button onClick={() => addToCart(p)} className="w-full bg-primary text-primary-foreground hover:bg-navy-light font-heading uppercase tracking-wider">
                    Añadir al Carrito
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PublicChat />
    </main>
  );
};

export default Tienda;
