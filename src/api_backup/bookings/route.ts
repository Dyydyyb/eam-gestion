import { NextResponse } from "next/server";
import { normalizeArgentinePhone } from "@/lib/phone";

// Almacén en memoria compartido para reservas entrantes vía API
const externalBookings: any[] = [];

export async function GET() {
  const response = NextResponse.json({ success: true, bookings: externalBookings });
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_name, client_dni, client_phone, service_name, date, time_slot, comments } = body;

    if (!client_name || !client_phone || !date || !time_slot) {
      const errRes = NextResponse.json(
        { success: false, error: "Faltan campos obligatorios para la reserva." },
        { status: 400 }
      );
      errRes.headers.set("Access-Control-Allow-Origin", "*");
      return errRes;
    }

    const token = `EAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const normalizedPhone = normalizeArgentinePhone(client_phone);

    const newBooking = {
      id: `ext-book-${Date.now()}`,
      token,
      client_name,
      client_dni: client_dni || "Sin DNI",
      client_phone: normalizedPhone,
      service_name: service_name || "Clase Práctica Individual",
      date,
      time_slot,
      status: "confirmada",
      created_at: new Date().toISOString(),
      comments: comments || "",
      pickup_address: "Sede Central — Mitre 294, Florencio Varela",
    };

    externalBookings.push(newBooking);

    const response = NextResponse.json({
      success: true,
      booking: newBooking,
      token,
      message: "¡Turno registrado con éxito en el sistema EAM Gestión!",
    });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  } catch (err: any) {
    const response = NextResponse.json(
      { success: false, error: err.message || "Error al procesar reserva." },
      { status: 500 }
    );
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
