"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Car,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { isValidArgentinePhone } from "@/lib/phone";
import { messagingService, DEFAULT_TEMPLATES } from "@/lib/messaging";

export default function WidgetReservarPage() {
  const { services, instructors, vehicles, checkSlotAvailable, bookLesson } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState(services[0]);
  const [selectedDate, setSelectedDate] = useState("2026-09-19");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [comments, setComments] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  const daySlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

  const availableSlots = daySlots
    .map((slot) => {
      const start = `${selectedDate}T${slot}:00-03:00`;
      const [h, m] = slot.split(":").map(Number);
      const endH = String(h + 1).padStart(2, "0");
      const end = `${selectedDate}T${endH}:${String(m).padStart(2, "0")}:00-03:00`;

      for (const inst of instructors.filter((i) => i.status === "activo")) {
        for (const veh of vehicles.filter((v) => v.status === "operativo")) {
          const check = checkSlotAvailable(inst.id, veh.id, start, end);
          if (check.available) {
            return {
              instructorId: inst.id,
              instructorName: inst.full_name,
              vehicleId: veh.id,
              vehicleModel: `${veh.brand} ${veh.model} (${veh.plate})`,
              startTime: start,
              endTime: end,
              timeLabel: slot,
            };
          }
        }
      }
      return null;
    })
    .filter(Boolean);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !dni || !isValidArgentinePhone(phone)) {
      setErrorMsg("Completá tu nombre, DNI y teléfono válido (ej: 11 3637-3331).");
      return;
    }

    const res = bookLesson({
      client_name: fullName,
      client_dni: dni,
      client_phone: phone,
      service_id: selectedService.id,
      instructor_id: selectedSlot.instructorId,
      vehicle_id: selectedSlot.vehicleId,
      start_time: selectedSlot.startTime,
      end_time: selectedSlot.endTime,
      comments,
    });

    if (!res.success) {
      setErrorMsg(res.error || "El turno acaba de ser reservado.");
    } else {
      setConfirmedBooking(res.lesson);
      setStep(4);
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  const handleWhatsApp = () => {
    if (!confirmedBooking) return;
    const template = DEFAULT_TEMPLATES[1].content;
    const text = messagingService.buildMessage(template, {
      nombre: fullName,
      fecha: formatDate(confirmedBooking.start_time),
      hora: formatTime(confirmedBooking.start_time),
      instructor: confirmedBooking.instructor_name,
      link_reprogramar: `http://localhost:3000/reservar/turno/${confirmedBooking.public_token}`,
    });
    window.open(messagingService.generateWhatsAppLink("5491136373331", text), "_blank");
  };

  return (
    <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-lg max-w-xl mx-auto font-sans">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="font-heading font-black text-base text-[#03387E]">
          EAM • <span className="text-[#00A3FF]">Reserva Online</span>
        </div>
        <span className="text-xs font-bold text-slate-400">Paso {step} de 4</span>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-800">Elegí tu clase o programa:</h3>
          <div className="space-y-2">
            {services.slice(0, 4).map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedService(s)}
                className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedService.id === s.id
                    ? "border-[#00A3FF] bg-blue-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{s.name}</div>
                  <div className="text-[11px] text-slate-500">{s.duration_minutes} min</div>
                </div>
                <div className="font-heading font-black text-sm text-[#03387E]">
                  {formatCurrency(s.price)}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            className="btn-pill btn-pill-primary w-full py-2.5 text-xs font-bold mt-2"
          >
            Continuar a Horarios
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Elegí fecha y horario:</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot: any) => (
              <button
                key={slot.timeLabel}
                onClick={() => {
                  setSelectedSlot(slot);
                  setStep(3);
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-[#00A3FF] hover:bg-blue-50 text-center cursor-pointer transition-all"
              >
                <span className="font-bold text-sm text-slate-900 block">{slot.timeLabel} hs</span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {slot.instructorName.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="text-xs font-bold text-slate-500 hover:underline pt-2 block"
          >
            ← Cambiar servicio
          </button>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleConfirm} className="space-y-3">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-900 text-xs flex items-center justify-between font-semibold">
            <span>Horario: {selectedSlot?.timeLabel} hs ({formatDate(selectedDate)})</span>
            <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded-md">Retenido 10m</span>
          </div>

          {errorMsg && (
            <div className="p-2 bg-red-50 text-red-700 text-xs rounded-xl">{errorMsg}</div>
          )}

          <input
            type="text"
            required
            placeholder="Nombre y Apellido"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
          <input
            type="text"
            required
            placeholder="DNI (ej: 42.123.456)"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
          <input
            type="tel"
            required
            placeholder="Teléfono / WhatsApp (11 3637-3331)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs font-bold text-slate-500"
            >
              Atrás
            </button>
            <button
              type="submit"
              className="btn-pill btn-pill-primary px-5 py-2 text-xs font-bold"
            >
              Confirmar Turno
            </button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className="space-y-4 text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-heading font-black text-xl text-[#03387E]">
            ¡Turno Confirmado!
          </h3>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Te esperamos el {formatDate(confirmedBooking?.start_time)} a las{" "}
            {formatTime(confirmedBooking?.start_time)} hs en Mitre 294, Florencio Varela.
          </p>

          <button
            onClick={handleWhatsApp}
            className="btn-pill btn-pill-whatsapp w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Confirmar por WhatsApp</span>
          </button>
        </div>
      )}
    </div>
  );
}
