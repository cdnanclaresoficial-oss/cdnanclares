import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import fondoCarnet from "@/assets/fondo-carnet.jpg";

const ANCHO = 2000;
const ALTO = 1040;

export type DatosCarnet = {
  nombre: string;
  apellidos: string;
  numero: string;
  foto: string | null;
  cuota?: string;
};

type CarnetSocioProps = DatosCarnet & {
  onClose: () => void;
};

export function temporadaActual(fecha = new Date()) {
  const ano = fecha.getFullYear();
  const inicio = fecha.getMonth() >= 7 ? ano : ano - 1;
  return `${inicio}/${String(inicio + 1).slice(-2)}`;
}

export function formatoNumeroSocio(numero: string) {
  const n = Number(numero);
  if (!numero.trim() || !Number.isFinite(n)) return numero || "—";
  return String(Math.trunc(n)).padStart(3, "0");
}

export function codigoQrSocio(datos: DatosCarnet) {
  const numero = formatoNumeroSocio(datos.numero);
  const nombre = `${datos.nombre} ${datos.apellidos}`.replace(/\s+/g, " ").trim();
  return `CDN-SOCIO-${numero}|${nombre}`;
}

function cargarImagen(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    imagen.src = src;
  });
}

function redondear(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function lineasDe(ctx: CanvasRenderingContext2D, texto: string, max: number) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > max && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, 3);
}

function textoConSombra(ctx: CanvasRenderingContext2D, dibujar: () => void) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 3;
  dibujar();
  ctx.restore();
}

async function pintarCarnet(canvas: HTMLCanvasElement, datos: DatosCarnet) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = ANCHO;
  canvas.height = ALTO;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  await document.fonts.load("700 120px Oswald");
  await document.fonts.load("600 64px Oswald");
  await document.fonts.load("500 28px Oswald");

  const codigo = codigoQrSocio(datos);
  const qrUrl = await QRCode.toDataURL(codigo, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 560,
    color: { dark: "#0b1024", light: "#ffffff" },
  });

  const [fondo, qr, foto] = await Promise.all([
    cargarImagen(fondoCarnet),
    cargarImagen(qrUrl),
    datos.foto ? cargarImagen(datos.foto).catch(() => null) : Promise.resolve(null),
  ]);

  ctx.save();
  redondear(ctx, 0, 0, ANCHO, ALTO, 46);
  ctx.clip();

  ctx.fillStyle = "#070b24";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#8ea0ff";
  ctx.lineWidth = 2;
  for (let x = -ALTO; x < ANCHO + 80; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + ALTO * 0.72, ALTO);
    ctx.stroke();
  }
  ctx.restore();

  const altoFondo = ALTO;
  const anchoFondo = fondo.width * (altoFondo / fondo.height);
  const xFondo = (ANCHO - anchoFondo) / 2;
  ctx.drawImage(fondo, xFondo, 0, anchoFondo, altoFondo);

  const veloIzq = ctx.createLinearGradient(0, 0, 760, 0);
  veloIzq.addColorStop(0, "rgba(5,8,28,0.88)");
  veloIzq.addColorStop(0.62, "rgba(5,8,28,0.55)");
  veloIzq.addColorStop(1, "rgba(5,8,28,0)");
  ctx.fillStyle = veloIzq;
  ctx.fillRect(0, 0, 760, ALTO);

  const veloDer = ctx.createLinearGradient(ANCHO - 760, 0, ANCHO, 0);
  veloDer.addColorStop(0, "rgba(5,8,28,0)");
  veloDer.addColorStop(0.38, "rgba(5,8,28,0.5)");
  veloDer.addColorStop(1, "rgba(5,8,28,0.9)");
  ctx.fillStyle = veloDer;
  ctx.fillRect(ANCHO - 760, 0, 760, ALTO);

  ctx.strokeStyle = "#e2b340";
  ctx.lineWidth = 6;
  redondear(ctx, 22, 22, ANCHO - 44, ALTO - 44, 34);
  ctx.stroke();
  ctx.lineWidth = 2;
  redondear(ctx, 36, 36, ANCHO - 72, ALTO - 72, 26);
  ctx.stroke();

  const margen = 86;
  let cursorY = 150;
  textoConSombra(ctx, () => {
    ctx.fillStyle = "#f0c14d";
    ctx.font = "500 30px Oswald, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("CARNET DE SOCIO", margen, cursorY);
  });

  if (foto) {
    const fotoX = margen + 108;
    const fotoY = 310;
    const fotoR = 108;
    ctx.save();
    ctx.beginPath();
    ctx.arc(fotoX, fotoY, fotoR, 0, Math.PI * 2);
    ctx.clip();
    const cover = Math.max((fotoR * 2) / foto.width, (fotoR * 2) / foto.height);
    ctx.drawImage(foto, fotoX - (foto.width * cover) / 2, fotoY - (foto.height * cover) / 2, foto.width * cover, foto.height * cover);
    ctx.restore();
    ctx.strokeStyle = "#f0c14d";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(fotoX, fotoY, fotoR, 0, Math.PI * 2);
    ctx.stroke();
    cursorY = 470;
  } else {
    cursorY = 250;
  }

  const nombre = `${datos.nombre} ${datos.apellidos}`.replace(/\s+/g, " ").trim().toUpperCase();
  let tamanoNombre = foto ? 52 : 64;
  ctx.font = `600 ${tamanoNombre}px Oswald, sans-serif`;
  const maxNombre = 560;
  while (tamanoNombre > 34 && ctx.measureText(nombre).width > maxNombre * 1.8) {
    tamanoNombre -= 2;
    ctx.font = `600 ${tamanoNombre}px Oswald, sans-serif`;
  }
  const lineas = lineasDe(ctx, nombre, maxNombre);
  textoConSombra(ctx, () => {
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${tamanoNombre}px Oswald, sans-serif`;
    ctx.textAlign = "left";
    lineas.forEach((linea, i) => {
      ctx.fillText(linea, margen, cursorY + i * (tamanoNombre + 10));
    });
  });

  const yLinea = cursorY + lineas.length * (tamanoNombre + 10) + 18;
  ctx.strokeStyle = "#f0c14d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(margen, yLinea);
  ctx.lineTo(margen + 210, yLinea);
  ctx.stroke();

  const yNumero = yLinea + 54;
  textoConSombra(ctx, () => {
    ctx.fillStyle = "#f0c14d";
    ctx.font = "500 24px Oswald, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("NÚMERO DE SOCIO", margen, yNumero);
    ctx.fillStyle = "#ffe08a";
    ctx.font = "700 108px Oswald, sans-serif";
    ctx.fillText(formatoNumeroSocio(datos.numero), margen, yNumero + 108);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "500 28px Oswald, sans-serif";
    ctx.fillText(`TEMPORADA ${temporadaActual()}`, margen, yNumero + 164);
    if (datos.cuota) {
      ctx.fillStyle = "#f0c14d";
      ctx.font = "500 26px Oswald, sans-serif";
      ctx.fillText(datos.cuota.toUpperCase(), margen, yNumero + 206);
    }
  });

  const caja = 360;
  const cajaX = ANCHO - margen - caja;
  const cajaY = (ALTO - caja) / 2 - 10;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 28;
  ctx.fillStyle = "#ffffff";
  redondear(ctx, cajaX, cajaY, caja, caja, 28);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#f0c14d";
  ctx.lineWidth = 8;
  redondear(ctx, cajaX, cajaY, caja, caja, 28);
  ctx.stroke();
  const pad = 28;
  ctx.drawImage(qr, cajaX + pad, cajaY + pad, caja - pad * 2, caja - pad * 2);

  textoConSombra(ctx, () => {
    ctx.fillStyle = "#ffffff";
    ctx.font = "500 24px Oswald, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("IDENTIFICACIÓN", cajaX + caja / 2, cajaY + caja + 48);
  });

  ctx.restore();
}

const CarnetSocio = ({ nombre, apellidos, numero, foto, cuota, onClose }: CarnetSocioProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelado = false;
    setListo(false);
    pintarCarnet(canvas, { nombre, apellidos, numero, foto, cuota })
      .then(() => {
        if (!cancelado) setListo(true);
      })
      .catch(() => {
        if (!cancelado) setListo(false);
      });
    return () => {
      cancelado = true;
    };
  }, [nombre, apellidos, numero, foto, cuota]);

  const descargar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `carnet-socio-${formatoNumeroSocio(numero)}.png`;
      enlace.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[radial-gradient(circle_at_top,_#c62828_0%,_#12182e_42%,_#070b18_100%)]">
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-[980px] flex-col items-center">
          <p className="font-heading text-xs uppercase tracking-[0.32em] text-white/75">C.D. Nanclares de la Oca</p>
          <h2 className="mt-2 text-center font-heading text-4xl font-bold uppercase tracking-tight text-white">Tu carnet</h2>
          <canvas
            ref={canvasRef}
            width={ANCHO}
            height={ALTO}
            className="mt-6 w-full rounded-[22px] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          />
          <div className="mt-6 flex w-full max-w-md flex-col items-center">
            <Button
              type="button"
              onClick={descargar}
              disabled={!listo}
              className="h-12 w-full bg-white font-heading uppercase tracking-wider text-[#1a2744] hover:bg-[#f3d27a]"
            >
              <Download size={18} />
              Descargar carnet
            </Button>
            <button type="button" onClick={onClose} className="mt-3 font-heading text-sm uppercase tracking-wider text-white/80 hover:text-white">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarnetSocio;
