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
  const lineasTicket = articulos
    .map((a) => `${a.nombre} — talla ${a.talla} — ${unidades(a.cantidad)} — ${euros(a.precio * a.cantidad)}`)
    .join("\n");

  const ticket: Record<string, string> = {
    _subject: `Ticket de compra · ${nombre} · ${euros(total)}`,
    _template: "box",
    _captcha: "false",
    _replyto: cliente.email,
    email: cliente.email,
    _autoresponse: [
      `Hola ${cliente.nombre},`,
      "",
      "El C.D. Nanclares ya tiene tu pedido de equipación.",
      "",
      lineasTicket,
      "",
      `Total: ${euros(total)}`,
      "",
      "Te avisaremos cuando puedas pasar a recogerlo. El pago se hace en el club.",
      "",
      "Gracias.",
    ].join("\n"),
    Ticket: "Equipación oficial del C.D. Nanclares de la Oca",
    Cliente: nombre,
    Correo: cliente.email,
    Teléfono: cliente.telefono,
    DNI: cliente.dni,
    Socio: socio,
  };

  articulos.forEach((a, indice) => {
    ticket[`${indice + 1}. ${a.nombre}`] = `Talla ${a.talla} · ${unidades(a.cantidad)} · ${euros(a.precio * a.cantidad)}`;
  });

  ticket.Total = euros(total);
  ticket.Pago = "Se abona al recoger la equipación en el club.";
  const nota = cliente.observaciones?.trim();
  if (nota) ticket.Nota = nota;

  await enviarFormulario(ticket);
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
    throw new Error(data.message || "No se ha podido enviar el aviso del pedido por email.");
  }
}
