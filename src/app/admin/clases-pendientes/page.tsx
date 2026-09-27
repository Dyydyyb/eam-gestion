"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Search,
  ArrowRight,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { messagingService } from "@/lib/messaging";
import { formatDate, formatTime } from "@/lib/utils";

export default function ClasesPendientesPage() {
  const { clients, lessons, deleteLesson } = useApp();
  const [searchTerm, setSearchTerm] = useState("");

  // Estructura de seguimiento de packs por alumno
  const trackingData = clients.map((client) => {
    const clientLessons = lessons.filter((l) => l.client_id === client.id);
    const completedCount = clientLessons.filter((l) => l.status === "realizada").length;
    const totalContracted = client.status === "egresado" ? 10 : 10; // Pack estándar de 10 clases
    const remaining = Math.max(0, totalContracted - completedCount);
    const scheduledUpcoming = clientLessons.filter((l) => l.status === "confirmada").length;

    // Calcular días desde la última clase o inactividad
    const lastLesson = clientLessons[clientLessons.length - 1];
    const isInactive = scheduledUpcoming === 0 && remaining > 0;

    return {
      client,
      totalContracted,
      completedCount,
      remaining,
      scheduledUpcoming,
      isInactive,
      lastDate: lastLesson ? lastLesson.start_time : client.created_at,
    };
  });

  const filtered = trackingData.filter(
    (item) =>
      item.client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client.dni.includes(searchTerm)
  );

  const inactiveCount = trackingData.filter((i) => i.isInactive).length;

  const handleContactWhatsApp = (clientName: string, phone: string, remaining: number) => {
    const text = `¡Hola ${clientName}! Te escribimos de EAM Escuela de Manejo Florencio Varela. Notamos que todavía te quedan ${remaining} clases prácticas disponibles en tu pack. ¿Te gustaría agendar la próxima clase para esta semana? ¡Escribinos y coordinamos el horario! 🚗`;
    const url = messagingService.generateWhatsAppLink(phone, text);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="eyebrow">Control de Cursada</span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
            Clases Pendientes y Packs
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Seguimiento de clases contratadas vs. tomadas vs. restantes por cada alumno matriculado.
          </p>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por alumno o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-full focus:border-[#00A3FF] outline-hidden shadow-2xs"
          />
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="eam-card p-5 border-l-4 border-l-[#03387E]">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Alumnos con Cursada Activa
          </div>
          <div className="font-heading font-black text-3xl text-slate-900">
            {trackingData.filter((t) => t.remaining > 0).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Con saldo de clases disponibles</div>
        </div>

        <div className="eam-card p-5 border-l-4 border-l-amber-500">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Alumnos Sin Turnos Agendados
          </div>
          <div className="font-heading font-black text-3xl text-amber-600">
            {inactiveCount}
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            Riesgo de abandono o pausa prolongada
          </div>
        </div>

        <div className="eam-card p-5 border-l-4 border-l-emerald-500">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Clases Restantes en Circulación
          </div>
          <div className="font-heading font-black text-3xl text-emerald-600">
            {trackingData.reduce((sum, t) => sum + t.remaining, 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Clases prácticas por dictar</div>
        </div>
      </div>

      {/* Tabla de Alumnos y Packs */}
      <div className="eam-card overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-800">
            Estado de Packs por Alumno ({filtered.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Formato: Contratadas • Tomadas • Restantes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Alumno / DNI</th>
                <th className="py-3 px-4 text-center">Progreso de Clases</th>
                <th className="py-3 px-4 text-center">Restantes</th>
                <th className="py-3 px-4 text-center">Próximo Turno</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(({ client, totalContracted, completedCount, remaining, scheduledUpcoming, isInactive }) => {
                const percentage = Math.round((completedCount / totalContracted) * 100);

                return (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/clientes/${client.id}`}
                        className="font-bold text-slate-900 hover:text-[#00A3FF] transition-colors"
                      >
                        {client.full_name}
                      </Link>
                      <div className="text-xs text-slate-500">
                        DNI {client.dni} • Tel: {client.phone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="w-48 mx-auto">
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>{completedCount} tomadas</span>
                          <span>{totalContracted} total</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#00A3FF] h-full rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-heading font-black text-base text-[#03387E]">
                        {remaining}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center text-xs">
                      {scheduledUpcoming > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <Calendar className="w-3.5 h-3.5" />
                          {scheduledUpcoming} agendado(s)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Sin turno
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          client.status === "egresado"
                            ? "bg-purple-100 text-purple-800"
                            : isInactive
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {client.status === "egresado" ? "Egresado" : isInactive ? "Inactivo" : "En Cursada"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isInactive ? (
                        <button
                          onClick={() => handleContactWhatsApp(client.full_name, client.phone, remaining)}
                          className="btn-pill btn-pill-whatsapp px-3 py-1 text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          title="Enviar mensaje de reactivación por WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reactivar</span>
                        </button>
                      ) : (
                        <Link
                          href={`/admin/clientes/${client.id}`}
                          className="text-xs font-bold text-[#00A3FF] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Ver Ficha</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla 2: Listado de Clases Pendientes Programadas con opción de eliminación */}
      <div className="eam-card overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00A3FF]" />
              <span>Turnos y Clases Prácticas Pendientes ({lessons.filter((l) => l.status === "confirmada" || l.status === "pendiente").length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Clases asignadas en agenda que aún no fueron completadas. Podés cancelar o eliminar cualquier turno.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Alumno</th>
                <th className="py-3 px-4">Fecha y Horario</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Vehículo</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lessons
                .filter((l) => l.status === "confirmada" || l.status === "pendiente")
                .map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{lesson.client_name}</div>
                      <div className="text-xs text-slate-500">Tel: {lesson.client_phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{formatDate(lesson.start_time)}</div>
                      <div className="text-xs text-[#00A3FF] font-bold">
                        {formatTime(lesson.start_time)} a {formatTime(lesson.end_time)} hs
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold text-slate-700">{lesson.instructor_name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-600">{lesson.vehicle_model}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 capitalize">
                        {lesson.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar el turno de ${lesson.client_name} del ${formatDate(lesson.start_time)}?`)) {
                            deleteLesson(lesson.id);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Eliminar clase / turno pendiente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Turno</span>
                      </button>
                    </td>
                  </tr>
                ))}
              {lessons.filter((l) => l.status === "confirmada" || l.status === "pendiente").length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    No hay clases pendientes programadas en este momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
