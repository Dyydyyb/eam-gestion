import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  // Si existe en el sistema o simulado válido
  const booking = {
    token,
    client_name: "Alumno EAM",
    service_name: "Clase Práctica Individual (60 min)",
    date: "2026-09-19",
    time_slot: "10:30 a 11:30 hs",
    status: "confirmada",
    instructor: "Carlos Gómez",
    vehicle: "Fiat Cronos Doble Comando",
    address: "Mitre 294, Florencio Varela",
    can_cancel: true,
  };

  const response = NextResponse.json({ success: true, booking });
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  const response = NextResponse.json({
    success: true,
    message: `El turno ${token} ha sido cancelado con éxito conforme a las políticas de cancelación (24 hs previas).`,
  });
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
