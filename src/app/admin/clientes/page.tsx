"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  DollarSign,
  ArrowRight,
  Download,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClientStatus } from "@/lib/types";

export default function ClientesPage() {
  const { clients, addClient, deleteClient } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  // Campos para nuevo alumno
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [level, setLevel] = useState<"cero" | "principiante" | "intermedio" | "avanzado">("cero");
  const [hasLicense, setHasLicense] = useState(false);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dni.includes(searchTerm) ||
      c.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dni || !phone) return;

    addClient({
      full_name: fullName,
      dni,
      phone,
      email,
      address,
      experience_level: level,
      has_license: hasLicense,
      status: "activo",
      balance_due: 0,
    });

    setModalOpen(false);
    setFullName("");
    setDni("");
    setPhone("");
    setEmail("");
    setAddress("");
  };

  const statusBadges: Record<ClientStatus, { bg: string; text: string; label: string }> = {
    activo: { bg: "bg-blue-100", text: "text-[#03387E]", label: "Activo" },
    lead: { bg: "bg-amber-100", text: "text-amber-800", label: "Lead" },
    en_pausa: { bg: "bg-slate-100", text: "text-slate-700", label: "En Pausa" },
    egresado: { bg: "bg-purple-100", text: "text-purple-800", label: "Egresado" },
    baja: { bg: "bg-red-100", text: "text-red-800", label: "Baja" },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="eyebrow">Gestión de Alumnos</span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
            Clientes / CRM
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Base integral de alumnos, fichas de aprendizaje, cuentas corrientes y exámenes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-pill btn-pill-primary px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Alumno</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:border-[#00A3FF] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5 text-[#00A3FF]" />
            <span>Estado:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-hidden"
          >
            <option value="all">Todos los Estados</option>
            <option value="activo">Activos</option>
            <option value="egresado">Egresados</option>
            <option value="en_pausa">En Pausa</option>
            <option value="lead">Leads</option>
          </select>
        </div>
      </div>

      {/* Listado de Alumnos */}
      <div className="eam-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Alumno</th>
                <th className="py-3 px-4">DNI</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Nivel Inicial</th>
                <th className="py-3 px-4">Saldo Deudor</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((client) => {
                const badge = statusBadges[client.status];

                return (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Link
                        href={`/admin/clientes/${client.id}`}
                        className="hover:text-[#00A3FF] transition-colors"
                      >
                        {client.full_name}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-normal">
                        Ingresó: {formatDate(client.created_at)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-xs font-semibold">
                      {client.dni}
                    </td>

                    <td className="py-3 px-4 text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{client.phone}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-36">{client.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs capitalize text-slate-700 font-medium">
                      {client.experience_level}
                    </td>

                    <td className="py-3 px-4 text-xs font-bold">
                      {client.balance_due && client.balance_due > 0 ? (
                        <span className="text-red-600">
                          {formatCurrency(client.balance_due)}
                        </span>
                      ) : (
                        <span className="text-emerald-600">Al día</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/clientes/${client.id}`}
                          className="btn-pill px-3 py-1.5 text-xs font-bold text-[#03387E] bg-blue-50 hover:bg-blue-100 inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Ver</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar permanentemente al alumno "${client.full_name}" (DNI ${client.dni})? Se borrarán también sus turnos asociados.`)) {
                              deleteClient(client.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:text-white hover:bg-red-600 border border-red-200 transition-all cursor-pointer shadow-2xs"
                          title={`Eliminar a ${client.full_name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Alumno */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-[#03387E] text-white flex items-center justify-between">
              <div>
                <span className="eyebrow text-blue-200">Alta de Alumno</span>
                <h3 className="font-heading font-bold text-xl">Registrar Nuevo Alumno</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                    placeholder="Ej: Julieta López"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                    placeholder="Ej: 43.123.456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                    placeholder="11 3637-3331"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                    placeholder="julieta@gmail.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Domicilio (Florencio Varela o aledaños)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                    placeholder="Calle, número y localidad"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Experiencia Previa
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                  >
                    <option value="cero">Desde Cero</option>
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="hasLicenseCheck"
                    checked={hasLicense}
                    onChange={(e) => setHasLicense(e.target.checked)}
                    className="w-4 h-4 rounded-sm text-[#00A3FF]"
                  />
                  <label htmlFor="hasLicenseCheck" className="text-xs font-bold text-slate-700">
                    ¿Tiene licencia habilitante previa?
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-pill btn-pill-primary px-5 py-2 text-xs font-bold"
                >
                  Guardar Alumno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
