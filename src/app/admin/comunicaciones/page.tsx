"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  User,
  Calendar,
  Sparkles,
  Edit3,
  Copy,
  Check,
  Play,
  RotateCcw,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatDate, formatTime } from "@/lib/utils";
import { messagingService, DEFAULT_TEMPLATES } from "@/lib/messaging";
import { Lesson, MessageTemplate } from "@/lib/types";

export default function ComunicacionesPage() {
  const { lessons, templates, markReminderSent } = useApp();

  const [activeTab, setActiveTab] = useState<"cola" | "plantillas" | "historial">("cola");
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState("");

  // Cola de recordatorios (turnos confirmados de próximas 24/48h)
  const pendingLessons = lessons.filter(
    (l) => !l.whatsapp_reminder_sent && l.status === "confirmada"
  );
  const sentLessons = lessons.filter((l) => l.whatsapp_reminder_sent);

  // Modo "Enviar a Todos" guiado
  const [batchIndex, setBatchIndex] = useState<number | null>(null);

  const handleSendSingle = (lesson: Lesson) => {
    const template =
      templates.find((t) => t.code === "recordatorio_turno")?.content ||
      DEFAULT_TEMPLATES[0].content;

    const text = messagingService.buildMessage(template, {
      nombre: lesson.client_name || "Alumno",
      fecha: formatDate(lesson.start_time),
      hora: formatTime(lesson.start_time),
      instructor: lesson.instructor_name || "Asignado",
      vehiculo: `${lesson.vehicle_model || ""} (${lesson.vehicle_plate || ""})`,
      direccion: lesson.pickup_address,
      link_reprogramar: `http://localhost:3000/reservar/turno/${lesson.public_token}`,
    });

    const url = messagingService.generateWhatsAppLink(lesson.client_phone || "", text);
    window.open(url, "_blank");
    markReminderSent(lesson.id);
  };

  const startBatchSend = () => {
    if (pendingLessons.length === 0) return;
    setBatchIndex(0);
    handleSendSingle(pendingLessons[0]);
  };

  const nextBatchStep = () => {
    if (batchIndex === null) return;
    const next = batchIndex + 1;
    if (next < pendingLessons.length) {
      setBatchIndex(next);
      handleSendSingle(pendingLessons[next]);
    } else {
      setBatchIndex(null);
      alert("¡Se recorrió toda la cola de recordatorios con éxito!");
    }
  };

  const handleEditTemplate = (tmpl: MessageTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateContent(tmpl.content);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    editingTemplate.content = templateContent;
    setEditingTemplate(null);
    alert("Plantilla actualizada con éxito.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="eyebrow">Comunicaciones & WhatsApp</span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
            Recordatorios Asistidos (wa.me)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Envío manual asistido con teléfono normalizado (+54 9...) y plantillas dinámicas sin costos de API.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold shadow-2xs">
          <button
            onClick={() => setActiveTab("cola")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "cola" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cola Pendiente ({pendingLessons.length})
          </button>
          <button
            onClick={() => setActiveTab("plantillas")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "plantillas" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Plantillas ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "historial" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Enviados ({sentLessons.length})
          </button>
        </div>
      </div>

      {/* TAB 1: COLA DE RECORDATORIOS PENDIENTES */}
      {activeTab === "cola" && (
        <div className="space-y-6">
          {/* Banner Acción Masiva */}
          <div className="eam-card p-6 bg-linear-to-r from-emerald-50 via-white to-white border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Cola de Próximas 24/48 Horas
                </h3>
                <p className="text-xs text-slate-600">
                  Hay <strong>{pendingLessons.length} alumnos</strong> con clases agendadas esperando recordatorio de turno.
                </p>
              </div>
            </div>

            {pendingLessons.length > 0 && (
              <button
                onClick={startBatchSend}
                className="btn-pill btn-pill-whatsapp px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer shrink-0"
              >
                <Play className="w-4 h-4" />
                <span>Iniciar "Enviar a Todos" (Guiado)</span>
              </button>
            )}
          </div>

          {/* Modal flotante de lote si está activo */}
          {batchIndex !== null && pendingLessons[batchIndex] && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00A3FF] animate-spin" />
                <span>
                  Enviando recordatorio <strong>{batchIndex + 1}</strong> de{" "}
                  <strong>{pendingLessons.length}</strong>:{" "}
                  <strong>{pendingLessons[batchIndex].client_name}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={nextBatchStep}
                  className="btn-pill btn-pill-primary px-4 py-1.5 text-xs font-bold"
                >
                  Siguiente Alumno →
                </button>
                <button
                  onClick={() => setBatchIndex(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancelar lote
                </button>
              </div>
            </div>
          )}

          {/* Lista de Turnos Pendientes */}
          <div className="eam-card overflow-hidden">
            <div className="divide-y divide-slate-100">
              {pendingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#03387E] flex items-center justify-center font-bold shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {lesson.client_name}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        WhatsApp: <strong className="text-slate-700 font-mono">{lesson.client_phone}</strong> • Clase: {lesson.service_name}
                      </div>
                      <div className="text-slate-600 mt-1">
                        Fecha: <strong>{formatDate(lesson.start_time)} a las {formatTime(lesson.start_time)} hs</strong> • Instructor: {lesson.instructor_name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendSingle(lesson)}
                    className="btn-pill btn-pill-whatsapp px-4 py-2 font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer self-end sm:self-center"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enviar Recordatorio</span>
                  </button>
                </div>
              ))}

              {pendingLessons.length === 0 && (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <div className="font-bold text-slate-800 text-sm">¡Todos los recordatorios enviados!</div>
                  <p className="text-xs">No hay clases pendientes de notificación en las próximas 48 hs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EDITOR DE PLANTILLAS DINÁMICAS */}
      {activeTab === "plantillas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="eam-card p-6 flex flex-col justify-between border-2 border-transparent hover:border-[#00A3FF]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A3FF]">
                      Código: {tmpl.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Activa
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 mb-2">
                    {tmpl.title}
                  </h3>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap mb-4">
                    {tmpl.content}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Variables: {"{nombre}, {fecha}, {hora}, {instructor}, {vehiculo}"}
                  </span>
                  <button
                    onClick={() => handleEditTemplate(tmpl)}
                    className="btn-pill px-3 py-1.5 text-xs font-bold text-[#03387E] bg-blue-50 hover:bg-blue-100 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Edición de Plantilla */}
          {editingTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg text-[#03387E]">
                    Editar Plantilla: {editingTemplate.title}
                  </h3>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Podés usar los siguientes comodines dinámicos:{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-[#03387E]">{"{nombre}"}</code>,{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-[#03387E]">{"{fecha}"}</code>,{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-[#03387E]">{"{hora}"}</code>,{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-[#03387E]">{"{instructor}"}</code>,{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-[#03387E]">{"{vehiculo}"}</code>,{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-[#03387E]">{"{link_reprogramar}"}</code>.
                </p>

                <textarea
                  rows={6}
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:border-[#00A3FF] font-mono leading-relaxed"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="btn-pill btn-pill-primary px-5 py-2 text-xs font-bold"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HISTORIAL DE MENSAJES ENVIADOS */}
      {activeTab === "historial" && (
        <div className="eam-card overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-800">
              Historial de Recordatorios Enviados ({sentLessons.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Auditoría en tiempo real</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {sentLessons.map((l) => (
              <div key={l.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{l.client_name}</div>
                  <div className="text-slate-500 text-[11px]">
                    Teléfono: {l.client_phone} • Clase: {formatDate(l.start_time)} a las {formatTime(l.start_time)} hs
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Enviado
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {l.whatsapp_reminder_sent_at ? formatDate(l.whatsapp_reminder_sent_at) : "Hoy"}
                  </div>
                </div>
              </div>
            ))}

            {sentLessons.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aún no hay recordatorios registrados como enviados.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
