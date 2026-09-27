"use client";

import React, { useState } from "react";
import {
  Settings,
  Building,
  Clock,
  Shield,
  Save,
  Users,
  Calendar,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function ConfiguracionPage() {
  const { services, role, setRole } = useApp();

  const [schoolName, setSchoolName] = useState("EAM - Escuela Argentina de Manejo");
  const [schoolAddress, setSchoolAddress] = useState("Mitre 294, Florencio Varela, Buenos Aires");
  const [schoolPhone, setSchoolPhone] = useState("+54 9 11 3637-3331");
  const [minNoticeBooking, setMinNoticeBooking] = useState(12);
  const [minNoticeCancel, setMinNoticeCancel] = useState(24);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="eyebrow">Ajustes Generales</span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
            Configuración del Sistema
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Datos institucionales de la sede, políticas de cancelación, horarios y control de roles.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configuración guardada</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sección 1: Datos de la Escuela */}
        <div className="eam-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-heading font-bold text-base text-slate-900">
            <Building className="w-5 h-5 text-[#03387E]" />
            <span>Sede Central & Contacto</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Nombre de la Escuela
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Teléfono Oficial (WhatsApp)
              </label>
              <input
                type="text"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Dirección de la Sede & Pista
              </label>
              <input
                type="text"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Políticas de Reserva y Cancelación */}
        <div className="eam-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-heading font-bold text-base text-slate-900">
            <Clock className="w-5 h-5 text-[#00A3FF]" />
            <span>Políticas de Turnos Online</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Anticipación mínima para reservar (Horas)
              </label>
              <input
                type="number"
                value={minNoticeBooking}
                onChange={(e) => setMinNoticeBooking(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Los clientes no podrán agendar con menos de {minNoticeBooking} hs de anticipación.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Anticipación mínima para cancelar sin penalidad (Horas)
              </label>
              <input
                type="number"
                value={minNoticeCancel}
                onChange={(e) => setMinNoticeCancel(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Plazo exigido para cancelar turnos desde el link público ({minNoticeCancel} hs).
              </span>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoConfirm"
                checked={autoConfirm}
                onChange={(e) => setAutoConfirm(e.target.checked)}
                className="w-4 h-4 rounded text-[#00A3FF]"
              />
              <label htmlFor="autoConfirm" className="font-bold text-slate-800 cursor-pointer">
                Confirmación automática de reservas online (aparece inmediatamente en la agenda)
              </label>
            </div>
          </div>
        </div>

        {/* Sección 3: Control de Roles (RBAC) */}
        <div className="eam-card p-6 space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-heading font-bold text-base text-slate-900">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>Usuarios & Roles (RBAC)</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            El sistema cuenta con 4 roles bien diferenciados según permisos de Supabase RLS:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block font-bold">1. Administrador / Dueño</strong>
              <span className="text-slate-500 text-[11px]">Acceso total: finanzas, auditoría, configuración y reportes.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block font-bold">2. Recepción / Secretaría</strong>
              <span className="text-slate-500 text-[11px]">Agenda, clientes, cobros de caja, WhatsApp y asignaciones.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block font-bold">3. Instructor Docente</strong>
              <span className="text-slate-500 text-[11px]">Cierre de clases, asistencia y checklist pedagógico.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block font-bold">4. Contador / Finanzas</strong>
              <span className="text-slate-500 text-[11px]">Ingresos, gastos, caja diaria y liquidaciones de instructores.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="btn-pill btn-pill-primary px-8 py-3 text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Toda la Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
}
