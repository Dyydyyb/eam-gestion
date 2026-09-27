"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  Bell,
  Search,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Car,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { UserRole } from "@/lib/types";

export function AdminHeader({
  onMenuClick,
  onNewBookingClick,
}: {
  onMenuClick: () => void;
  onNewBookingClick: () => void;
}) {
  const { role, setRole, vehicles, lessons } = useApp();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Alertas de mantenimiento o vencimientos
  const maintenanceAlerts = vehicles.filter((v) => v.status === "en_taller");
  const pendingReminders = lessons.filter(
    (l) => !l.whatsapp_reminder_sent && l.status === "confirmada"
  );
  const totalAlerts = maintenanceAlerts.length + (pendingReminders.length > 0 ? 1 : 0);

  const roleLabels: Record<UserRole, { label: string; bg: string; text: string }> = {
    admin: { label: "Administrador / Dueño", bg: "bg-indigo-100", text: "text-indigo-800" },
    recepcion: { label: "Recepción / Secretaría", bg: "bg-emerald-100", text: "text-emerald-800" },
    instructor: { label: "Instructor Docente", bg: "bg-blue-100", text: "text-blue-800" },
    finanzas: { label: "Contador / Finanzas", bg: "bg-amber-100", text: "text-amber-800" },
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 md:px-8 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-hidden"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Mobile Logo Brand */}
        <Link href="/admin/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-white p-0.5 shadow-xs border border-slate-200 flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="EAM Logo" width={28} height={28} className="object-contain" priority />
          </div>
          <span className="font-heading font-black text-sm text-[#03387E] tracking-tight">
            EAM <span className="text-[#00A3FF]">GESTIÓN</span>
          </span>
        </Link>

        {/* Buscador Rápido Global */}
        <div className="relative hidden md:block w-72 lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por DNI, alumno, instructor o patente..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-[#00A3FF] rounded-full transition-all outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Selector interactivo de Rol para testing / demo */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 py-1 px-3 rounded-full border border-slate-200 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#03387E]" />
          <span className="text-slate-500 font-medium">Modo:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-transparent font-bold text-slate-800 border-none outline-hidden cursor-pointer hover:text-[#00A3FF] transition-colors"
          >
            <option value="admin">Admin / Dueño</option>
            <option value="recepcion">Recepción</option>
            <option value="instructor">Instructor</option>
            <option value="finanzas">Finanzas</option>
          </select>
        </div>

        {/* Botón rápido "+ Nuevo Turno" */}
        <button
          onClick={onNewBookingClick}
          className="btn-pill btn-pill-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Nuevo Turno</span>
        </button>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2.5 rounded-full text-slate-600 hover:text-[#03387E] hover:bg-slate-100 transition-colors focus:outline-hidden"
            aria-label="Ver notificaciones"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Menú de Notificaciones */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-heading font-bold text-slate-900 text-sm">Alertas Operativas</h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#03387E]">
                  {totalAlerts} pendientes
                </span>
              </div>

              <div className="py-2 space-y-2 max-h-80 overflow-y-auto">
                {maintenanceAlerts.map((veh) => (
                  <div
                    key={veh.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs"
                  >
                    <Car className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900">Vehículo en Taller:</span>{" "}
                      <span className="text-amber-800">
                        {veh.brand} {veh.model} ({veh.plate}) está bloqueado para nuevas reservas.
                      </span>
                    </div>
                  </div>
                ))}

                {pendingReminders.length > 0 && (
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                    <Clock className="w-4 h-4 text-[#00A3FF] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-900">Recordatorios por Enviar:</span>{" "}
                      <span className="text-blue-800">
                        Hay {pendingReminders.length} turnos programados pendientes de confirmación por WhatsApp.
                      </span>
                    </div>
                  </div>
                )}

                {totalAlerts === 0 && (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                    No hay alertas urgentes pendientes. ¡Todo en orden!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Perfil del Usuario Activo */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="relative w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 shadow-xs border border-slate-200 overflow-hidden ring-2 ring-[#00A3FF]/30">
            <Image src="/logo.png" alt="EAM Logo Oficial" width={32} height={32} className="object-contain" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-sm font-bold text-slate-800 leading-tight">Secretaría Central</span>
            <span className="text-[11px] text-slate-500 font-medium">Sede Florencio Varela</span>
          </div>
        </div>
      </div>
    </header>
  );
}
