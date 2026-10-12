import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { z } from "zod";
import { pedidosService } from "@/lib/supabase";
import { notifyNewOrder } from "@/services/notifications";
import StoreChat from "@/components/StoreChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CATALOGO, CATEGORIAS_TIENDA, TALLAS_MEDIAS, precioTarifa } from "@/data/catalogo";
import type { ArticuloPedido, ClienteDatos, Producto } from "@/types";

const dniSchema = z.string().regex(/^\d{8}[A-Z]$/, "DNI inválido (8 dígitos + letra)");
const emailSchema = z.string().email("Email inválido");

const euros = (valor: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(valor);

const leerCarrito = (): ArticuloPedido[] => {
  try {
    const raw = sessionStorage.getItem("cdn-carrito");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === "string" && typeof item.precio === "number");
  } catch {
    return [];
  }
};

const Tienda = () => {
  const { toast } = useToast();
  const [carrito, setCarrito] = useState<ArticuloPedido[]>(leerCarrito);
  const [esSocio, setEsSocio] = useState(() => sessionStorage.getItem("cdn-socio") === "1");
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS_TIENDA)[number]>("Todas");
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<Record<string, string>>({});
  const [mediasSeleccionadas, setMediasSeleccionadas] = useState<Record<string, string>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", apellidos: "", dni: "", email: "", telefono: "" });
  const [numeroSocio, setNumeroSocio] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    sessionStorage.setItem("cdn-carrito", JSON.stringify(carrito));
  }, [carrito]);

  useEffect(() => {
    sessionStorage.setItem("cdn-socio", esSocio ? "1" : "0");
  }, [esSocio]);

  const cambiarSocio = (valor: boolean) => {
    setEsSocio(valor);
    setCarrito((prev) =>
      prev.map((item) => {
        const producto = CATALOGO.find((p) => p.id === item.id);
        if (!producto) return item;
        return { ...item, precio: precioTarifa(producto, valor) };
      }),
    );
  };

  const addToCart = (producto: Producto) => {
    const tallaRopa = producto.tallas.length === 1 ? producto.tallas[0] : tallasSeleccionadas[producto.id];
    if (!tallaRopa) {
      toast({ title: "Selecciona una talla", variant: "destructive" });
      return;
    }
    let talla = tallaRopa;
    if (producto.seleccionarMedias) {
      const medias = mediasSeleccionadas[producto.id];
      if (!medias) {
        toast({ title: "Selecciona la talla de las medias", variant: "destructive" });
        return;
      }
      talla = `${tallaRopa} · medias ${medias}`;
    }
    const precio = precioTarifa(producto, esSocio);
    setCarrito((prev) => {
      const existing = prev.find((i) => i.id === producto.id && i.talla === talla);
      if (existing) {
        return prev.map((i) => (i.id === producto.id && i.talla === talla ? { ...i, cantidad: i.cantidad + 1, precio } : i));
      }
      return [...prev, { id: producto.id, nombre: producto.nombre, talla, cantidad: 1, precio }];
    });
    toast({ title: `${producto.nombre} añadido`, description: `Talla ${talla}` });
  };

  const updateQty = (idx: number, delta: number) => {
    setCarrito((prev) => prev.map((item, i) => (i === idx ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item)));
  };

  const removeItem = (idx: number) => setCarrito((prev) => prev.filter((_, i) => i !== idx));

  const unidades = carrito.reduce((s, i) => s + i.cantidad, 0);
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const pack = CATALOGO.find((p) => p.id === "pack-club")!;
  const productos = useMemo(() => {
    const resto = CATALOGO.filter((p) => p.id !== "pack-club");
    if (categoria === "Todas") return resto;
    return resto.filter((p) => p.categoria === categoria);
  }, [categoria]);
  const mostrarPack = categoria === "Todas" || categoria === "Pack";

  const handleSubmitOrder = async () => {
    if (carrito.length === 0 || enviando) return;
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "Requerido";
    if (!formData.apellidos.trim()) newErrors.apellidos = "Requerido";
    const dniResult = dniSchema.safeParse(formData.dni.trim().toUpperCase());
    if (!dniResult.success) newErrors.dni = dniResult.error.errors[0].message;
    const emailResult = emailSchema.safeParse(formData.email.trim());
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    if (formData.telefono.replace(/\D/g, "").length < 9) newErrors.telefono = "Teléfono inválido";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const cliente: ClienteDatos = {
      nombre: formData.nombre.trim(),
      apellidos: formData.apellidos.trim(),
      dni: formData.dni.trim().toUpperCase(),
      email: formData.email.trim(),
      telefono: formData.telefono.trim(),
      es_socio: esSocio,
      numero_socio: esSocio ? numeroSocio.trim() : "",
      observaciones: observaciones.trim(),
    };

    setEnviando(true);
    let guardado = false;
    let avisado = false;
    try {
      await pedidosService.create({
        cliente_datos: cliente,
        articulos_pedido: carrito,
        estado_pedido: "Pendiente",
        total_estimado: total,
      });
      guardado = true;
    } catch (err) {
      console.error(err);
    }
    try {
      await notifyNewOrder({ cliente, articulos: carrito, total });
      avisado = true;
    } catch (err) {
      console.error(err);
    }
    setEnviando(false);

    if (!guardado && !avisado) {
      toast({
        title: "No se ha podido enviar el pedido",
        description: "Inténtalo de nuevo en unos minutos.",
        variant: "destructive",
      });
      return;
    }

    setCarrito([]);
    setShowCheckout(false);
    setFormData({ nombre: "", apellidos: "", dni: "", email: "", telefono: "" });
    setNumeroSocio("");
    setObservaciones("");

    if (avisado) {
      toast({
        title: "Pedido enviado",
        description: "El club ya tiene tu pedido. Te avisaremos por email cuando puedas recogerlo.",
      });
      return;
    }

    toast({
      title: "Pedido registrado",
      description: "Ha quedado guardado en el club. Si no recibes confirmación, escribe a cdnanclares.oficial@gmail.com.",
    });
  };

  return (
    <main className="pt-32 md:pt-40 min-h-screen bg-background pb-28">
      <section className="gradient-navy py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-secondary font-heading uppercase tracking-[0.25em] text-sm mb-2">Temporada oficial</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground uppercase tracking-tight">
            Tienda Oficial
          </h1>
          <p className="text-primary-foreground/70 mt-3 max-w-2xl mx-auto">
            Equipación Joma del C.D. Nanclares. Elige tu talla, confirma el pedido y recógelo en el club.
            El pago se hace en la recogida.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-heading text-lg font-bold text-primary uppercase">Tarifa del pedido</p>
            <p className="text-sm text-muted-foreground">
              {esSocio ? "Precios de socio aplicados a todo el carrito." : "Precios de no socio. Activa la tarifa si eres socio."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${esSocio ? "text-muted-foreground" : "text-secondary"}`}>No socio</span>
            <Switch checked={esSocio} onCheckedChange={cambiarSocio} aria-label="Soy socio" />
            <span className={`text-sm font-semibold ${esSocio ? "text-primary" : "text-muted-foreground"}`}>Socio</span>
          </div>
        </div>

        {showCheckout ? (
          <Checkout
            carrito={carrito}
            total={total}
            esSocio={esSocio}
            formData={formData}
            errors={errors}
            numeroSocio={numeroSocio}
            observaciones={observaciones}
            enviando={enviando}
            onBack={() => setShowCheckout(false)}
            onChange={(key, value) => setFormData({ ...formData, [key]: value })}
            onNumeroSocio={setNumeroSocio}
            onObservaciones={setObservaciones}
            onQty={updateQty}
            onRemove={removeItem}
            onSubmit={handleSubmitOrder}
          />
        ) : (
          <>
            <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
              {CATEGORIAS_TIENDA.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoria(cat)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-heading uppercase tracking-wider border transition-colors ${
                    categoria === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {mostrarPack && (
              <PackCard
                producto={pack}
                esSocio={esSocio}
                talla={tallasSeleccionadas[pack.id]}
                medias={mediasSeleccionadas[pack.id]}
                onTalla={(talla) => setTallasSeleccionadas({ ...tallasSeleccionadas, [pack.id]: talla })}
                onMedias={(talla) => setMediasSeleccionadas({ ...mediasSeleccionadas, [pack.id]: talla })}
                onAdd={() => addToCart(pack)}
              />
            )}

            {productos.length > 0 && (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {productos.map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    esSocio={esSocio}
                    talla={tallasSeleccionadas[producto.id]}
                    onTalla={(talla) => setTallasSeleccionadas({ ...tallasSeleccionadas, [producto.id]: talla })}
                    onAdd={() => addToCart(producto)}
                  />
                ))}
              </div>
            )}

            {!mostrarPack && productos.length === 0 && (
              <p className="text-center text-muted-foreground py-16">No hay artículos en esta categoría.</p>
            )}
          </>
        )}
      </div>

      {carrito.length > 0 && !showCheckout && (
        <div className="fixed bottom-4 left-4 right-24 z-40">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3 min-w-0">
              <ShoppingCart className="text-secondary shrink-0" size={22} />
              <div className="min-w-0">
                <p className="font-heading font-semibold text-primary truncate">
                  {unidades} {unidades === 1 ? "artículo" : "artículos"}
                </p>
                <p className="text-sm text-muted-foreground">{esSocio ? "Tarifa socio" : "Tarifa no socio"} · {euros(total)}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCheckout(true)}
              className="bg-secondary text-secondary-foreground hover:bg-red-club-light font-heading uppercase tracking-wider shrink-0"
            >
              Finalizar
            </Button>
          </div>
        </div>
      )}

      <StoreChat />
    </main>
  );
};

function Precios({ producto, esSocio }: { producto: Producto; esSocio: boolean }) {
  const mismo = producto.precioSocio === producto.precioNoSocio;
  if (mismo) {
    return (
      <div>
        <p className="font-heading text-3xl font-bold text-primary">{euros(producto.precioSocio)}</p>
        <p className="text-xs text-muted-foreground mt-1">IVA incluido · socios y no socios</p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <div className={`rounded-lg px-3 py-2 ${esSocio ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        <p className="text-[10px] font-heading uppercase tracking-wider">Socio</p>
        <p className="font-heading text-xl font-bold leading-none">{euros(producto.precioSocio)}</p>
      </div>
      <div className={`rounded-lg px-3 py-2 ${!esSocio ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
        <p className="text-[10px] font-heading uppercase tracking-wider">No socio</p>
        <p className="font-heading text-xl font-bold leading-none">{euros(producto.precioNoSocio)}</p>
      </div>
    </div>
  );
}

function Tallas({
  opciones,
  valor,
  onChange,
  etiqueta,
}: {
  opciones: string[];
  valor?: string;
  onChange: (talla: string) => void;
  etiqueta: string;
}) {
  if (opciones.length === 1) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{etiqueta}</p>
      <div className="flex flex-wrap gap-2">
        {opciones.map((talla) => (
          <button
            key={talla}
            type="button"
            onClick={() => onChange(talla)}
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase border transition-colors ${
              valor === talla
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {talla}
          </button>
        ))}
      </div>
    </div>
  );
}

function PackCard({
  producto,
  esSocio,
  talla,
  medias,
  onTalla,
  onMedias,
  onAdd,
}: {
  producto: Producto;
  esSocio: boolean;
  talla?: string;
  medias?: string;
  onTalla: (talla: string) => void;
  onMedias: (talla: string) => void;
  onAdd: () => void;
}) {
  return (
    <article className="mb-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid lg:grid-cols-2">
        <div className="bg-white flex items-center justify-center p-4">
          <img src={producto.imagen} alt={producto.nombre} className="w-full h-auto object-contain" />
        </div>
        <div className="p-6 md:p-8 flex flex-col gap-5">
          <div>
            <p className="text-secondary font-heading text-sm uppercase tracking-[0.2em]">Oferta pack club</p>
            <h2 className="font-heading text-3xl font-bold text-primary uppercase mt-1">{producto.nombre}</h2>
            <p className="text-muted-foreground mt-2">{producto.descripcion}</p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {producto.incluye?.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check size={16} className="text-secondary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Precios producto={producto} esSocio={esSocio} />
          <Tallas opciones={producto.tallas} valor={talla} onChange={onTalla} etiqueta="Talla de la equipación" />
          <Tallas opciones={TALLAS_MEDIAS} valor={medias} onChange={onMedias} etiqueta="Talla de las medias" />
          <Button onClick={onAdd} className="bg-secondary text-secondary-foreground hover:bg-red-club-light font-heading uppercase tracking-wider">
            Añadir pack al carrito
          </Button>
        </div>
      </div>
    </article>
  );
}

function ProductCard({
  producto,
  esSocio,
  talla,
  onTalla,
  onAdd,
}: {
  producto: Producto;
  esSocio: boolean;
  talla?: string;
  onTalla: (talla: string) => void;
  onAdd: () => void;
}) {
  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <div className="h-72 bg-white flex items-center justify-center p-3">
        <img src={producto.imagen} alt={producto.nombre} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-[11px] font-heading uppercase tracking-wider text-secondary">{producto.categoria}</p>
          <h3 className="font-heading text-lg font-bold text-primary uppercase leading-tight">{producto.nombre}</h3>
          <p className="text-muted-foreground text-sm mt-1">{producto.descripcion}</p>
        </div>
        <Precios producto={producto} esSocio={esSocio} />
        <Tallas opciones={producto.tallas} valor={talla} onChange={onTalla} etiqueta="Talla" />
        <Button onClick={onAdd} className="mt-auto w-full bg-primary text-primary-foreground hover:bg-navy-light font-heading uppercase tracking-wider">
          Añadir al carrito
        </Button>
      </div>
    </article>
  );
}

function Checkout({
  carrito,
  total,
  esSocio,
  formData,
  errors,
  numeroSocio,
  observaciones,
  enviando,
  onBack,
  onChange,
  onNumeroSocio,
  onObservaciones,
  onQty,
  onRemove,
  onSubmit,
}: {
  carrito: ArticuloPedido[];
  total: number;
  esSocio: boolean;
  formData: { nombre: string; apellidos: string; dni: string; email: string; telefono: string };
  errors: Record<string, string>;
  numeroSocio: string;
  observaciones: string;
  enviando: boolean;
  onBack: () => void;
  onChange: (key: "nombre" | "apellidos" | "dni" | "email" | "telefono", value: string) => void;
  onNumeroSocio: (value: string) => void;
  onObservaciones: (value: string) => void;
  onQty: (idx: number, delta: number) => void;
  onRemove: (idx: number) => void;
  onSubmit: () => void;
}) {
  const campos: { key: "nombre" | "apellidos" | "dni" | "email" | "telefono"; label: string; type: string; placeholder?: string }[] = [
    { key: "nombre", label: "Nombre", type: "text" },
    { key: "apellidos", label: "Apellidos", type: "text" },
    { key: "dni", label: "DNI", type: "text", placeholder: "12345678A" },
    { key: "email", label: "Email", type: "email" },
    { key: "telefono", label: "Teléfono", type: "tel" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-6 text-muted-foreground">
        ← Seguir comprando
      </Button>
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="section-title text-2xl mb-2">Confirmar pedido</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Tarifa {esSocio ? "socio" : "no socio"}. Al confirmar, el pedido llega al correo del club y te escribimos cuando esté listo para recoger.
        </p>

        <div className="mb-6 space-y-3 border-b border-border pb-6">
          {carrito.map((item, idx) => (
            <div key={`${item.id}-${item.talla}`} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <button type="button" onClick={() => onRemove(idx)} className="text-muted-foreground hover:text-destructive" aria-label={`Quitar ${item.nombre}`}>
                  <X size={14} />
                </button>
                <span className="truncate">{item.nombre} ({item.talla})</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => onQty(idx, -1)} className="p-1 rounded bg-muted hover:bg-muted/80" aria-label="Reducir cantidad">
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center font-semibold">{item.cantidad}</span>
                <button type="button" onClick={() => onQty(idx, 1)} className="p-1 rounded bg-muted hover:bg-muted/80" aria-label="Aumentar cantidad">
                  <Plus size={12} />
                </button>
                <span className="w-24 text-right font-semibold">{euros(item.precio * item.cantidad)}</span>
              </div>
            </div>
          ))}
          <div className="flex justify-between font-heading text-lg font-bold text-primary pt-2">
            <span>Total</span>
            <span>{euros(total)}</span>
          </div>
        </div>

        <div className="grid gap-4">
          {campos.map((field) => (
            <div key={field.key}>
              <Label className="text-sm font-semibold text-primary">{field.label}</Label>
              <Input
                type={field.type}
                placeholder={field.placeholder || ""}
                value={formData[field.key]}
                onChange={(e) => onChange(field.key, field.key === "dni" ? e.target.value.toUpperCase() : e.target.value)}
                className={errors[field.key] ? "border-destructive" : ""}
              />
              {errors[field.key] && <p className="text-xs text-destructive mt-1">{errors[field.key]}</p>}
            </div>
          ))}
          {esSocio && (
            <div>
              <Label className="text-sm font-semibold text-primary">Número de socio</Label>
              <Input value={numeroSocio} onChange={(e) => onNumeroSocio(e.target.value)} placeholder="Si lo conoces" />
            </div>
          )}
          <div>
            <Label className="text-sm font-semibold text-primary">Observaciones</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => onObservaciones(e.target.value)}
              placeholder="Nombre del jugador, equipo o cualquier detalle para preparar el pedido"
              maxLength={400}
            />
          </div>
          <Button
            onClick={onSubmit}
            disabled={enviando || carrito.length === 0}
            className="w-full bg-secondary text-secondary-foreground hover:bg-red-club-light font-heading uppercase tracking-wider text-lg py-6 mt-2"
          >
            {enviando ? "Enviando pedido..." : "Confirmar pedido"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            El aviso del pedido se envía a cdnanclares.oficial@gmail.com. No se cobra online.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Tienda;
