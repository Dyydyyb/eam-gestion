"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, User, Car, AlertCircle, CheckCircle2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function NewBookingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { services, instructors, vehicles, clients, bookLesson } = useApp();

  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [clientName, setClientName] = useState("");
  const [clientDni, setClientDni] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [instructorId, setInstructorId] = useState(instructors[0]?.id || "");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || "");

  const [date, setDate] = useState("2026-09-19");
  const [time, setTime] = useState("10:00");
  const [comments, setComments] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalName = clientName;
    let finalDni = clientDni;
    let finalPhone = clientPhone;
    let finalEmail = clientEmail;

    if (clientMode === "existing") {
      const c = clients.find((item) => item.id === selectedClientId);
      if (!c) {
        setError("Seleccioná un alumno existente.");
        return;
      }
      finalName = c.full_name;
      finalDni = c.dni;
      finalPhone = c.phone;
      finalEmail = c.email || "";
    } else {
      if (!clientName || !clientDni || !clientPhone) {
        setError("Por favor completá nombre, DNI y teléfono.");
        return;
      }
    }

    const startTime = `${date}T${time}:00-03:00`;
    // Duración de 60 minutos
    const [hours, minutes] = time.split(":").map(Number);
    const endHours = String(hours + 1).padStart(2, "0");
    const endTime = `${date}T${endHours}:${String(minutes).padStart(2, "0")}:00-03:00`;

    const res = bookLesson({
      client_name: finalName,
      client_dni: finalDni,
      client_phone: finalPhone,
      client_email: finalEmail,
      service_id: serviceId,
      instructor_id: instructorId,
      vehicle_id: vehicleId,
      start_time: startTime,
      end_time: endTime,
      comments,
    });

    if (!res.success) {
      setError(res.error || "No se pudo agendar la clase por conflicto de horario.");
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#03387E] text-white">
          <div>
            <span className="eyebrow text-blue-200">Agenda Operativa</span>
            <h3 className="font-heading font-bold text-xl text-white">Agendar Nuevo Turno</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>¡Turno agendado con éxito! Se sincronizó con la agenda.</span>
            </div>
          )}

          {/* Selector de Cliente: Existente o Nuevo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Alumno
            </label>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setClientMode("existing")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  clientMode === "existing"
                    ? "bg-white text-[#03387E] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Alumno Existente
              </button>
              <button
                type="button"
                onClick={() => setClientMode("new")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  clientMode === "new"
                    ? "bg-white text-[#03387E] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Nuevo Alumno
              </button>
            </div>

            {clientMode === "existing" ? (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-[#00A3FF] outline-hidden"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — DNI {c.dni} (Tel: {c.phone})
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre y Apellido"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="DNI (ej: 42.123.456)"
                  value={clientDni}
                  onChange={(e) => setClientDni(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="Teléfono / WhatsApp (ej: 11 3637-3331)"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                />
              </div>
            )}
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Servicio / Clase
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-[#00A3FF] outline-hidden"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ${s.price.toLocaleString("es-AR")} ({s.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Instructor y Vehículo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Instructor
              </label>
              <select
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-[#00A3FF] outline-hidden"
              >
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vehículo
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-[#00A3FF] outline-hidden"
              >
                {vehicles.map((v) => (
                  <option
                    key={v.id}
                    value={v.id}
                    disabled={v.status === "en_taller"}
                  >
                    {v.brand} {v.model} ({v.plate}) {v.status === "en_taller" ? "⚠️ EN TALLER" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-[#00A3FF] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Horario de Inicio
              </label>
              <input
                type="time"
                value={time}
                step="1800"
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-[#00A3FF] outline-hidden"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ej: Primera clase práctica, llevar fotocopia de DNI..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-[#00A3FF] outline-hidden resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-pill btn-pill-primary px-6 py-2 text-sm font-semibold shadow-md cursor-pointer"
            >
              Confirmar Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
