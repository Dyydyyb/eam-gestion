"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  FileText,
  ShieldCheck,
  Check,
  Edit,
  Layers,
  Car,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { INITIAL_SKILLS } from "@/lib/mock-data";
import { messagingService, DEFAULT_TEMPLATES } from "@/lib/messaging";
import { SkillItem } from "@/lib/types";

export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;

  const { clients, lessons, payments, exams, updateClient, packageAssignments } = useApp();

  const client = clients.find((c) => c.id === clientId) || clients[0];
  const clientLessons = lessons.filter((l) => l.client_id === client?.id);
  const clientPayments = payments.filter((p) => p.client_id === client?.id);
  const clientExam = exams.find((e) => e.client_id === client?.id);
  const clientAssignment = packageAssignments.find((a) => a.client_id === client?.id);

  // Checklist de habilidades local
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [notes, setNotes] = useState(client?.notes || "");
  const [status, setStatus] = useState(client?.status || "activo");

  if (!client) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">Alumno no encontrado</h2>
        <Link href="/admin/clientes" className="btn-pill btn-pill-primary mt-4 inline-block px-4 py-2">
          Volver al listado
        </Link>
      </div>
    );
  }

  const toggleSkillStatus = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id !== skillId) return s;
        const nextStatus =
          s.status === "no_iniciado"
            ? "en_practica"
            : s.status === "en_practica"
            ? "dominado"
            : "no_iniciado";
        return { ...s, status: nextStatus };
      })
    );
  };

  const handleSaveNotes = () => {
    updateClient(client.id, { notes, status });
    alert("Ficha del alumno actualizada correctamente.");
  };

  const handleSendWhatsApp = () => {
    const text = `¡Hola ${client.full_name}! Te saludamos desde EAM Escuela de Manejo Florencio Varela. Nos ponemos en contacto respecto a tus clases de manejo. ¡Escribinos ante cualquier consulta! 🚗`;
    const url = messagingService.generateWhatsAppLink(client.phone, text);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Volver */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/clientes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#03387E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de alumnos</span>
        </Link>

        <button
          onClick={handleSendWhatsApp}
          className="btn-pill btn-pill-whatsapp px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Enviar WhatsApp al Alumno</span>
        </button>
      </div>

      {/* Tarjeta Principal del Alumno */}
      <div className="eam-card p-6 md:p-8 bg-linear-to-r from-white via-white to-blue-50/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#03387E] text-white flex items-center justify-center font-heading font-black text-2xl shadow-lg shadow-[#03387E]/20">
              {client.full_name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tight">
                  {client.full_name}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#03387E] capitalize">
                  {client.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                <span>DNI: <strong className="text-slate-700">{client.dni}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <strong className="text-slate-700">{client.phone}</strong>
                </span>
                {client.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {client.email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Estado de Cuenta Corriente */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Saldo en Cuenta Corriente
              </div>
              <div className="font-heading font-black text-xl text-slate-900">
                {client.balance_due && client.balance_due > 0 ? (
                  <span className="text-red-600">{formatCurrency(client.balance_due)}</span>
                ) : (
                  <span className="text-emerald-600">Al día ($0)</span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00A3FF] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Plan de Clases y Aranceles Asignados */}
      <div className="eam-card p-6 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#03387E] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="eyebrow">Plan de Formación & Aranceles</span>
              <h3 className="font-heading font-bold text-lg text-slate-900">
                {clientAssignment ? clientAssignment.service_name : "Sin Plan Asignado"}
              </h3>
            </div>
          </div>

          <Link
            href="/admin/packs"
            className="btn-pill btn-pill-outline px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 self-start md:self-center cursor-pointer hover:bg-slate-50"
          >
            <Edit className="w-3.5 h-3.5 text-[#00A3FF]" />
            <span>Gestionar en Packs & Aranceles</span>
          </Link>
        </div>

        {clientAssignment ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Progreso de Clases</div>
              <div className="font-heading font-black text-base text-slate-900 mt-0.5">
                {clientAssignment.classes_taken} de {clientAssignment.class_count} clases
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-[#00A3FF] h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round((clientAssignment.classes_taken / clientAssignment.class_count) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Arancel de Clases</div>
              <div className="font-heading font-black text-base text-[#03387E] mt-0.5">
                {formatCurrency(clientAssignment.price_agreed)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {clientAssignment.is_custom ? "Precio personalizado" : "Tarifa oficial"}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Alquiler Auto Examen</div>
              <div className="font-heading font-black text-base text-slate-900 mt-0.5">
                {clientAssignment.includes_exam_car_rental ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>{formatCurrency(clientAssignment.exam_car_rental_fee)}</span>
                  </span>
                ) : (
                  <span className="text-slate-400">No incluido</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {clientAssignment.includes_exam_car_rental ? "Pista Florencio Varela" : "Opcional"}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Total & Saldo</div>
              <div className="font-heading font-black text-base text-slate-900 mt-0.5">
                {formatCurrency(clientAssignment.total_amount)}
              </div>
              <div className="text-[11px] font-bold mt-1">
                {clientAssignment.balance_due === 0 ? (
                  <span className="text-emerald-600">✓ Abonado completo</span>
                ) : (
                  <span className="text-amber-600">Resta {formatCurrency(clientAssignment.balance_due)}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
            Este alumno todavía no tiene un pack o clase personalizada asignada. Podés asignarle su plan desde la sección{" "}
            <Link href="/admin/packs" className="font-bold text-[#00A3FF] hover:underline">
              Packs y Aranceles
            </Link>
            .
          </div>
        )}
      </div>

      {/* Grid de 2 Columnas: Evolución de Habilidades vs Historial de Clases y Examen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna 1: Checklist de Habilidades de Manejo */}
        <div className="eam-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="eyebrow">Pedagogía EAM</span>
              <h3 className="font-heading font-bold text-lg text-[#03387E]">
                Evolución del Aprendizaje Práctico
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {skills.filter((s) => s.status === "dominado").length} de {skills.length} dominadas
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Hacé clic en cualquier habilidad para alternar su estado entre:{" "}
            <span className="font-semibold text-slate-600">No iniciado</span> →{" "}
            <span className="font-semibold text-amber-600">En práctica</span> →{" "}
            <span className="font-semibold text-emerald-600">Dominado</span>.
          </p>

          <div className="space-y-2.5">
            {skills.map((skill) => {
              const isDone = skill.status === "dominado";
              const isPracticing = skill.status === "en_practica";

              return (
                <div
                  key={skill.id}
                  onClick={() => toggleSkillStatus(skill.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 hover:scale-[1.01] ${
                    isDone
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : isPracticing
                      ? "bg-amber-50/70 border-amber-200 text-amber-900"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{skill.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{skill.description}</div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      isDone
                        ? "bg-emerald-200 text-emerald-900"
                        : isPracticing
                        ? "bg-amber-200 text-amber-900"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isDone ? "Dominado ✓" : isPracticing ? "En práctica" : "Pendiente"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Notas internas del Alumno */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notas y Observaciones del Equipo
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:border-[#00A3FF] resize-none"
              placeholder="Anotaciones de instructores o secretaría..."
            />
            <button
              onClick={handleSaveNotes}
              className="btn-pill btn-pill-primary mt-2 px-4 py-1.5 text-xs font-bold float-right"
            >
              Guardar Notas
            </button>
          </div>
        </div>

        {/* Columna 2: Historial de Clases y Examen */}
        <div className="space-y-6">
          {/* Tarjeta de Examen Municipal */}
          <div className="eam-card p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Examen de Conducir (Pista Varela)
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  clientExam?.result === "aprobado"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {clientExam?.result === "aprobado" ? "APROBADO 🎓" : "PENDIENTE"}
              </span>
            </div>

            {clientExam ? (
              <div className="text-xs space-y-1 text-slate-600">
                <div>Fecha: <strong>{formatDate(clientExam.exam_date)}</strong></div>
                <div>Lugar: <strong>{clientExam.location}</strong> (Intento #{clientExam.attempt_number})</div>
                <div className="text-slate-500 italic mt-1">"{clientExam.notes}"</div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                El alumno aún no tiene fecha agendada para rendir en la pista de examen.
              </p>
            )}
          </div>

          {/* Historial de Clases Dictadas */}
          <div className="eam-card p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#03387E]" />
                Historial de Clases ({clientLessons.length})
              </h3>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {clientLessons.map((l) => (
                <div
                  key={l.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {formatDate(l.start_time)} • {formatTime(l.start_time)} hs
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Instructor: {l.instructor_name} • Auto: {l.vehicle_model}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      l.status === "realizada"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              ))}

              {clientLessons.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Sin clases registradas aún.
                </div>
              )}
            </div>
          </div>

          {/* Historial de Pagos y Comprobantes */}
          <div className="eam-card p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Pagos Registrados ({clientPayments.length})
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              {clientPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                    <span className="text-slate-400 text-[11px] ml-2">({p.payment_method})</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{p.receipt_number}</span>
                </div>
              ))}

              {clientPayments.length === 0 && (
                <div className="py-4 text-center text-slate-400 text-xs">
                  Sin pagos registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
