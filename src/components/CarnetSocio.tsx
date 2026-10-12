import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoCdn from "@/assets/logo-cdn.jpg";

const ANCHO = 900;
const ALTO = 1500;

export type DatosCarnet = {
  nombre: string;
  apellidos: string;
  numero: string;
  foto: string | null;
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

function dibujarOca(ctx: CanvasRenderingContext2D, cx: number, cy: number, tamano: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(tamano / 220, tamano / 220);
  ctx.translate(-110, -110);
  ctx.fillStyle = "#f4f1ea";
  ctx.strokeStyle = "#f4f1ea";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.ellipse(124, 132, 58, 38, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(168, 118);
  ctx.quadraticCurveTo(214, 104, 198, 142);
  ctx.quadraticCurveTo(176, 150, 164, 136);
  ctx.fill();

  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(86, 124);
  ctx.bezierCurveTo(64, 86, 58, 52, 84, 34);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(96, 30, 20, 16, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e2a41a";
  ctx.beginPath();
  ctx.moveTo(112, 26);
  ctx.lineTo(154, 34);
  ctx.lineTo(112, 42);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#c48c0e";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(114, 34);
  ctx.lineTo(148, 34);
  ctx.stroke();

  ctx.fillStyle = "#0c1730";
  ctx.beginPath();
  ctx.arc(90, 26, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e6e1d6";
  ctx.beginPath();
  ctx.moveTo(108, 112);
  ctx.quadraticCurveTo(150, 100, 168, 132);
  ctx.quadraticCurveTo(136, 148, 108, 136);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#e2a41a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(112, 164);
  ctx.lineTo(106, 188);
  ctx.moveTo(98, 188);
  ctx.lineTo(116, 188);
  ctx.moveTo(138, 162);
  ctx.lineTo(144, 188);
  ctx.moveTo(134, 188);
  ctx.lineTo(154, 188);
  ctx.stroke();
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
  await document.fonts.load("600 54px Oswald");
  await document.fonts.load("500 26px Oswald");
  await document.fonts.load("400 22px Inter");

  const [escudo, foto] = await Promise.all([
    cargarImagen(logoCdn),
    datos.foto ? cargarImagen(datos.foto).catch(() => null) : Promise.resolve(null),
  ]);

  ctx.save();
  redondear(ctx, 0, 0, ANCHO, ALTO, 48);
  ctx.clip();

  const fondo = ctx.createLinearGradient(0, 0, ANCHO, ALTO);
  fondo.addColorStop(0, "#24385f");
  fondo.addColorStop(0.42, "#12243f");
  fondo.addColorStop(1, "#091426");
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (let x = -ALTO; x < ANCHO + 40; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + ALTO * 0.55, ALTO);
    ctx.stroke();
  }
  ctx.restore();

  const brillo = ctx.createRadialGradient(ANCHO / 2, 280, 40, ANCHO / 2, 520, 760);
  brillo.addColorStop(0, "rgba(255,255,255,0.08)");
  brillo.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = brillo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  ctx.fillStyle = "#c62828";
  ctx.fillRect(0, ALTO - 168, ANCHO, 168);
  ctx.fillStyle = "#d4af37";
  ctx.fillRect(0, ALTO - 176, ANCHO, 8);

  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 3;
  redondear(ctx, 28, 28, ANCHO - 56, ALTO - 56, 32);
  ctx.stroke();
  ctx.lineWidth = 1;
  redondear(ctx, 40, 40, ANCHO - 80, ALTO - 80, 26);
  ctx.stroke();

  const medallaX = ANCHO / 2;
  const medallaY = 214;
  const medallaR = 132;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(medallaX, medallaY, medallaR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(medallaX, medallaY, medallaR - 6, 0, Math.PI * 2);
  ctx.clip();
  const lado = (medallaR - 10) * 1.72;
  const escala = Math.min(lado / escudo.width, lado / escudo.height);
  const anchoEscudo = escudo.width * escala;
  const altoEscudo = escudo.height * escala;
  ctx.drawImage(escudo, medallaX - anchoEscudo / 2, medallaY - altoEscudo / 2, anchoEscudo, altoEscudo);
  ctx.restore();
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(medallaX, medallaY, medallaR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#d4af37";
  ctx.font = "500 28px Oswald, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CARNET DE SOCIO", ANCHO / 2, 400);

  ctx.strokeStyle = "rgba(212,175,55,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(250, 424);
  ctx.lineTo(650, 424);
  ctx.stroke();

  const fotoX = ANCHO / 2;
  const fotoY = 640;
  const fotoR = 176;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.arc(fotoX, fotoY, fotoR, 0, Math.PI * 2);
  ctx.fillStyle = "#101d36";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(fotoX, fotoY, fotoR - 8, 0, Math.PI * 2);
  ctx.clip();
  if (foto) {
    const cover = Math.max(((fotoR - 8) * 2) / foto.width, ((fotoR - 8) * 2) / foto.height);
    const fw = foto.width * cover;
    const fh = foto.height * cover;
    ctx.drawImage(foto, fotoX - fw / 2, fotoY - fh / 2, fw, fh);
  } else {
    ctx.fillStyle = "#101d36";
    ctx.fillRect(fotoX - fotoR, fotoY - fotoR, fotoR * 2, fotoR * 2);
    dibujarOca(ctx, fotoX, fotoY + 8, 300);
  }
  ctx.restore();

  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(fotoX, fotoY, fotoR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(fotoX, fotoY, fotoR - 16, 0, Math.PI * 2);
  ctx.stroke();

  const nombre = `${datos.nombre} ${datos.apellidos}`.replace(/\s+/g, " ").trim().toUpperCase();
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 52px Oswald, sans-serif";
  let tamanoNombre = 52;
  const maxNombre = 760;
  while (tamanoNombre > 32 && ctx.measureText(nombre).width > maxNombre * 2.2) {
    tamanoNombre -= 2;
    ctx.font = `600 ${tamanoNombre}px Oswald, sans-serif`;
  }
  const lineas = lineasDe(ctx, nombre, maxNombre);
  const altoLinea = tamanoNombre + 8;
  const yNombre = 900 + (240 - lineas.length * altoLinea) / 2;
  lineas.forEach((linea, i) => {
    ctx.fillText(linea, ANCHO / 2, yNombre + i * altoLinea);
  });

  const baseNumero = 1172;
  ctx.fillStyle = "rgba(212,175,55,0.9)";
  ctx.font = "500 22px Oswald, sans-serif";
  ctx.fillText("NÚMERO DE SOCIO", ANCHO / 2, baseNumero);
  ctx.fillStyle = "#f3d27a";
  ctx.font = "700 118px Oswald, sans-serif";
  ctx.fillText(formatoNumeroSocio(datos.numero), ANCHO / 2, baseNumero + 118);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 34px Oswald, sans-serif";
  ctx.fillText(`TEMPORADA ${temporadaActual()}`, ANCHO / 2, ALTO - 96);
  ctx.font = "400 22px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillText("C.D. Nanclares de la Oca", ANCHO / 2, ALTO - 58);
  ctx.restore();
}

const CarnetSocio = ({ nombre, apellidos, numero, foto, onClose }: CarnetSocioProps) => {
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
    pintarCarnet(canvas, { nombre, apellidos, numero, foto }).then(() => {
      if (!cancelado) setListo(true);
    });
    return () => {
      cancelado = true;
    };
  }, [nombre, apellidos, numero, foto]);

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
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[radial-gradient(circle_at_top,_#c62828_0%,_#1a2744_38%,_#070e1c_100%)]">
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-[380px] flex-col items-center">
          <p className="font-heading text-xs uppercase tracking-[0.32em] text-white/75">C.D. Nanclares de la Oca</p>
          <h2 className="mt-2 text-center font-heading text-4xl font-bold uppercase tracking-tight text-white">Tu carnet</h2>
          <canvas
            ref={canvasRef}
            width={ANCHO}
            height={ALTO}
            className="mt-6 w-full rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          />
          <Button
            type="button"
            onClick={descargar}
            disabled={!listo}
            className="mt-6 h-12 w-full bg-white font-heading uppercase tracking-wider text-[#1a2744] hover:bg-[#f3d27a]"
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
  );
};

export default CarnetSocio;
