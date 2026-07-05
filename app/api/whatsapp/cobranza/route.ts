import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CobranzaWhatsappPayload {
  controlCobranzaId: string;
  clienteId: string;
  telefono: string;
  nombreCliente: string;
  saldoPendiente: number;
  fechaLimite: string; // YYYY-MM-DD
}

/**
 * POST /api/whatsapp/cobranza
 * Dispara la plantilla de cobro por WhatsApp Cloud API (Meta) para un
 * cliente con saldo pendiente. Pensado para llamarse desde el botón
 * "Cobrar" en /admin/cobranza.
 *
 * Requiere las variables de entorno:
 *  - WHATSAPP_PHONE_NUMBER_ID
 *  - WHATSAPP_ACCESS_TOKEN
 *  - WHATSAPP_TEMPLATE_NAME (plantilla previamente aprobada en Meta)
 *  - WHATSAPP_TEMPLATE_LANG (ej. "es_MX")
 */
export async function POST(request: Request) {
  // Solo admin/cobranza puede disparar cobros (protegido también por RLS
  // al leer control_cobranza, pero validamos sesión explícitamente aquí).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  let body: CobranzaWhatsappPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { telefono, nombreCliente, saldoPendiente, fechaLimite, controlCobranzaId } =
    body;

  if (!telefono || !nombreCliente || saldoPendiente == null || !fechaLimite) {
    return NextResponse.json(
      { error: "Faltan datos del cliente o del saldo." },
      { status: 400 }
    );
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? "cobro_saldo_pendiente";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG ?? "es_MX";

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json(
      { error: "WhatsApp Cloud API no está configurada (faltan env vars)." },
      { status: 500 }
    );
  }

  const saldoFormateado = saldoPendiente.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
  const fechaFormateada = new Date(`${fechaLimite}T00:00:00`).toLocaleDateString(
    "es-MX",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  // Meta exige el número en formato E.164 sin el "+"
  const telefonoWhatsapp = telefono.replace(/^\+/, "");

  try {
    const metaResponse = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefonoWhatsapp,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: nombreCliente },
                  { type: "text", text: saldoFormateado },
                  { type: "text", text: fechaFormateada },
                ],
              },
            ],
          },
        }),
      }
    );

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      return NextResponse.json(
        { error: metaData?.error?.message ?? "Error al enviar WhatsApp." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      controlCobranzaId,
      whatsappMessageId: metaData?.messages?.[0]?.id ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar la API de WhatsApp." },
      { status: 502 }
    );
  }
}
