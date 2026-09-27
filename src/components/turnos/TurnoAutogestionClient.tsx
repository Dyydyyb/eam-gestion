"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Car,
  User,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatDate, formatTime } from "@/lib/utils";
import { messagingService } from "@/lib/messaging";

export default function TurnoAutogestionPage() {
  const params = useParams();
  const token = params?.token as string;
  const { lessons, updateLessonStatus } = useApp();

  const lesson = lessons.find((l) => l.public_token === token) || lessons[0];
  const [cancelled, setCancelled] = useState(lesson?.status === "cancelada");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="eam-card p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-slate-900 mb-2">Turno no encontrado</h2>
          <p className="text-xs text-slate-500 mb-6">
            El enlace ingresado no corresponde a ninguna reserva activa.
          </p>
          <Link href="/reservar" className="btn-pill btn-pill-primary px-6 py-2.5 text-xs font-bold">
            Reservar un Turno
          </Link>
        </div>
      </div>
    );
  }

  const handleCancel = () => {
    setCancelError(null);

    // Validación política 24 horas
    const lessonTime = new Date(lesson.start_time).getTime();
    const now = new Date().getTime();
    const hoursDiff = (lessonTime - now) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      setCancelError(
        "Las cancelaciones deben realizarse con al menos 24 horas de anticipación. Por favor comunicate por WhatsApp con la secretaría de EAM."
      );
      return;
    }

    updateLessonStatus(lesson.id, "cancelada", cancelReason || "Cancelado por el alumno desde la web");
    setCancelled(true);
    setCancelModalOpen(false);
  };

  const handleContactWhatsApp = () => {
    const text = `¡Hola! Me comunico respecto a mi turno en EAM (Reserva #${lesson.id.substring(0, 6)}).`;
    const url = messagingService.generateWhatsAppLink("5491136373331", text);
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#00A3FF] selection:text-white">
      {/* Header Institucional */}
      <header className="bg-[#03387E] text-white h-20 flex items-center shadow-md">
        <div className="max-w-4xl mx-auto px-4 w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shadow-md">
              <Image src="/logo.png" alt="EAM Logo" width={32} height={32} className="object-contain" priority />
            </div>
            <div>
              <div className="font-heading font-black text-lg leading-none">
                EAM <span className="text-[#00A3FF]">GESTIÓN</span>
              </div>
              <div className="text-[11px] text-blue-200">Autogestión de Turnos</div>
            </div>
          </Link>

          <Link href="/reservar" className="text-xs font-bold text-blue-200 hover:text-white">
            Nueva Reserva
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="eyebrow">Autogestión de Reserva</span>
            <h1 className="font-heading font-black text-3xl text-[#03387E] tracking-tight">
              Detalle de tu Clase de Manejo
            </h1>
            <p className="text-sm text-slate-500">
              Podés consultar los datos de tu turno, contactar a la escuela o cancelar con 24h de anticipación.
            </p>
          </div>

          {/* Tarjeta del Turno */}
          <div className="eam-card p-6 md:p-8 bg-white border-2 border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Estado del Turno
                </span>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    cancelled
                      ? "bg-red-100 text-red-800"
                      : lesson.status === "realizada"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-[#03387E]"
                  }`}
                >
                  {cancelled ? "Cancelado" : lesson.status}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Código de Reserva
                </span>
                <span className="font-mono font-bold text-sm text-slate-800">
                  #{lesson.id.substring(0, 8)}
                </span>
              </div>
            </div>

            {/* Detalles */}
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#00A3FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Día y Horario</div>
                  <div className="font-bold text-slate-900 text-base">
                    {formatDate(lesson.start_time)} a las {formatTime(lesson.start_time)} hs
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[#03387E] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Instructor Asignado</div>
                  <div className="font-bold text-slate-900 text-base">{lesson.instructor_name}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Vehículo con Doble Comando</div>
                  <div className="font-bold text-slate-900 text-base">
                    {lesson.vehicle_model} ({lesson.vehicle_plate})
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Punto de Encuentro</div>
                  <div className="font-bold text-slate-900 text-base">{lesson.pickup_address}</div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleContactWhatsApp}
                className="btn-pill btn-pill-whatsapp w-full sm:w-auto flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contactar Secretaría por WhatsApp</span>
              </button>

              {!cancelled && (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-full border border-red-200 transition-colors"
                >
                  Cancelar Turno
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Cancelación */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-slate-900">¿Deseás cancelar tu turno?</h3>
            <p className="text-xs text-slate-600">
              Recordá que las cancelaciones deben realizarse con al menos 24 hs de anticipación para no perder la clase.
            </p>

            {cancelError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo de la cancelación
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej: Compromiso laboral imprevisto..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full"
              >
                Volver
              </button>
              <button
                onClick={handleCancel}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
