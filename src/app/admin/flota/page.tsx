"use client";

import React, { useState } from "react";
import {
  Car,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Calendar,
  Plus,
  ShieldAlert,
  Clock,
  Check,
  FileText,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Vehicle } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function FlotaPage() {
  const { vehicles, toggleVehicleStatus, updateVehicle, addVehicle, deleteVehicle } = useApp();

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [maintenanceReason, setMaintenanceReason] = useState("");

  // Modal de Edición / Alta
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2023);
  const [plate, setPlate] = useState("");
  const [transmission, setTransmission] = useState<"manual" | "automatico">("manual");
  const [mileage, setMileage] = useState(25000);
  const [status, setStatus] = useState<Vehicle["status"]>("operativo");
  const [vtvExpiry, setVtvExpiry] = useState("2027-11-15");
  const [insuranceExpiry, setInsuranceExpiry] = useState("2027-12-01");

  const openEditModal = (veh: Vehicle) => {
    setEditingId(veh.id);
    setBrand(veh.brand);
    setModel(veh.model);
    setYear(veh.year);
    setPlate(veh.plate);
    setTransmission(veh.transmission);
    setMileage(veh.mileage);
    setStatus(veh.status);
    const vtvDoc = veh.documents?.find((d) => d.document_type === "vtv");
    const insDoc = veh.documents?.find((d) => d.document_type === "seguro");
    setVtvExpiry(vtvDoc?.expiration_date || "2027-11-15");
    setInsuranceExpiry(insDoc?.expiration_date || "2027-12-01");
    setModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setBrand("");
    setModel("");
    setYear(2024);
    setPlate("");
    setTransmission("manual");
    setMileage(10000);
    setStatus("operativo");
    setVtvExpiry("2027-11-15");
    setInsuranceExpiry("2027-12-01");
    setModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !plate) return;

    const docs = [
      {
        id: `doc-vtv-${Date.now()}`,
        vehicle_id: editingId || "new",
        document_type: "vtv" as const,
        expiration_date: vtvExpiry,
        alert_days_before: 30,
      },
      {
        id: `doc-seg-${Date.now()}`,
        vehicle_id: editingId || "new",
        document_type: "seguro" as const,
        expiration_date: insuranceExpiry,
        alert_days_before: 15,
      },
    ];

    if (editingId) {
      updateVehicle(editingId, {
        brand,
        model,
        year: Number(year),
        plate: plate.toUpperCase(),
        transmission,
        mileage: Number(mileage),
        status,
        documents: docs,
      });
    } else {
      addVehicle({
        brand,
        model,
        year: Number(year),
        plate: plate.toUpperCase(),
        transmission,
        dual_control: true,
        mileage: Number(mileage),
        status,
        color_hex: transmission === "automatico" ? "#8B5CF6" : "#00A3FF",
        documents: docs,
      });
    }

    setModalOpen(false);
  };

  const handleToggleTaller = (vehicle: Vehicle) => {
    const nextStatus = vehicle.status === "en_taller" ? "operativo" : "en_taller";
    toggleVehicleStatus(vehicle.id, nextStatus);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="eyebrow">Flota Oficial EAM</span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
            Flota de Vehículos (Naves)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Autos con doble comando para instrucción. Vencimientos de VTV, seguros y bloqueo de taller.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="btn-pill px-4 py-2 text-xs font-bold bg-[#03387E] hover:bg-[#022859] text-white flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Vehículo</span>
        </button>
      </div>

      {/* Resumen Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="eam-card p-5 border-l-4 border-l-emerald-500">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Autos Operativos en Calle
          </div>
          <div className="font-heading font-black text-3xl text-slate-900">
            {vehicles.filter((v) => v.status === "operativo").length} / {vehicles.length}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Habilitados para turnos y pista
          </div>
        </div>

        <div className="eam-card p-5 border-l-4 border-l-amber-500">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            En Taller / Service
          </div>
          <div className="font-heading font-black text-3xl text-amber-600">
            {vehicles.filter((v) => v.status === "en_taller").length}
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            Bloqueados automáticamente del turnero
          </div>
        </div>

        <div className="eam-card p-5 border-l-4 border-l-[#03387E]">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Transmisión de Flota
          </div>
          <div className="font-heading font-black text-xl text-slate-900">
            5 Manuales • 1 Automático
          </div>
          <div className="text-xs text-slate-500 mt-1">Todos equipados con doble pedalera</div>
        </div>
      </div>

      {/* Tarjetas de Vehículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((veh) => {
          const isWorkshop = veh.status === "en_taller";

          return (
            <div
              key={veh.id}
              className={`eam-card p-6 flex flex-col justify-between border-2 transition-all ${
                isWorkshop
                  ? "bg-amber-50/40 border-amber-300"
                  : "bg-white border-transparent hover:border-[#00A3FF]/50"
              }`}
            >
              <div>
                {/* Header Vehículo */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#03387E] flex items-center justify-center font-bold text-lg">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-slate-900 leading-tight">
                        {veh.brand} {veh.model}
                      </h3>
                      <div className="font-mono font-bold text-xs text-[#00A3FF]">
                        {veh.plate} • Año {veh.year}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isWorkshop
                        ? "bg-amber-200 text-amber-900 animate-pulse"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isWorkshop ? "En Taller" : "Operativo"}
                  </span>
                </div>

                {/* Especificaciones */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Caja</span>
                    <strong className="capitalize text-slate-800">{veh.transmission}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Comando</span>
                    <strong className="text-slate-800">Doble Comando ✓</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Kilometraje</span>
                    <strong className="text-slate-800">{veh.mileage.toLocaleString("es-AR")} km</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sede Base</span>
                    <strong className="text-slate-800">Mitre 294</strong>
                  </div>
                </div>

                {/* Semáforo de Vencimientos */}
                <div className="space-y-1.5 mb-6 text-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Vencimientos de Documentación
                  </div>
                  {veh.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200"
                    >
                      <span className="font-bold uppercase text-[11px] text-slate-700">
                        {doc.document_type}
                      </span>
                      <span className="font-medium text-slate-500 text-[11px]">
                        Vence: {formatDate(doc.expiration_date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones del Vehículo */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleToggleTaller(veh)}
                  className={`btn-pill w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    isWorkshop
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>
                    {isWorkshop ? "Dar de Alta (Habilitar)" : "Bloquear por Taller / Service"}
                  </span>
                </button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(veh)}
                    className="flex-1 py-1.5 px-3 text-xs font-bold text-[#03387E] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Auto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Estás seguro de que deseás eliminar el vehículo ${veh.brand} ${veh.model} (${veh.plate})?`)) {
                        deleteVehicle(veh.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar Vehículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Edición / Alta de Vehículo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-[#03387E]" />
                <h3 className="font-heading font-black text-lg text-slate-900">
                  {editingId ? "Editar Vehículo de Flota" : "Nuevo Vehículo (Nave)"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej: Chevrolet, Toyota"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ej: Onix Plus, Etios"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patente / Dominio *
                  </label>
                  <input
                    type="text"
                    required
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="Ej: AF 123 CD"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Año de Fabricación
                  </label>
                  <input
                    type="number"
                    min="2010"
                    max="2027"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transmisión (Caja)
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as "manual" | "automatico")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  >
                    <option value="manual">Manual (5/6 Velocidades)</option>
                    <option value="automatico">Automático (Secuencial/CVT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kilometraje Actual (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado Operativo
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Vehicle["status"])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  >
                    <option value="operativo">Operativo (En calle)</option>
                    <option value="en_taller">En Taller / Service</option>
                    <option value="baja">De Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vencimiento VTV
                  </label>
                  <input
                    type="date"
                    value={vtvExpiry}
                    onChange={(e) => setVtvExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vencimiento Seguro de Flota
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03387E]/20 focus:border-[#03387E]"
                  />
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
                  {editingId ? "Guardar Cambios" : "Crear Vehículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
