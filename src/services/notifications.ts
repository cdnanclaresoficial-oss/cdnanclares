import type { ArticuloPedido, ClienteDatos } from "@/types";

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || "";
export const CLUB_EMAIL = "cdnanclares.oficial@gmail.com";

function buildEmailTemplate(title: string, body: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #1a2744 0%, #2a3f6a 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">C.D. Nanclares de la Oca</h1>
        <p style="color: #cccccc; margin: 5px 0 0;">Fundazio Urtea 1960</p>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #1a2744; border-bottom: 3px solid #c62828; padding-bottom: 10px;">${title}</h2>
        ${body}
      </div>
      <div style="background: #1a2744; padding: 20px; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Club Deportivo Nanclares de la Oca</p>
      </div>
    </div>
  `;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("Resend API key no configurada. Email no enviado.");
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "C.D. Nanclares <noreply@cdnanclares.com>",
        to: [to],
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error("Error enviando email:", err);
  }
}

export async function notifyNewPlayer(nombre: string, apellidos: string, email: string, categoria: string) {
  const body = `
    <p>Se ha registrado una nueva inscripción:</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px; font-weight: bold;">Jugador:</td><td style="padding: 8px;">${nombre} ${apellidos}</td></tr>
      <tr style="background: #f5f5f5;"><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${email}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Categoría:</td><td style="padding: 8px;">${categoria}</td></tr>
    </table>
  `;
  await sendEmail(CLUB_EMAIL, `Nueva Inscripción: ${nombre} ${apellidos}`, buildEmailTemplate("Nueva Inscripción", body));

  const confirmBody = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Tu inscripción en el <strong>C.D. Nanclares de la Oca</strong> ha sido recibida correctamente.</p>
    <p>Nos pondremos en contacto contigo pronto. ¡Bienvenido al club!</p>
  `;
  await sendEmail(email, "Confirmación de Inscripción - C.D. Nanclares", buildEmailTemplate("Inscripción Confirmada", confirmBody));
}

function euros(valor: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(valor);
}

function unidades(cantidad: number) {
  return cantidad === 1 ? "1 unidad" : `${cantidad} unidades`;
}

export async function notifyNewOrder(pedido: {
  cliente: ClienteDatos;
  articulos: ArticuloPedido[];
  total: number;
}) {
  const { cliente, articulos, total } = pedido;
  const nombre = `${cliente.nombre} ${cliente.apellidos}`.trim();
  const socio = cliente.es_socio
    ? `Sí${cliente.numero_socio ? `, número ${cliente.numero_socio}` : ""}`
    : "No";
  const nota = cliente.observaciones?.trim();
  const articulosTexto = articulos
    .map((a, indice) =>
      [
        `${indice + 1}. ${a.nombre}`,
        `Talla: ${a.talla}`,
        `${unidades(a.cantidad)} × ${euros(a.precio)} = ${euros(a.precio * a.cantidad)}`,
      ].join("\n"),
    )
    .join("\n\n");
  const ticket = [
    "C.D. Nanclares de la Oca",
    "",
    `Cliente: ${nombre}`,
    `Correo: ${cliente.email}`,
    `Teléfono: ${cliente.telefono}`,
    `DNI: ${cliente.dni}`,
    `Socio: ${socio}`,
    "",
    "Artículos",
    articulosTexto,
    "",
    `Total: ${euros(total)}`,
    ...(nota ? ["", `Nota: ${nota}`] : []),
    "",
    "El pago se realizará en las instalaciones del club a la hora de recoger la ropa.",
  ].join("\n");

  await enviarFormulario({
    _subject: `Ticket de compra · ${nombre} · ${euros(total)}`,
    _template: "box",
    _captcha: "false",
    _replyto: cliente.email,
    "Ticket de compra": ticket,
  });
}

export async function notifyNewSocio(socio: {
  numero: string;
  nombre: string;
  apellidos: string;
  dni: string;
  fechaNacimiento: string;
  direccion: string;
  email: string;
  telefono: string;
  telefonoTutor?: string;
  cuota: string;
  origen: string;
}) {
  const nombre = `${socio.nombre} ${socio.apellidos}`.trim();
  const aviso = [
    "C.D. Nanclares de la Oca",
    "",
    `Nuevo socio · nº ${socio.numero}`,
    `Origen: ${socio.origen}`,
    "",
    `Nombre: ${nombre}`,
    `DNI: ${socio.dni}`,
    `Nacimiento: ${socio.fechaNacimiento}`,
    `Dirección: ${socio.direccion}`,
    `Correo: ${socio.email}`,
    `Teléfono: ${socio.telefono}`,
    ...(socio.telefonoTutor ? [`Teléfono del tutor: ${socio.telefonoTutor}`] : []),
    "",
    `Cuota: ${socio.cuota}`,
    "Pago: transferencia bancaria",
    "Cuenta: ES87 3035 0435 1043 5000 1559",
  ].join("\n");

  await enviarFormulario({
    _subject: `Nuevo socio · nº ${socio.numero} · ${nombre}`,
    _template: "box",
    _captcha: "false",
    _replyto: socio.email,
    "Alta de socio": aviso,
  });
}

async function enviarFormulario(campos: Record<string, string>) {
  const res = await fetch(`https://formsubmit.co/ajax/${CLUB_EMAIL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(campos),
  });

  const data = await res.json().catch(() => ({} as { success?: string | boolean; message?: string }));
  if (!res.ok || (data.success !== true && data.success !== "true")) {
    throw new Error(data.message || "No se ha podido enviar el aviso por email.");
  }
}
