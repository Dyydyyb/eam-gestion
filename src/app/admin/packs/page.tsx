"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  Plus,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Search,
  Filter,
  Edit,
  Trash2,
  Check,
  User,
  Users,
  Sparkles,
  MessageSquare,
  AlertCircle,
  FileText,
  Calendar,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Service, ClientPackageAssignment } from "@/lib/types";
import { messagingService } from "@/lib/messaging";

export default function PacksArancelesPage() {
  const {
    services,
    clients,
    packageAssignments,
    examRentalFee,
    setExamRentalFee,
    addService,
    updateService,
    deleteService,
    assignPackageToClient,
    updatePackageAssignment,
    removePackageAssignment,
  } = useApp();

  // Estados para búsqueda y filtrado de asignaciones
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");

  // Modal para Crear / Editar Pack de Catálogo
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [packClassesCount, setPackClassesCount] = useState<number>(5);
  const [packPrice, setPackPrice] = useState<number>(110000);
  const [packDuration, setPackDuration] = useState<number>(60);
  const [packOnline, setPackOnline] = useState<boolean>(true);

  // Modal para Actualizar Valor Base de Alquiler de Auto para Examen
  const [examRentalModalOpen, setExamRentalModalOpen] = useState(false);
  const [newExamFee, setNewExamFee] = useState<number>(examRentalFee);

  // Modal para Asignar Pack / Clase Personalizada a Alumno
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<"standard" | "custom">("standard");
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[2]?.id || services[0]?.id || "");
  const [customPackageName, setCustomPackageName] = useState("Clases Prácticas Personalizadas");
  const [customClassCount, setCustomClassCount] = useState<number>(6);
  const [customPriceAgreed, setCustomPriceAgreed] = useState<number>(130000);
  const [includeExamCarRental, setIncludeExamCarRental] = useState<boolean>(true);
  const [examRentalValue, setExamRentalValue] = useState<number>(examRentalFee);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number>(0);
  const [assignmentNotes, setAssignmentNotes] = useState("");

  // Modal para Editar Asignación Existente
  const [editAsgModalOpen, setEditAsgModalOpen] = useState(false);
  const [editingAsg, setEditingAsg] = useState<ClientPackageAssignment | null>(null);
  const [editAsgPrice, setEditAsgPrice] = useState<number>(0);
  const [editAsgRentalInclude, setEditAsgRentalInclude] = useState<boolean>(false);
  const [editAsgRentalFee, setEditAsgRentalFee] = useState<number>(0);
  const [editAsgPaid, setEditAsgPaid] = useState<number>(0);
  const [editAsgClassesTaken, setEditAsgClassesTaken] = useState<number>(0);

  // Cálculo de totales en tiempo real para modal de asignación
  const baseServicePrice = services.find((s) => s.id === selectedServiceId)?.price || 0;
  const currentClassPrice = assignmentType === "standard" ? customPriceAgreed || baseServicePrice : customPriceAgreed;
  const currentTotalContract = currentClassPrice + (includeExamCarRental ? examRentalValue : 0);
  const currentBalanceDue = Math.max(0, currentTotalContract - initialPaymentAmount);

  // Filtrado de asignaciones de alumnos
  const filteredAssignments = packageAssignments.filter((asg) => {
    const matchesSearch =
      asg.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asg.client_dni?.includes(searchTerm) ||
      asg.service_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterPaymentStatus === "all" || asg.payment_status === filterPaymentStatus;
    return matchesSearch && matchesStatus;
  });

  // Apertura de modal para nuevo pack
  const handleOpenNewPackModal = () => {
    setEditingServiceId(null);
    setPackName("");
    setPackDescription("");
    setPackClassesCount(5);
    setPackPrice(110000);
    setPackDuration(60);
    setPackOnline(true);
    setPackModalOpen(true);
  };

  // Apertura de modal para editar pack existente
  const handleOpenEditPackModal = (service: Service) => {
    setEditingServiceId(service.id);
    setPackName(service.name);
    setPackDescription(service.description || "");
    setPackClassesCount(service.package_class_count || 1);
    setPackPrice(service.price);
    setPackDuration(service.duration_minutes);
    setPackOnline(service.available_online);
    setPackModalOpen(true);
  };

  // Guardar pack (crear o editar)
  const handleSavePack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName) return;

    if (editingServiceId) {
      updateService(editingServiceId, {
        name: packName,
        description: packDescription,
        package_class_count: Number(packClassesCount),
        price: Number(packPrice),
        duration_minutes: Number(packDuration),
        available_online: packOnline,
        is_package: Number(packClassesCount) > 1,
      });
    } else {
      addService({
        name: packName,
        description: packDescription,
        package_class_count: Number(packClassesCount),
        price: Number(packPrice),
        duration_minutes: Number(packDuration),
        available_online: packOnline,
        is_package: Number(packClassesCount) > 1,
        is_active: true,
      });
    }
    setPackModalOpen(false);
  };

  // Abrir modal de asignación a alumno
  const handleOpenAssignModal = () => {
    const firstClient = clients[0];
    setSelectedClientId(firstClient?.id || "");
    setAssignmentType("standard");
    const stdService = services.find((s) => s.is_package) || services[0];
    setSelectedServiceId(stdService?.id || "");
    setCustomPriceAgreed(stdService?.price || 110000);
    setCustomClassCount(stdService?.package_class_count || 5);
    setIncludeExamCarRental(true);
    setExamRentalValue(examRentalFee);
    setInitialPaymentAmount(0);
    setAssignmentNotes("");
    setAssignModalOpen(true);
  };

  // Confirmar asignación
  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) {
      alert("Por favor seleccioná un alumno");
      return;
    }

    const serviceObj = services.find((s) => s.id === selectedServiceId);
    const serviceName =
      assignmentType === "standard"
        ? serviceObj?.name || "Pack Estándar"
        : `${customPackageName} (${customClassCount} clases)`;

    const total = currentTotalContract;
    const balance = currentBalanceDue;
    const paymentStatus = balance === 0 ? "abonado" : initialPaymentAmount > 0 ? "parcial" : "pendiente";

    assignPackageToClient({
      client_id: client.id,
      client_name: client.full_name,
      client_dni: client.dni,
      client_phone: client.phone,
      service_id: assignmentType === "standard" ? selectedServiceId : "custom",
      service_name: serviceName,
      is_custom: assignmentType === "custom",
      class_count: assignmentType === "standard" ? serviceObj?.package_class_count || 5 : Number(customClassCount),
      classes_taken: 0,
      price_agreed: Number(currentClassPrice),
      includes_exam_car_rental: includeExamCarRental,
      exam_car_rental_fee: includeExamCarRental ? Number(examRentalValue) : 0,
      total_amount: total,
      amount_paid: Number(initialPaymentAmount),
      balance_due: balance,
      payment_status: paymentStatus,
      notes: assignmentNotes,
      status: "activo",
    });

    setAssignModalOpen(false);
    alert(`¡Pack asignado con éxito a ${client.full_name}!`);
  };

  // Abrir edición de asignación existente
  const handleOpenEditAsgModal = (asg: ClientPackageAssignment) => {
    setEditingAsg(asg);
    setEditAsgPrice(asg.price_agreed);
    setEditAsgRentalInclude(asg.includes_exam_car_rental);
    setEditAsgRentalFee(asg.exam_car_rental_fee);
    setEditAsgPaid(asg.amount_paid);
    setEditAsgClassesTaken(asg.classes_taken);
    setEditAsgModalOpen(true);
  };

  // Guardar edición de asignación
  const handleSaveEditAsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsg) return;

    updatePackageAssignment(editingAsg.id, {
      price_agreed: Number(editAsgPrice),
      includes_exam_car_rental: editAsgRentalInclude,
      exam_car_rental_fee: editAsgRentalInclude ? Number(editAsgRentalFee) : 0,
      amount_paid: Number(editAsgPaid),
      classes_taken: Number(editAsgClassesTaken),
    });

    setEditAsgModalOpen(false);
  };

  // Enviar mensaje de WhatsApp al alumno con detalle de su arancel
  const handleSendAsgWhatsApp = (asg: ClientPackageAssignment) => {
    const text = `¡Hola ${asg.client_name}! Te saludamos de EAM Escuela de Manejo Florencio Varela 🚗.\n\nTe confirmamos el detalle de tu contratación:\n• Programa: *${asg.service_name}* (${asg.class_count} clases)\n• Arancel clases: *${formatCurrency(asg.price_agreed)}*\n• Alquiler auto examen: *${asg.includes_exam_car_rental ? formatCurrency(asg.exam_car_rental_fee) + " (Incluido)" : "No asignado"}*\n• Total contratado: *${formatCurrency(asg.total_amount)}*\n• Monto abonado: *${formatCurrency(asg.amount_paid)}*\n• Saldo pendiente: *${formatCurrency(asg.balance_due)}*\n\nAnte cualquier duda estamos a tu disposición en Mitre 294, Varela. ¡Éxitos con tus clases!`;
    const url = messagingService.generateWhatsAppLink(asg.client_phone || "", text);
    window.open(url, "_blank");
  };

  // Guardar nuevo arancel de alquiler de auto para examen
  const handleSaveExamFee = (e: React.FormEvent) => {
    e.preventDefault();
    setExamRentalFee(Number(newExamFee));
    setExamRentalModalOpen(false);
    alert(`Valor base de alquiler para examen actualizado a ${formatCurrency(Number(newExamFee))}`);
  };

  // Métricas calculadas
  const totalContractedAmount = packageAssignments.reduce((acc, a) => acc + a.total_amount, 0);
  const totalBalanceDue = packageAssignments.reduce((acc, a) => acc + a.balance_due, 0);
  const totalExamRentalsCount = packageAssignments.filter((a) => a.includes_exam_car_rental).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Principal con Logo Oficial EAM */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200 flex items-center justify-center shrink-0 ring-4 ring-[#03387E]/5">
            <Image src="/logo.png" alt="EAM Logo Oficial" width={44} height={44} className="object-contain" priority />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">Gestión Arancelaria & Planes</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#03387E]">
                Florencio Varela
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
              Packs de Clases & Aranceles
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Administración de planes de clases, precios personalizados, alquiler de auto para rendir examen y asignación individual a cada alumno.
            </p>
          </div>
        </div>

        {/* Botones de Acción Rápida */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenNewPackModal}
            className="btn-pill btn-pill-outline px-4 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-slate-100"
          >
            <Plus className="w-4 h-4 text-[#00A3FF]" />
            <span>+ Nuevo Pack Estándar</span>
          </button>
          <button
            onClick={handleOpenAssignModal}
            className="btn-pill btn-pill-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
          >
            <User className="w-4 h-4" />
            <span>Asignar a Alumno</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs de Aranceles y Alquileres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Alquiler de Auto para Rendir Examen (Con botón directo de ajuste) */}
        <div className="eam-card p-5 border-l-4 border-l-[#00A3FF] bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Alquiler Auto Examen
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00A3FF] flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-slate-900">
            {formatCurrency(examRentalFee)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{totalExamRentalsCount} asignados activos</span>
            <button
              onClick={() => {
                setNewExamFee(examRentalFee);
                setExamRentalModalOpen(true);
              }}
              className="font-bold text-[#00A3FF] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              <span>Modificar</span>
            </button>
          </div>
        </div>

        {/* KPI 2: Packs en Catálogo */}
        <div className="eam-card p-5 border-l-4 border-l-[#03387E]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Packs en Catálogo
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#03387E] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-slate-900">
            {services.length} <span className="text-sm font-semibold text-slate-400">planes</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {services.filter((s) => s.is_package).length} paquetes • {services.filter((s) => !s.is_package).length} sueltas
          </div>
        </div>

        {/* KPI 3: Alumnos con Asignación Activa */}
        <div className="eam-card p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Alumnos con Pack
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-slate-900">
            {packageAssignments.length} <span className="text-sm font-semibold text-slate-400">alumnos</span>
          </div>
          <div className="mt-2 text-xs text-purple-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Seguimiento de clases en curso</span>
          </div>
        </div>

        {/* KPI 4: Total Contratado y Saldo Pendiente */}
        <div className="eam-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Contratado
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-slate-900">
            {formatCurrency(totalContractedAmount)}
          </div>
          <div className="mt-2 text-xs font-bold text-amber-600">
            Saldo por cobrar: {formatCurrency(totalBalanceDue)}
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: Tarjeta Destacada de Alquiler de Auto para Rendir Examen */}
      <div className="eam-card p-6 border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 rounded-3xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#03387E] text-white flex items-center justify-center shrink-0 shadow-md">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  Alquiler de Auto Doble Comando para Rendir Examen
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Arancel Oficial
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Incluye vehículo homologado con doble comando, VTV especial para escuela de manejo, seguro de cobertura integral para examen, combustible y acompañamiento del instructor en la <strong>Pista Municipal de Tránsito de Florencio Varela</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-2xs shrink-0">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Valor Base Vigente</div>
              <div className="font-heading font-black text-2xl text-[#03387E]">
                {formatCurrency(examRentalFee)}
              </div>
            </div>
            <button
              onClick={() => {
                setNewExamFee(examRentalFee);
                setExamRentalModalOpen(true);
              }}
              className="btn-pill btn-pill-outline px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Modificar Arancel</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Catálogo de Packs de Clases & Aranceles Base */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-xl text-slate-900">
              Catálogo de Packs y Precios Oficiales
            </h2>
            <p className="text-xs text-slate-500">
              Precios base de lista utilizados como referencia o sugerencia al asignar a cada alumno.
            </p>
          </div>
          <button
            onClick={handleOpenNewPackModal}
            className="btn-pill btn-pill-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Pack</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => {
            const pricePerClass =
              service.package_class_count > 1
                ? Math.round(service.price / service.package_class_count)
                : service.price;

            return (
              <div
                key={service.id}
                className="eam-card p-5 border border-slate-200 hover:border-[#00A3FF] transition-all flex flex-col justify-between group bg-white shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-heading font-black text-base text-slate-900 group-hover:text-[#03387E] transition-colors">
                      {service.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        service.is_package
                          ? "bg-blue-100 text-[#03387E]"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {service.is_package ? `${service.package_class_count} Clases` : "Individual"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 min-h-[32px]">
                    {service.description || "Clases prácticas con auto doble comando en circuito urbano de Varela."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Arancel Total</div>
                      <div className="font-heading font-black text-2xl text-[#03387E]">
                        {formatCurrency(service.price)}
                      </div>
                    </div>
                    {service.is_package && (
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Por Clase</div>
                        <div className="font-semibold text-xs text-emerald-600">
                          {formatCurrency(pricePerClass)} / cl.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {service.duration_minutes} min / clase
                    </span>
                    {service.available_online && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Disponible Online
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenEditPackModal(service)}
                    className="text-xs font-bold text-slate-600 hover:text-[#00A3FF] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar Precio</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar el plan "${service.name}" del catálogo?`)) {
                        deleteService(service.id);
                      }
                    }}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 3: Asignaciones de Packs & Clases Personalizadas por Alumno */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-xl text-slate-900">
              Alumnos con Pack o Clase Asignada
            </h2>
            <p className="text-xs text-slate-500">
              Historial de planes asignados a cada alumno con arancel de clases, alquiler de auto para examen y balance de cobros.
            </p>
          </div>

          <button
            onClick={handleOpenAssignModal}
            className="btn-pill btn-pill-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2 self-start sm:self-center cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Asignar Pack a Alumno</span>
          </button>
        </div>

        {/* Barra de Búsqueda y Filtro de Estado de Pago */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 text-xs shadow-2xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o plan asignado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Estado de pago:</span>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="abonado">Abonado total</option>
              <option value="parcial">Pago parcial / seña</option>
              <option value="pendiente">Total pendiente</option>
            </select>
          </div>
        </div>

        {/* Tabla de Alumnos con Packs */}
        <div className="eam-card overflow-x-auto p-0 border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-heading font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Alumno</th>
                <th className="py-3 px-4">Pack / Clase Asignada</th>
                <th className="py-3 px-4 text-center">Progreso</th>
                <th className="py-3 px-4 text-right">Arancel Clases</th>
                <th className="py-3 px-4 text-center">Alquiler Auto Examen</th>
                <th className="py-3 px-4 text-right">Total Contratado</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((asg) => {
                const progressPct =
                  asg.class_count > 0 ? Math.round((asg.classes_taken / asg.class_count) * 100) : 0;

                return (
                  <tr key={asg.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Alumno */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="font-bold text-slate-900">{asg.client_name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        DNI: {asg.client_dni} • Tel: {asg.client_phone}
                      </div>
                    </td>

                    {/* Pack asignado */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{asg.service_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {asg.is_custom ? "Tarifa personalizada" : "Pack estándar de catálogo"}
                      </div>
                    </td>

                    {/* Progreso de Clases */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-block text-center">
                        <div className="font-bold text-slate-800 text-xs">
                          {asg.classes_taken} / {asg.class_count} cl.
                        </div>
                        <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1 mx-auto">
                          <div
                            className="bg-[#00A3FF] h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Arancel de clases */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(asg.price_agreed)}
                    </td>

                    {/* Alquiler de Auto para Examen */}
                    <td className="py-3.5 px-4 text-center">
                      {asg.includes_exam_car_rental ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>{formatCurrency(asg.exam_car_rental_fee)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                          No incluido
                        </span>
                      )}
                    </td>

                    {/* Total Contratado */}
                    <td className="py-3.5 px-4 text-right font-heading font-black text-slate-900">
                      {formatCurrency(asg.total_amount)}
                    </td>

                    {/* Saldo Pendiente */}
                    <td className="py-3.5 px-4 text-right">
                      {asg.balance_due === 0 ? (
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                          ✓ Total Abonado
                        </span>
                      ) : (
                        <span className="font-black text-amber-600">
                          {formatCurrency(asg.balance_due)}
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSendAsgWhatsApp(asg)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Enviar resumen por WhatsApp al alumno"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEditAsgModal(asg)}
                          className="p-1.5 rounded-lg bg-blue-50 text-[#03387E] hover:bg-blue-100 transition-colors"
                          title="Editar arancel o pagos"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar la asignación de ${asg.client_name}?`)) {
                              removePackageAssignment(asg.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Eliminar asignación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs italic">
                    No se encontraron asignaciones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: CREAR O EDITAR PACK DE CATÁLOGO
          ========================================================================= */}
      {packModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-[#03387E] text-white flex items-center justify-between">
              <div>
                <span className="eyebrow text-blue-200">Catálogo Oficial</span>
                <h3 className="font-heading font-bold text-lg">
                  {editingServiceId ? "Editar Plan de Clases" : "Nuevo Pack de Clases"}
                </h3>
              </div>
              <button
                onClick={() => setPackModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePack} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del Plan / Pack
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pack 15 Clases Intensivo"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalle de maniobras, prácticas o circuito..."
                  value={packDescription}
                  onChange={(e) => setPackDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cantidad de Clases
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={packClassesCount}
                    onChange={(e) => setPackClassesCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min={30}
                    step={15}
                    value={packDuration}
                    onChange={(e) => setPackDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Precio Base Oficial ($ ARS)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  required
                  value={packPrice}
                  onChange={(e) => setPackPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-sm font-black text-[#03387E]"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Cálculo aproximado:{" "}
                  <strong>
                    {formatCurrency(
                      packClassesCount > 0 ? Math.round(packPrice / packClassesCount) : packPrice
                    )}
                  </strong>{" "}
                  por clase.
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={packOnline}
                    onChange={(e) => setPackOnline(e.target.checked)}
                    className="rounded text-[#03387E] focus:ring-[#00A3FF]"
                  />
                  <span>Habilitar para reserva online en el turnero web</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPackModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-pill btn-pill-primary px-5 py-2 font-bold cursor-pointer">
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDITAR ARANCEL BASE DE ALQUILER DE AUTO PARA RENDIR
          ========================================================================= */}
      {examRentalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-[#03387E] text-white flex items-center justify-between">
              <div>
                <span className="eyebrow text-blue-200">Arancel Examen Oficial</span>
                <h3 className="font-heading font-bold text-lg">Alquiler de Auto para Rendir</h3>
              </div>
              <button
                onClick={() => setExamRentalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExamFee} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 text-xs">
                Este valor se utiliza como arancel sugerido al agregar el alquiler de auto para rendir examen a cualquier alumno en la pista de Florencio Varela.
              </p>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Valor del Alquiler de Auto para Examen ($ ARS)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  required
                  value={newExamFee}
                  onChange={(e) => setNewExamFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-base font-black text-[#03387E]"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-slate-700 space-y-1">
                <div className="font-bold text-[#03387E] text-xs">¿Qué incluye este valor?</div>
                <div className="text-[11px] text-slate-600">
                  • Traslado y espera en la pista de Florencio Varela.
                </div>
                <div className="text-[11px] text-slate-600">
                  • Auto doble comando con póliza escolar de seguro y VTV al día.
                </div>
                <div className="text-[11px] text-slate-600">
                  • Instructor docente a cargo del acompañamiento.
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExamRentalModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-pill btn-pill-primary px-5 py-2 font-bold cursor-pointer">
                  Actualizar Arancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ASIGNAR PACK O CLASE PERSONALIZADA A UN ALUMNO
          ========================================================================= */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-[#03387E] text-white flex items-center justify-between shrink-0">
              <div>
                <span className="eyebrow text-blue-200">Asignación Directa</span>
                <h3 className="font-heading font-bold text-lg">Asignar Pack o Clase a Alumno</h3>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Selección del Alumno */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Seleccionar Alumno
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-xs font-semibold cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} — DNI {c.dni} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Modo: Pack Estándar vs Personalizado */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Modalidad de Clases
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentType("standard");
                      const std = services.find((s) => s.id === selectedServiceId) || services[0];
                      setCustomPriceAgreed(std?.price || 110000);
                      setCustomClassCount(std?.package_class_count || 5);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                      assignmentType === "standard"
                        ? "bg-[#03387E] text-white border-[#03387E] shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Pack de Catálogo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentType("custom");
                      setCustomPriceAgreed(130000);
                      setCustomClassCount(6);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                      assignmentType === "custom"
                        ? "bg-[#03387E] text-white border-[#03387E] shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Clases Personalizadas
                  </button>
                </div>
              </div>

              {/* Opciones según tipo */}
              {assignmentType === "standard" ? (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Seleccionar Pack de Catálogo
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => {
                      setSelectedServiceId(e.target.value);
                      const found = services.find((s) => s.id === e.target.value);
                      if (found) {
                        setCustomPriceAgreed(found.price);
                        setCustomClassCount(found.package_class_count || 1);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-xs font-semibold cursor-pointer"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.package_class_count} clases ({formatCurrency(s.price)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div>
                    <label className="block font-bold text-purple-900 uppercase tracking-wider mb-1">
                      Nombre o Motivo del Plan Personalizado
                    </label>
                    <input
                      type="text"
                      value={customPackageName}
                      onChange={(e) => setCustomPackageName(e.target.value)}
                      placeholder="Ej: Refuerzo estacionamiento y pista"
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl outline-hidden text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-purple-900 uppercase tracking-wider mb-1">
                      Cantidad Total de Clases Personalizadas
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={customClassCount}
                      onChange={(e) => setCustomClassCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl outline-hidden text-xs font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Precio acordado de las clases (Editable libremente para promociones o ajustes) */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Arancel Acordado de las Clases ($ ARS)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={customPriceAgreed}
                  onChange={(e) => setCustomPriceAgreed(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-sm font-black text-[#03387E]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Podés editar este valor si aplicaste un descuento o precio especial para este alumno.
                </span>
              </div>

              {/* Alquiler de Auto para Rendir Examen */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#00A3FF]" />
                    <span className="font-bold text-slate-900 text-xs">
                      ¿Incluye Alquiler de Auto para Rendir Examen?
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeExamCarRental}
                    onChange={(e) => setIncludeExamCarRental(e.target.checked)}
                    className="w-4 h-4 rounded text-[#03387E] focus:ring-[#00A3FF] cursor-pointer"
                  />
                </label>

                {includeExamCarRental && (
                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-600 font-medium">
                      Valor asignado por alquiler de auto:
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={examRentalValue}
                      onChange={(e) => setExamRentalValue(Number(e.target.value))}
                      className="w-32 px-2.5 py-1 bg-white border border-blue-300 rounded-xl font-bold text-xs text-right text-[#03387E] outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Registro de Pago Inicial y Saldo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pago Inicial / Seña ($ ARS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={initialPaymentAmount}
                    onChange={(e) => setInitialPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Saldo Restante
                  </label>
                  <div className="px-3 py-2 bg-slate-100 rounded-xl font-black text-xs text-amber-700">
                    {formatCurrency(currentBalanceDue)}
                  </div>
                </div>
              </div>

              {/* Resumen del Contrato */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Clases ({assignmentType === "standard" ? `${customClassCount} clases` : `${customClassCount} personalizadas`}):</span>
                  <span>{formatCurrency(customPriceAgreed)}</span>
                </div>
                {includeExamCarRental && (
                  <div className="flex justify-between text-slate-600">
                    <span>Alquiler auto para examen:</span>
                    <span>+{formatCurrency(examRentalValue)}</span>
                  </div>
                )}
                <div className="flex justify-between font-heading font-black text-slate-900 pt-1 border-t border-slate-200 text-sm">
                  <span>Total Contrato:</span>
                  <span className="text-[#03387E]">{formatCurrency(currentTotalContract)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Ej: Saldo a cancelar antes de la clase 4..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-xs resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-pill btn-pill-primary px-5 py-2 font-bold cursor-pointer">
                  Confirmar y Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: EDITAR ASIGNACIÓN EXISTENTE
          ========================================================================= */}
      {editAsgModalOpen && editingAsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-[#03387E] text-white flex items-center justify-between">
              <div>
                <span className="eyebrow text-blue-200">Editar Asignación</span>
                <h3 className="font-heading font-bold text-lg">{editingAsg.client_name}</h3>
              </div>
              <button
                onClick={() => setEditAsgModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditAsg} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Arancel Acordado Clases ($ ARS)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={editAsgPrice}
                  onChange={(e) => setEditAsgPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden font-bold text-sm text-[#03387E]"
                />
              </div>

              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-slate-900">Alquiler de Auto para Examen</span>
                  <input
                    type="checkbox"
                    checked={editAsgRentalInclude}
                    onChange={(e) => setEditAsgRentalInclude(e.target.checked)}
                    className="rounded text-[#03387E]"
                  />
                </label>

                {editAsgRentalInclude && (
                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Valor Alquiler:</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={editAsgRentalFee}
                      onChange={(e) => setEditAsgRentalFee(Number(e.target.value))}
                      className="w-32 px-2.5 py-1 bg-white border border-blue-300 rounded-xl font-bold text-xs text-right text-[#03387E]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Monto Abonado ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editAsgPaid}
                    onChange={(e) => setEditAsgPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clases Tomadas
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={editingAsg.class_count}
                    value={editAsgClassesTaken}
                    onChange={(e) => setEditAsgClassesTaken(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditAsgModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-pill btn-pill-primary px-5 py-2 font-bold cursor-pointer">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
