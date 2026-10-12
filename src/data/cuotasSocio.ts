export const CUOTAS_SOCIO = [
  { id: "individual", nombre: "Individual", personas: "", precio: 20 },
  { id: "familiar", nombre: "Familiar", personas: "2 personas", precio: 35 },
  { id: "numerosa", nombre: "Familia numerosa", personas: "A partir de 3", precio: 50 },
] as const;

export type CuotaSocioId = (typeof CUOTAS_SOCIO)[number]["id"];

export const IBAN_CLUB = "ES87 3035 0435 1043 5000 1559";
export const EMAIL_CONTACTO_CLUB = "cdnanclares@hotmail.com";
export const WHATSAPP_CLUB = "605 878 013";
export const WHATSAPP_CLUB_URL = "https://wa.me/34605878013";
export const NUMEROS_SOCIO_RESERVADOS = 25;

export function cuotaPorId(id: string) {
  return CUOTAS_SOCIO.find((cuota) => cuota.id === id);
}

export function textoCuota(id: string) {
  const cuota = cuotaPorId(id);
  if (!cuota) return "";
  const personas = cuota.personas ? ` · ${cuota.personas}` : "";
  return `${cuota.nombre}${personas} · ${cuota.precio} €`;
}
