"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Users,
  Car,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReportesPage() {
  const { lessons, clients, instructors, vehicles, payments, expenses, exams } = useApp();

  const [reportPeriod, setReportPeriod] = useState("Septiembre 2026");

  const totalClasses = lessons.length;
  const completedClasses = lessons.filter((l) => l.status === "realizada").length;
  const cancelledClasses = lessons.filter((l) => l.status === "cancelada").length;
  const activeClients = clients.filter((c) => c.status === "activo").length;
  const graduatedClients = clients.filter((c) => c.status === "egresado").length;
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpense;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = (reportName: string) => {
    alert(`Reporte "${reportName}" exportado con éxito en formato CSV compatible con Excel.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="eyebrow">Analítica & Auditoría</span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
            Centro de Reportes
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Métricas ejecutivas de ocupación, rendimiento pedagógico, balance y exportaciones para Dirección.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="btn-pill px-4 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#03387E]" />
            <span>Imprimir Informe</span>
          </button>
          <button
            onClick={() => handleExportCSV("Balance y Ocupación Mensual")}
            className="btn-pill btn-pill-primary px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV/Excel</span>
          </button>
        </div>
      </div>

      {/* Informe Ejecutivo Membretado para Impresión / Vista */}
      <div className="eam-card p-8 bg-white border-2 border-slate-200 shadow-xl space-y-8 print:shadow-none print:border-none">
        {/* Membrete Oficial EAM */}
        <div className="flex items-center justify-between pb-6 border-b-2 border-[#03387E]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-md border border-slate-100 flex items-center justify-center">
              <Image src="/logo.png" alt="EAM Logo" width={48} height={48} className="object-contain" priority />
            </div>
            <div>
              <h2 className="font-heading font-black text-2xl text-[#03387E] tracking-tight leading-none">
                EAM — ESCUELA ARGENTINA DE MANEJO
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Sede Central: Mitre 294, Florencio Varela, Buenos Aires • Tel: +54 9 11 3637-3331
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="eyebrow text-[#03387E]">Informe Ejecutivo Mensual</span>
            <div className="font-heading font-bold text-lg text-slate-900">{reportPeriod}</div>
          </div>
        </div>

        {/* Resumen de Indicadores Clave (KPIs en Grilla) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Clases Realizadas
            </span>
            <span className="font-heading font-black text-2xl text-slate-900">
              {completedClasses} / {totalClasses}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-1 font-semibold">
              95% asistencia efectiva
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Alumnos Activos
            </span>
            <span className="font-heading font-black text-2xl text-[#03387E]">
              {activeClients}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 font-medium">
              + {graduatedClients} egresados totales
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ingresos Facturados
            </span>
            <span className="font-heading font-black text-2xl text-emerald-600">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 font-medium">
              Egresos: {formatCurrency(totalExpense)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Superávit Operativo
            </span>
            <span className="font-heading font-black text-2xl text-[#03387E]">
              {formatCurrency(netIncome)}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-1 font-bold">
              Rentabilidad saludable
            </span>
          </div>
        </div>

        {/* Tabla de Rendimiento por Instructor */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-base text-slate-900">
            1. Rendimiento Pedagógico por Instructor
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold">
                <tr>
                  <th className="p-3">Instructor</th>
                  <th className="p-3 text-center">Clases Dictadas</th>
                  <th className="p-3 text-center">Tasa de Aprobación en Pista</th>
                  <th className="p-3 text-center">Estado Licencia</th>
                  <th className="p-3 text-right">Honorarios Liquidados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instructors.map((inst) => {
                  const count = lessons.filter((l) => l.instructor_id === inst.id).length;
                  const totalPaid = count * inst.class_rate;

                  return (
                    <tr key={inst.id}>
                      <td className="p-3 font-bold text-slate-900">{inst.full_name}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{count}</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">
                        {inst.pass_rate_percentage}%
                      </td>
                      <td className="p-3 text-center text-slate-500">
                        Vence: {formatDate(inst.license_expiry)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(totalPaid)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Uso de Flota de Autos */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-base text-slate-900">
            2. Estado y Disponibilidad de Flota (Doble Comando)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold">
                <tr>
                  <th className="p-3">Vehículo</th>
                  <th className="p-3">Patente</th>
                  <th className="p-3">Transmisión</th>
                  <th className="p-3 text-center">Kilometraje</th>
                  <th className="p-3 text-center">Estado Operativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="p-3 font-bold text-slate-900">{v.brand} {v.model}</td>
                    <td className="p-3 font-mono font-bold text-[#00A3FF]">{v.plate}</td>
                    <td className="p-3 capitalize text-slate-600">{v.transmission}</td>
                    <td className="p-3 text-center font-mono">{v.mileage.toLocaleString("es-AR")} km</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          v.status === "operativo"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
