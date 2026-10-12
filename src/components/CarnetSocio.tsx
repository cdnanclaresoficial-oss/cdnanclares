import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import fondoCarnet from "@/assets/fondo-carnet.jpg";
import logoCdn from "@/assets/logo-cdn.jpg";

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

function dibujarFotoDifuminada(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, lado: number) {
  const lienzo = document.createElement("canvas");
  lienzo.width = lado;
  lienzo.height = lado;
  const g = lienzo.getContext("2d", { willReadFrequently: true });
  if (!g) return;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  const cover = Math.max(lado / img.width, lado / img.height);
  const w = img.width * cover;
  const h = img.height * cover;
  g.drawImage(img, (lado - w) / 2, (lado - h) / 2, w, h);
  const datos = g.getImageData(0, 0, lado, lado);
  const pix = datos.data;
  const borde = lado * 0.14;
  for (let py = 0; py < lado; py++) {
    for (let px = 0; px < lado; px++) {
      const cerca = Math.min(px, py, lado - 1 - px, lado - 1 - py);
      let t = cerca >= borde ? 1 : cerca / borde;
      t = t * t * (3 - 2 * t);
      const i = (py * lado + px) * 4;
      pix[i + 3] = Math.round(pix[i + 3] * t);
    }
  }
  g.putImageData(datos, 0, 0);
  ctx.drawImage(lienzo, x, y);
}

function esBlancoSucio(pix: Uint8ClampedArray, i: number, minimo: number, croma: number) {
  const r = pix[i];
  const g = pix[i + 1];
  const b = pix[i + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max >= minimo && max - min <= croma;
}

function escudoFundido(img: HTMLImageElement, alto: number) {
  const ancho = Math.max(1, Math.round(alto * (img.width / img.height)));
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const g = lienzo.getContext("2d", { willReadFrequently: true });
  if (!g) return lienzo;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(img, 0, 0, ancho, alto);
  const datos = g.getImageData(0, 0, ancho, alto);
  const pix = datos.data;
  const visto = new Uint8Array(ancho * alto);
  const cola: number[] = [];
  const sembrar = (x: number, y: number) => {
    const p = y * ancho + x;
    if (visto[p] || !esBlancoSucio(pix, p * 4, 214, 22)) return;
    visto[p] = 1;
    cola.push(p);
  };
  for (let x = 0; x < ancho; x++) {
    sembrar(x, 0);
    sembrar(x, alto - 1);
  }
  for (let y = 0; y < alto; y++) {
    sembrar(0, y);
    sembrar(ancho - 1, y);
  }
  for (let n = 0; n < cola.length; n++) {
    const p = cola[n];
    pix[p * 4 + 3] = 0;
    const x = p % ancho;
    const y = (p - x) / ancho;
    if (x + 1 < ancho) sembrar(x + 1, y);
    if (x > 0) sembrar(x - 1, y);
    if (y + 1 < alto) sembrar(x, y + 1);
    if (y > 0) sembrar(x, y - 1);
  }
  for (let pasada = 0; pasada < 10; pasada++) {
    const quitar: number[] = [];
    for (let y = 1; y < alto - 1; y++) {
      for (let x = 1; x < ancho - 1; x++) {
        const p = y * ancho + x;
        const i = p * 4;
        if (pix[i + 3] === 0 || !esBlancoSucio(pix, i, 176, 28)) continue;
        const borde =
          pix[((p - 1) * 4) + 3] === 0 ||
          pix[((p + 1) * 4) + 3] === 0 ||
          pix[((p - ancho) * 4) + 3] === 0 ||
          pix[((p + ancho) * 4) + 3] === 0;
        if (borde) quitar.push(p);
      }
    }
    quitar.forEach((p) => {
      pix[p * 4 + 3] = 0;
    });
  }
  const alfa = new Float32Array(ancho * alto);
  for (let i = 0; i < alfa.length; i++) alfa[i] = pix[i * 4 + 3];
  const tmp = new Float32Array(ancho * alto);
  const radio = 2;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      let suma = 0;
      let n = 0;
      for (let k = -radio; k <= radio; k++) {
        const xx = x + k;
        if (xx < 0 || xx >= ancho) continue;
        suma += alfa[y * ancho + xx];
        n++;
      }
      tmp[y * ancho + x] = suma / n;
    }
  }
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      let suma = 0;
      let n = 0;
      for (let k = -radio; k <= radio; k++) {
        const yy = y + k;
        if (yy < 0 || yy >= alto) continue;
        suma += tmp[yy * ancho + x];
        n++;
      }
      const suave = suma / n;
      const i = (y * ancho + x) * 4;
      pix[i + 3] = suave;
      if (suave < 255 && suave > 0) {
        const mezcla = suave / 255;
        pix[i] = Math.round(pix[i] * mezcla + 8 * (1 - mezcla));
        pix[i + 1] = Math.round(pix[i + 1] * mezcla + 12 * (1 - mezcla));
        pix[i + 2] = Math.round(pix[i + 2] * mezcla + 32 * (1 - mezcla));
      }
    }
  }
  g.putImageData(datos, 0, 0);
  return lienzo;
}

function dibujarEscudo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, centroX: number, y: number, alto: number) {
  const recorte = escudoFundido(img, alto);
  const lectura = recorte.getContext("2d", { willReadFrequently: true });
  let centroOpaco = recorte.width / 2;
  if (lectura) {
    const pix = lectura.getImageData(0, 0, recorte.width, recorte.height).data;
    let minX = recorte.width;
    let maxX = 0;
    for (let py = 0; py < recorte.height; py++) {
      for (let px = 0; px < recorte.width; px++) {
        if (pix[(py * recorte.width + px) * 4 + 3] < 28) continue;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
      }
    }
    if (maxX > minX) centroOpaco = (minX + maxX) / 2;
  }
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(recorte, centroX - centroOpaco, y);
  ctx.restore();
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

  await document.fonts.load("700 108px Oswald");
  await document.fonts.load("700 64px Cinzel Decorative");
  await document.fonts.load("500 28px Oswald");

  const codigo = codigoQrSocio(datos);
  const qrUrl = await QRCode.toDataURL(codigo, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 560,
    color: { dark: "#0b1024", light: "#ffffff" },
  });

  const [fondo, qr, escudo, foto] = await Promise.all([
    cargarImagen(fondoCarnet),
    cargarImagen(qrUrl),
    cargarImagen(logoCdn),
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

  const margen = 96;
  textoConSombra(ctx, () => {
    ctx.fillStyle = "#f0c14d";
    ctx.font = "500 28px Oswald, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("CARNET DE SOCIO", margen, 128);
  });

  const fotoLado = 250;
  const fotoX = margen;
  const fotoY = 148;
  if (foto) {
    dibujarFotoDifuminada(ctx, foto, fotoX, fotoY, fotoLado);
  }

  const nombre = `${datos.nombre} ${datos.apellidos}`.replace(/\s+/g, " ").trim().toUpperCase();
  let tamanoNombre = 58;
  ctx.font = `700 ${tamanoNombre}px "Cinzel Decorative", serif`;
  ctx.letterSpacing = "3px";
  const maxNombre = 620;
  while (tamanoNombre > 36 && ctx.measureText(nombre).width > maxNombre * 1.7) {
    tamanoNombre -= 2;
    ctx.font = `700 ${tamanoNombre}px "Cinzel Decorative", serif`;
  }
  const lineas = lineasDe(ctx, nombre, maxNombre);
  const altoLinea = tamanoNombre + 16;
  const yNombre = foto ? fotoY + fotoLado + 72 : 280;
  textoConSombra(ctx, () => {
    ctx.fillStyle = "#fff8ea";
    ctx.font = `700 ${tamanoNombre}px "Cinzel Decorative", serif`;
    ctx.letterSpacing = "3px";
    ctx.textAlign = "left";
    lineas.forEach((linea, i) => {
      ctx.fillText(linea, margen, yNombre + i * altoLinea);
    });
    ctx.letterSpacing = "0px";
  });
  ctx.letterSpacing = "0px";

  const yLinea = yNombre + lineas.length * altoLinea + 8;
  ctx.strokeStyle = "#f0c14d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margen, yLinea);
  ctx.lineTo(margen + 240, yLinea);
  ctx.stroke();

  let yBloque = yLinea + 42;
  if (datos.cuota) {
    const etiqueta = datos.cuota.split("·")[0].trim().toUpperCase();
    ctx.font = "700 40px Oswald, sans-serif";
    const anchoEtiqueta = ctx.measureText(etiqueta).width;
    const cajaX = margen - 16;
    const cajaY = yBloque - 28;
    const cajaAncho = Math.min(anchoEtiqueta + 36, 620);
    const cajaAlto = 92;
    ctx.fillStyle = "rgba(5,8,28,0.72)";
    redondear(ctx, cajaX, cajaY, cajaAncho, cajaAlto, 14);
    ctx.fill();
    ctx.strokeStyle = "#e2b340";
    ctx.lineWidth = 2;
    redondear(ctx, cajaX, cajaY, cajaAncho, cajaAlto, 14);
    ctx.stroke();
    textoConSombra(ctx, () => {
      ctx.fillStyle = "#f0c14d";
      ctx.font = "500 18px Oswald, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("TIPO DE CUOTA", margen, yBloque);
      ctx.fillStyle = "#fff8ea";
      ctx.font = "700 40px Oswald, sans-serif";
      ctx.fillText(etiqueta, margen, yBloque + 44);
    });
    yBloque += 118;
  }

  const yNumero = yBloque;
  textoConSombra(ctx, () => {
    ctx.fillStyle = "#f0c14d";
    ctx.font = "500 22px Oswald, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("NÚMERO DE SOCIO", margen, yNumero);
    ctx.fillStyle = "#ffe08a";
    ctx.font = "700 72px Oswald, sans-serif";
    ctx.fillText(formatoNumeroSocio(datos.numero), margen, yNumero + 74);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "500 24px Oswald, sans-serif";
    ctx.fillText(`TEMPORADA ${temporadaActual()}`, margen, yNumero + 112);
  });

  const caja = 248;
  const cajaX = ANCHO - 72 - caja;
  const cajaY = ALTO - 72 - caja;
  const altoEscudo = 360;
  const centroQr = cajaX + caja / 2;
  dibujarEscudo(ctx, escudo, centroQr, 48, altoEscudo);
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
    ctx.font = "500 22px Oswald, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("IDENTIFICACIÓN", cajaX + caja / 2, cajaY - 18);
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
