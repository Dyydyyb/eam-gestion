import { NextResponse } from "next/server";
import { INITIAL_INSTRUCTORS, INITIAL_VEHICLES, INITIAL_LESSONS } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || "2026-09-19";

  const timeSlots = [
    { start: "08:00", end: "09:00" },
    { start: "09:15", end: "10:15" },
    { start: "10:30", end: "11:30" },
    { start: "11:45", end: "12:45" },
    { start: "14:00", end: "15:00" },
    { start: "15:15", end: "16:15" },
    { start: "16:30", end: "17:30" },
    { start: "17:45", end: "18:45" },
  ];

  const activeInstructors = INITIAL_INSTRUCTORS.filter((i) => i.status === "activo");
  const operativeVehicles = INITIAL_VEHICLES.filter((v) => v.status === "operativo");

  const slots = timeSlots.map((slot, index) => {
    const slotStartIso = `${date}T${slot.start}:00-03:00`;
    const slotEndIso = `${date}T${slot.end}:00-03:00`;

    const conflict = INITIAL_LESSONS.some(
      (l) =>
        l.status !== "cancelada" &&
        ((l.start_time <= slotStartIso && l.end_time > slotStartIso) ||
          (l.start_time < slotEndIso && l.end_time >= slotEndIso))
    );

    const isAvailable = !conflict && index % 4 !== 2;
    const assignedInstructor = activeInstructors[index % activeInstructors.length];
    const assignedVehicle = operativeVehicles[index % operativeVehicles.length];

    return {
      id: `slot-${date}-${slot.start.replace(":", "")}`,
      date,
      start_time: slot.start,
      end_time: slot.end,
      start_iso: slotStartIso,
      end_iso: slotEndIso,
      is_available: isAvailable,
      instructor: {
        id: assignedInstructor?.id,
        name: assignedInstructor?.full_name,
      },
      vehicle: {
        id: assignedVehicle?.id,
        name: `${assignedVehicle?.brand} ${assignedVehicle?.model}`,
        transmission: assignedVehicle?.transmission,
      },
    };
  });

  const response = NextResponse.json({ success: true, date, slots });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
