const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || "";
const CLUB_EMAIL = "cdnanclares@gmail.com";

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

export async function notifyNewOrder(clienteNombre: string, clienteEmail: string, total: number) {
  const body = `
    <p>Nuevo pedido recibido:</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px; font-weight: bold;">Cliente:</td><td style="padding: 8px;">${clienteNombre}</td></tr>
      <tr style="background: #f5f5f5;"><td style="padding: 8px; font-weight: bold;">Total:</td><td style="padding: 8px;">${total.toFixed(2)} €</td></tr>
    </table>
  `;
  await sendEmail(CLUB_EMAIL, `Nuevo Pedido de ${clienteNombre}`, buildEmailTemplate("Nuevo Pedido", body));

  const confirmBody = `
    <p>Hola <strong>${clienteNombre}</strong>,</p>
    <p>Hemos recibido tu pedido correctamente. El total estimado es de <strong>${total.toFixed(2)} €</strong>.</p>
    <p>Te avisaremos cuando esté preparado para recoger.</p>
  `;
  await sendEmail(clienteEmail, "Confirmación de Pedido - C.D. Nanclares", buildEmailTemplate("Pedido Confirmado", confirmBody));
}
