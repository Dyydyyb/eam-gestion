"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Phone,
  Mail,
  Award,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Instructor } from "@/lib/types";

export default function PersonalPage() {
  const { instructors, lessons, updateInstructor, addInstructor, deleteInstructor } = useApp();
  const [selectedMonth, setSelectedMonth] = useState("Septiembre 2026");

  // Modal de Edición / Alta
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("2028-12-31");
  const [classRate, setClassRate] = useState(24000);
  const [commissionRate, setCommissionRate] = useState(65);
  const [status, setStatus] = useState<Instructor["status"]>("activo");

  const openEditModal = (inst: Instructor) => {
    setEditingId(inst.id);
    setFullName(inst.full_name);
    setDni(inst.dni);
    setPhone(inst.phone);
    setEmail(inst.email);
    setLicenseNumber(inst.license_number);
    setLicenseExpiry(inst.license_expiry);
    setClassRate(inst.class_rate || 24000);
    setCommissionRate(inst.commission_rate ?? 65);
    setStatus(inst.status);
    setModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setFullName("");
    setDni("");
    setPhone("");
    setEmail("");
    setLicenseNumber("");
    setLicenseExpiry("2028-12-31");
    setClassRate(24000);
    setCommissionRate(65);
    setStatus("activo");
    setModalOpen(true);
  };

  const handleSaveInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dni || !phone) return;

    if (editingId) {
      updateInstructor(editingId, {
        full_name: fullName,
        dni,
        phone,
        email,
        license_number: licenseNumber,
        license_expiry: licenseExpiry,
        class_rate: Number(classRate),
        commission_rate: Number(commissionRate),
        status,
      });
    } else {
      addInstructor({
        full_name: fullName,
        dni,
        phone,
        email,
        license_number: licenseNumber || `HAB-${Math.floor(Math.random() * 90000 + 10000)}`,
        license_expiry: licenseExpiry,
        hire_date: new Date().toISOString().split("T")[0],
        hourly_rate: Number(classRate),
        allowed_transmissions: ["manual", "automatico"],
        class_rate: Number(classRate),
        commission_rate: Number(commissionRate),
        status,
        color_hex: "#00A3FF",
        classes_given_count: 0,
        pass_rate_percentage: 95,
      });
    }

    setModalOpen(false);
  };

  // Liquidación calculada para cada instructor y para los dueños de la escuela
  const payrollData = instructors.map((inst) => {
    const classesGiven = lessons.filter(
      (l) => l.instructor_id === inst.id && l.status === "realizada"
    ).length;

    const rate = inst.class_rate || 24000;
    const commPct = inst.commission_rate ?? 65;
    const ownerPct = 100 - commPct;

    const totalBilled = classesGiven * rate;
    const docenteBase = totalBilled * (commPct / 100);
    const ownerShare = totalBilled * (ownerPct / 100);
    const bonus = classesGiven >= 40 ? 50000 : 25000;
    const totalNetDocente = docenteBase + bonus;

    return {
      instructor: inst,
      classesGiven,
      rate,
      commPct,
      ownerPct,
      totalBilled,
      docenteBase,
      ownerShare,
      bonus,
      totalNetDocente,
    };
  });

  const totalBilledAll = payrollData.reduce((s, p) => s + p.totalBilled, 0);
  const totalDocentePaid = payrollData.reduce((s, p) => s + p.totalNetDocente, 0);
  const totalOwnerProfit = payrollData.reduce((s, p) => s + p.ownerShare, 0);

  const exportPayroll = () => {
    alert("Liquidaciones exportadas con éxito a formato CSV/Excel con membrete oficial de EAM.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="eyebrow">Equipo Docente</span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
            Personal Docente & Liquidaciones
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Instructores profesionales, licencias habilitantes de conducir y liquidación mensual de haberes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openNewModal}
            className="btn-pill px-4 py-2 text-xs font-bold bg-[#03387E] hover:bg-[#022859] text-white flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Docente</span>
          </button>
          <button
            onClick={exportPayroll}
            className="btn-pill px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Liquidaciones</span>
          </button>
        </div>
      </div>

      {/* Grid de Instructores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map((inst) => (
          <div
            key={inst.id}
            className="eam-card p-6 flex flex-col justify-between border-t-4 shadow-sm hover:shadow-md transition-shadow"
            style={{ borderTopColor: inst.color_hex }}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-heading font-black text-lg shadow-md"
                    style={{ backgroundColor: inst.color_hex }}
                  >
                    {inst.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-slate-900 leading-tight">
                      {inst.full_name}
                    </h3>
                    <div className="text-xs text-slate-500">DNI {inst.dni}</div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  inst.status === 'activo' ? 'bg-emerald-100 text-emerald-800' :
                  inst.status === 'licencia' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {inst.status}
                </span>
              </div>

              {/* Datos de Licencia */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Licencia Profesional:</span>
                  <strong className="font-mono text-slate-800">{inst.license_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vencimiento:</span>
                  <strong className="text-slate-800">{formatDate(inst.license_expiry)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transmisión:</span>
                  <strong className="text-slate-800 capitalize">
                    {inst.allowed_transmissions.join(", ")}
                  </strong>
                </div>
              </div>

              {/* Distribución de Ganancia por Clase */}
              <div className="p-3 bg-blue-50/60 rounded-xl space-y-1.5 text-xs text-slate-700 mb-4 border border-blue-100">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Valor por Clase:</span>
                  <strong className="font-bold text-slate-900">{formatCurrency(inst.class_rate || 24000)}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#03387E] font-bold">Ganancia Docente ({inst.commission_rate ?? 65}%):</span>
                  <strong className="text-[#03387E]">
                    {formatCurrency((inst.class_rate || 24000) * ((inst.commission_rate ?? 65) / 100))}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-emerald-700 font-bold">Dueños Escuela ({100 - (inst.commission_rate ?? 65)}%):</span>
                  <strong className="text-emerald-700">
                    {formatCurrency((inst.class_rate || 24000) * ((100 - (inst.commission_rate ?? 65)) / 100))}
                  </strong>
                </div>
              </div>

              {/* Estadísticas de Rendimiento */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
                <div className="p-2.5 bg-blue-50/60 rounded-xl">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Clases Dictadas
                  </span>
                  <span className="font-heading font-black text-lg text-[#03387E]">
                    {inst.classes_given_count || 0}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50/60 rounded-xl">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Tasa Aprobación
                  </span>
                  <span className="font-heading font-black text-lg text-emerald-600">
                    {inst.pass_rate_percentage || 95}%
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones y Contacto */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Teléfono:
                </span>
                <a
                  href={`tel:${inst.phone}`}
                  className="text-[#00A3FF] hover:underline font-semibold flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{inst.phone}</span>
                </a>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openEditModal(inst)}
                  className="px-3 py-1.5 text-xs font-bold text-[#03387E] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Docente</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Estás seguro de que deseás eliminar al docente ${inst.full_name}?`)) {
                      deleteInstructor(inst.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar Docente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tarjetas Resumen de Liquidación & Ganancia Dueños */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="eam-card p-5 border-l-4 border-l-[#03387E]">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Facturado en Clases
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-slate-900">
            {formatCurrency(totalBilledAll)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Ingreso total por clases impartidas</div>
        </div>

        <div className="eam-card p-5 border-l-4 border-l-blue-500">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Honorarios a Docentes
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-[#03387E]">
            {formatCurrency(totalDocentePaid)}
          </div>
          <div className="text-xs text-blue-600 font-medium mt-1">Comisiones + Premios liquidados</div>
        </div>

        <div className="eam-card p-5 border-l-4 border-l-emerald-500 bg-emerald-50/20">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Ganancia Neta Dueños Escuela</span>
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-emerald-700">
            {formatCurrency(totalOwnerProfit)}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Margen libre retenido para la dirección</div>
        </div>
      </div>

      {/* Tabla de Liquidación Mensual */}
      <div className="eam-card overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="font-heading font-bold text-sm text-slate-800">
              Resumen de Liquidación de Honorarios ({selectedMonth})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Reparto de comisiones: Docente vs. Dueños de Escuela</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4 text-center">Clases Mes</th>
                <th className="py-3 px-4 text-center">Valor / Clase</th>
                <th className="py-3 px-4 text-center">Facturado Total</th>
                <th className="py-3 px-4 text-center">Comisión Docente</th>
                <th className="py-3 px-4 text-center text-emerald-800 bg-emerald-100/40">Ganancia Dueños</th>
                <th className="py-3 px-4 text-center">Premio Asist.</th>
                <th className="py-3 px-4 text-right">Neto a Liquidar Docente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollData.map(({ instructor, classesGiven, rate, commPct, ownerPct, totalBilled, docenteBase, ownerShare, bonus, totalNetDocente }) => (
                <tr key={instructor.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {instructor.full_name}
                    <div className="text-[11px] text-slate-500 font-normal">DNI {instructor.dni}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">
                    {classesGiven}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 text-xs font-semibold">
                    {formatCurrency(rate)}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">
                    {formatCurrency(totalBilled)}
                  </td>
                  <td className="py-3 px-4 text-center text-xs">
                    <span className="font-bold text-[#03387E]">{commPct}%</span>
                    <div className="text-slate-500 font-semibold">{formatCurrency(docenteBase)}</div>
                  </td>
                  <td className="py-3 px-4 text-center text-xs font-bold text-emerald-800 bg-emerald-50/50">
                    <span>{ownerPct}%</span>
                    <div className="text-emerald-700 font-black">{formatCurrency(ownerShare)}</div>
                  </td>
                  <td className="py-3 px-4 text-center text-xs font-bold text-emerald-600">
                    +{formatCurrency(bonus)}
                  </td>
                  <td className="py-3 px-4 text-right font-heading font-black text-[#03387E] text-base">
                    {formatCurrency(totalNetDocente)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición / Alta de Docente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#03387E]" />
                <h3 className="font-heading font-black text-lg text-slate-900">
                  {editingId ? "Editar Personal Docente" : "Nuevo Personal Docente"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInstructor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Marcelo Gómez"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ej: 32884912"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="11-4567-8901"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="docente@eam.com.ar"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N° Licencia Habilitante
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="HAB-49281"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vencimiento Licencia
                  </label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor por Clase al Alumno ($ ARS) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={classRate}
                    onChange={(e) => setClassRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado Docente
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Instructor["status"])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  >
                    <option value="activo">Activo</option>
                    <option value="licencia">De Licencia</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                {/* Configuración de Comisiones: Docente vs Dueños */}
                <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Porcentaje de Ganancia del Docente (%)
                    </label>
                    <div className="flex items-center gap-1 font-heading font-black text-base text-[#03387E]">
                      <span>{commissionRate}%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full accent-[#03387E] cursor-pointer"
                  />

                  {/* Cálculo en Vivo para Docente y Dueños */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-[10px] uppercase font-bold text-blue-800 block">
                        Docente ({commissionRate}%)
                      </span>
                      <strong className="text-sm font-heading font-black text-[#03387E]">
                        {formatCurrency(classRate * (commissionRate / 100))}
                      </strong>
                      <span className="text-[10px] text-slate-500 block">Por clase realizada</span>
                    </div>

                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                        Dueños Escuela ({100 - commissionRate}%)
                      </span>
                      <strong className="text-sm font-heading font-black text-emerald-700">
                        {formatCurrency(classRate * ((100 - commissionRate) / 100))}
                      </strong>
                      <span className="text-[10px] text-slate-500 block">Margen retenido escuela</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-pill px-5 py-2 text-xs font-bold bg-[#03387E] hover:bg-[#022859] text-white shadow-sm cursor-pointer transition-colors"
                >
                  {editingId ? "Guardar Cambios" : "Crear Docente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
