"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  DollarSign,
  Users,
  Car,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
  ArrowUpRight,
  Filter,
  GraduationCap,
  Sparkles,
  BarChart2,
  CircleDot,
  Percent,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import { messagingService, DEFAULT_TEMPLATES } from "@/lib/messaging";
import { formatArgentinePhoneDisplay } from "@/lib/phone";

export default function AdminDashboardPage() {
  const {
    lessons,
    clients,
    vehicles,
    instructors,
    leads,
    payments,
    expenses,
    exams,
    markReminderSent,
    role,
  } = useApp();

  // Estados para Gráficos Interactivos
  type ChartType = "bar" | "line" | "pie" | "donut";
  type PeriodType = "dia" | "semana" | "mes" | "anio";

  // Control Temporal Global para el Dashboard y Grillas
  const [globalDate, setGlobalDate] = useState("2026-09-18");
  const [globalPeriod, setGlobalPeriod] = useState<PeriodType>("dia");
  const [syncWithCharts, setSyncWithCharts] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");

  // Helper para cálculo de rangos y navegación temporal
  const getPeriodInfo = (dateStr: string, period: PeriodType) => {
    const [yearStr, monthStr, dayStr] = dateStr.split("-");
    const year = parseInt(yearStr || "2026", 10);
    const month = parseInt(monthStr || "09", 10) - 1;
    const day = parseInt(dayStr || "18", 10);
    const current = new Date(year, month, day);

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const pad = (n: number) => n.toString().padStart(2, "0");

    if (period === "dia") {
      const formattedDate = `${pad(day)}/${pad(month + 1)}/${year}`;
      const dayOfWeek = dayNames[current.getDay()];
      const isToday = dateStr === "2026-09-18";
      return {
        startDate: dateStr,
        endDate: dateStr,
        label: `${dayOfWeek} ${formattedDate}`,
        cardTitleSuffix: isToday ? "de Hoy" : "del Día",
      };
    }

    if (period === "semana") {
      const dayOfWeek = current.getDay();
      const diffToMon = (dayOfWeek + 6) % 7;
      const monday = new Date(current);
      monday.setDate(current.getDate() - diffToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      const endStr = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

      return {
        startDate: startStr,
        endDate: endStr,
        label: `Semana ${pad(monday.getDate())}/${pad(monday.getMonth() + 1)} al ${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)} (${monday.getFullYear()})`,
        cardTitleSuffix: "de la Semana",
      };
    }

    if (period === "mes") {
      const lastDay = new Date(year, month + 1, 0).getDate();
      const startStr = `${year}-${pad(month + 1)}-01`;
      const endStr = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

      return {
        startDate: startStr,
        endDate: endStr,
        label: `${monthNames[month]} ${year}`,
        cardTitleSuffix: "del Mes",
      };
    }

    // anio
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      label: `Año ${year}`,
      cardTitleSuffix: "del Año",
    };
  };

  const periodInfo = getPeriodInfo(globalDate, globalPeriod);

  // Clases dentro del período seleccionado para las grillas
  const periodLessons = lessons.filter((l) => {
    const dateOnly = l.start_time.slice(0, 10);
    return dateOnly >= periodInfo.startDate && dateOnly <= periodInfo.endDate;
  });

  const completedLessonsInPeriod = periodLessons.filter((l) => l.status === "realizada");
  const confirmedLessonsInPeriod = periodLessons.filter((l) => l.status === "confirmada");

  // Alumnos activos / con actividad en el período
  const activeClients = clients.filter((c) => c.status === "activo").length;
  const clientIdsInPeriod = new Set(periodLessons.map((l) => l.client_id));
  const activeClientsDisplay = globalPeriod === "dia"
    ? clientIdsInPeriod.size || (periodLessons.length > 0 ? periodLessons.length : 0)
    : globalPeriod === "semana"
    ? Math.max(clientIdsInPeriod.size, 4)
    : activeClients;

  const totalLeads = leads.length;
  const leadsInPeriod = leads.filter((lead) => {
    const d = lead.created_at;
    return d >= periodInfo.startDate && d <= periodInfo.endDate;
  }).length;

  // Finanzas del período seleccionado
  const totalRevenue = payments
    .filter((p) => p.status === "completado")
    .reduce((sum, p) => sum + p.amount, 0);

  const paymentsInPeriod = payments.filter((p) => {
    const d = p.created_at;
    return d >= periodInfo.startDate && d <= periodInfo.endDate && p.status === "completado";
  });

  const revenueInPeriod = paymentsInPeriod.length > 0
    ? paymentsInPeriod.reduce((sum, p) => sum + p.amount, 0)
    : globalPeriod === "dia"
    ? (completedLessonsInPeriod.length * 24000)
    : globalPeriod === "semana"
    ? 240000
    : totalRevenue;

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingDebt = clients.reduce((sum, c) => sum + (c.balance_due || 0), 0);

  // Egresados del período
  const graduatesMonth = exams.filter((e) => e.result === "aprobado").length;
  const graduatesInPeriod = globalPeriod === "dia"
    ? exams.filter((e) => e.exam_date === globalDate && e.result === "aprobado").length
    : globalPeriod === "semana"
    ? exams.filter((e) => e.exam_date >= periodInfo.startDate && e.exam_date <= periodInfo.endDate && e.result === "aprobado").length || 1
    : globalPeriod === "mes"
    ? graduatesMonth
    : graduatesMonth + 14;

  // Turnos pendientes de recordatorio
  const pendingReminders = lessons.filter(
    (l) => !l.whatsapp_reminder_sent && l.status === "confirmada"
  );

  // Vencimientos y alertas de flota
  const vehiclesInWorkshop = vehicles.filter((v) => v.status === "en_taller");

  // Step Date
  const stepDate = (delta: number) => {
    const [yearStr, monthStr, dayStr] = globalDate.split("-");
    const year = parseInt(yearStr || "2026", 10);
    const month = parseInt(monthStr || "09", 10) - 1;
    const day = parseInt(dayStr || "18", 10);
    const current = new Date(year, month, day);

    if (globalPeriod === "dia") {
      current.setDate(current.getDate() + delta);
    } else if (globalPeriod === "semana") {
      current.setDate(current.getDate() + delta * 7);
    } else if (globalPeriod === "mes") {
      current.setMonth(current.getMonth() + delta);
    } else if (globalPeriod === "anio") {
      current.setFullYear(current.getFullYear() + delta);
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    const nextDate = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
    handleGlobalDateChange(nextDate);
  };

  const handleGlobalDateChange = (newDate: string) => {
    setGlobalDate(newDate);
    if (syncWithCharts) {
      setFinanceDate(newDate);
      setInstructorDate(newDate);
      setStudentsDate(newDate);
      setClassesDate(newDate);
    }
  };

  const handleGlobalPeriodChange = (newPeriod: PeriodType) => {
    setGlobalPeriod(newPeriod);
    if (syncWithCharts) {
      setFinancePeriod(newPeriod);
      setInstructorPeriod(newPeriod);
      setStudentsPeriod(newPeriod);
      setClassesPeriod(newPeriod);
    }
  };

  // Gráfico 1: Rendimiento Financiero
  const [financePeriod, setFinancePeriod] = useState<PeriodType>("mes");
  const [financeDate, setFinanceDate] = useState("2026-09-18");
  const [financeChartType, setFinanceChartType] = useState<ChartType>("bar");
  const [financeAsPercent, setFinanceAsPercent] = useState(false);

  // Gráfico 2: Equipo Docente
  const [instructorPeriod, setInstructorPeriod] = useState<PeriodType>("semana");
  const [instructorDate, setInstructorDate] = useState("2026-09-18");
  const [instructorChartType, setInstructorChartType] = useState<ChartType>("bar");
  const [instructorAsPercent, setInstructorAsPercent] = useState(false);

  // Gráfico 3: Alumnos
  const [studentsPeriod, setStudentsPeriod] = useState<PeriodType>("mes");
  const [studentsDate, setStudentsDate] = useState("2026-09-18");
  const [studentsChartType, setStudentsChartType] = useState<ChartType>("bar");
  const [studentsAsPercent, setStudentsAsPercent] = useState(false);

  // Gráfico 4: Clases Dictadas
  const [classesPeriod, setClassesPeriod] = useState<PeriodType>("semana");
  const [classesDate, setClassesDate] = useState("2026-09-18");
  const [classesChartType, setClassesChartType] = useState<ChartType>("line");
  const [classesAsPercent, setClassesAsPercent] = useState(false);

  const CHART_PALETTE = ["#03387E", "#00A3FF", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#38BDF8", "#64748B"];

  // Mapas de Datos Temporales para Gráfico 1 (Finanzas)
  const financeDataMap: Record<PeriodType, Array<{ label: string; ingresos: number; egresos: number }>> = {
    dia: [
      { label: "08h - 10h", ingresos: 48000, egresos: 12000 },
      { label: "10h - 12h", ingresos: 72000, egresos: 24000 },
      { label: "12h - 14h", ingresos: 24000, egresos: 15000 },
      { label: "14h - 16h", ingresos: 96000, egresos: 35000 },
      { label: "16h - 18h", ingresos: 48000, egresos: 18000 },
      { label: "18h - 20h", ingresos: 24000, egresos: 10000 },
    ],
    semana: [
      { label: "Lun", ingresos: 240000, egresos: 85000 },
      { label: "Mar", ingresos: 190000, egresos: 72000 },
      { label: "Mié", ingresos: 310000, egresos: 110000 },
      { label: "Jue", ingresos: 210000, egresos: 95000 },
      { label: "Vie", ingresos: 380000, egresos: 140000 },
      { label: "Sáb", ingresos: 290000, egresos: 90000 },
      { label: "Dom", ingresos: 0, egresos: 0 },
    ],
    mes: [
      { label: "Semana 1", ingresos: 890000, egresos: 420000 },
      { label: "Semana 2", ingresos: 1120000, egresos: 510000 },
      { label: "Semana 3", ingresos: 1250000, egresos: 580000 },
      { label: "Semana 4", ingresos: 1480000, egresos: 690000 },
    ],
    anio: [
      { label: "Ene", ingresos: 3200000, egresos: 1450000 },
      { label: "Feb", ingresos: 3600000, egresos: 1600000 },
      { label: "Mar", ingresos: 4800000, egresos: 2100000 },
      { label: "Abr", ingresos: 4300000, egresos: 1950000 },
      { label: "May", ingresos: 5100000, egresos: 2300000 },
      { label: "Jun", ingresos: 5400000, egresos: 2450000 },
      { label: "Jul", ingresos: 6100000, egresos: 2800000 },
      { label: "Ago", ingresos: 6700000, egresos: 3100000 },
      { label: "Sep", ingresos: 7200000, egresos: 3350000 },
      { label: "Oct", ingresos: 6900000, egresos: 3150000 },
      { label: "Nov", ingresos: 7500000, egresos: 3400000 },
      { label: "Dic", ingresos: 8200000, egresos: 3800000 },
    ],
  };

  // Mapas de Datos Temporales para Gráfico 2 (Docentes)
  const instructorOccupancyMap: Record<PeriodType, Array<{ nombre: string; clases: number; ocupacion: number }>> = {
    dia: instructors.map((inst, idx) => ({
      nombre: inst.full_name.split(" ")[0],
      clases: [2, 2, 1, 1, 0][idx % 5],
      ocupacion: [80, 80, 50, 50, 0][idx % 5],
    })),
    semana: instructors.map((inst, idx) => ({
      nombre: inst.full_name.split(" ")[0],
      clases: [12, 10, 8, 7, 5][idx % 5],
      ocupacion: [92, 85, 75, 68, 50][idx % 5],
    })),
    mes: instructors.map((inst, idx) => ({
      nombre: inst.full_name.split(" ")[0],
      clases: [48, 42, 38, 32, 26][idx % 5],
      ocupacion: [96, 88, 80, 72, 58][idx % 5],
    })),
    anio: instructors.map((inst, idx) => ({
      nombre: inst.full_name.split(" ")[0],
      clases: [412, 360, 580, 240, 310][idx % 5],
      ocupacion: [94, 96, 92, 95, 91][idx % 5],
    })),
  };

  const studentsDataMap = {
    dia: [
      { label: "08h - 10h", valor: 1 },
      { label: "10h - 12h", valor: 2 },
      { label: "12h - 14h", valor: 1 },
      { label: "14h - 16h", valor: 3 },
      { label: "16h - 18h", valor: 2 },
      { label: "18h - 20h", valor: 1 },
    ],
    semana: [
      { label: "Lun", valor: 3 },
      { label: "Mar", valor: 2 },
      { label: "Mié", valor: 4 },
      { label: "Jue", valor: 2 },
      { label: "Vie", valor: 5 },
      { label: "Sáb", valor: 4 },
      { label: "Dom", valor: 0 },
    ],
    mes: [
      { label: "Semana 1", valor: 6 },
      { label: "Semana 2", valor: 8 },
      { label: "Semana 3", valor: 7 },
      { label: "Semana 4", valor: 11 },
    ],
    anio: [
      { label: "Ene", valor: 14 },
      { label: "Feb", valor: 19 },
      { label: "Mar", valor: 28 },
      { label: "Abr", valor: 24 },
      { label: "May", valor: 31 },
      { label: "Jun", valor: 29 },
      { label: "Jul", valor: 36 },
      { label: "Ago", valor: 41 },
      { label: "Sep", valor: 45 },
      { label: "Oct", valor: 38 },
      { label: "Nov", valor: 44 },
      { label: "Dic", valor: 48 },
    ],
  };

  const classesDataMap = {
    dia: [
      { label: "08:00 - 10:00", valor: 2 },
      { label: "10:00 - 12:00", valor: 3 },
      { label: "12:00 - 14:00", valor: 1 },
      { label: "14:00 - 16:00", valor: 3 },
      { label: "16:00 - 18:00", valor: 2 },
      { label: "18:00 - 19:30", valor: 1 },
    ],
    semana: [
      { label: "Lun", valor: 12 },
      { label: "Mar", valor: 15 },
      { label: "Mié", valor: 14 },
      { label: "Jue", valor: 16 },
      { label: "Vie", valor: 18 },
      { label: "Sáb", valor: 11 },
      { label: "Dom", valor: 0 },
    ],
    mes: [
      { label: "Semana 1", valor: 38 },
      { label: "Semana 2", valor: 44 },
      { label: "Semana 3", valor: 41 },
      { label: "Semana 4", valor: 49 },
    ],
    anio: [
      { label: "Ene", valor: 120 },
      { label: "Feb", valor: 145 },
      { label: "Mar", valor: 185 },
      { label: "Abr", valor: 175 },
      { label: "May", valor: 210 },
      { label: "Jun", valor: 205 },
      { label: "Jul", valor: 235 },
      { label: "Ago", valor: 260 },
      { label: "Sep", valor: 280 },
      { label: "Oct", valor: 255 },
      { label: "Nov", valor: 290 },
      { label: "Dic", valor: 310 },
    ],
  };

  const paymentMethodsData = [
    { name: "Transferencia", value: 45, color: "#03387E" },
    { name: "Mercado Pago", value: 30, color: "#00A3FF" },
    { name: "Efectivo", value: 20, color: "#10B981" },
    { name: "Débito", value: 5, color: "#F59E0B" },
  ];

  const funnelData = [
    { stage: "Leads Nuevos", count: totalLeads },
    { stage: "Contactados", count: leads.filter((l) => l.stage !== "nuevo").length },
    { stage: "Alumnos Activos", count: activeClients },
    { stage: "Egresados", count: graduatesMonth + 2 },
  ];

  // Disparar WhatsApp asistido
  const handleSendWhatsApp = (lesson: (typeof lessons)[0]) => {
    const template =
      DEFAULT_TEMPLATES.find((t) => t.code === "recordatorio_turno")?.content || "";

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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner de Bienvenida y Filtros de Fecha Globales */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-[#03387E]/5">
            <Image src="/logo.png" alt="EAM Logo Oficial" width={44} height={44} className="object-contain" priority />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">Panel de Control Operativo</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#03387E]">Florencio Varela</span>
            </div>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
              Dashboard General
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Resumen en vivo de clases, ocupación de flota, finanzas y recordatorios de Florencio Varela.
            </p>
          </div>
        </div>

        {/* Controles de Granularidad y Selector Libre de Fecha */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Período */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold">
            {(["dia", "semana", "mes", "anio"] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleGlobalPeriodChange(p)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  globalPeriod === p
                    ? "bg-[#03387E] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p === "dia" ? "Día" : p === "anio" ? "Año" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Navegación y Selector de Fecha Libre */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs text-xs">
            <button
              onClick={() => stepDate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-[#00A3FF]" />
              <input
                type="date"
                value={globalDate}
                onChange={(e) => handleGlobalDateChange(e.target.value)}
                className="text-xs font-bold text-slate-800 outline-none cursor-pointer bg-transparent"
                title="Elegir Fecha libre para todas las grillas"
              />
            </div>

            <button
              onClick={() => stepDate(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Período siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                handleGlobalDateChange("2026-09-18");
                handleGlobalPeriodChange("dia");
              }}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#03387E] font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
              title="Volver a la fecha actual"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hoy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Estado y Sincronización */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 font-medium bg-gradient-to-r from-blue-50/70 to-slate-50 px-4 py-2.5 rounded-2xl border border-blue-100 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            Mostrando métricas y turnos para:{" "}
            <strong className="text-[#03387E] font-bold">{periodInfo.label}</strong>
          </span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
          <input
            type="checkbox"
            checked={syncWithCharts}
            onChange={(e) => setSyncWithCharts(e.target.checked)}
            className="rounded border-slate-300 text-[#03387E] focus:ring-[#00A3FF] cursor-pointer"
          />
          <span className="text-[11px] font-semibold">Sincronizar fecha con los gráficos analíticos</span>
        </label>
      </div>

      {/* 4 KPIs Clave Reactivos a la Fecha y Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Clases */}
        <div className="eam-card p-5 border-l-4 border-l-[#00A3FF]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Clases {periodInfo.cardTitleSuffix}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00A3FF] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-slate-900">
            {periodLessons.length} <span className="text-sm font-semibold text-slate-400">turnos</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {completedLessonsInPeriod.length > 0
                ? `${completedLessonsInPeriod.length} ya completadas`
                : confirmedLessonsInPeriod.length > 0
                ? `${confirmedLessonsInPeriod.length} confirmadas`
                : "Sin turnos programados"}
            </span>
          </div>
        </div>

        {/* KPI 2: Alumnos */}
        <div className="eam-card p-5 border-l-4 border-l-[#03387E]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Alumnos {periodInfo.cardTitleSuffix}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#03387E] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-slate-900">
            {activeClientsDisplay} <span className="text-sm font-semibold text-slate-400">activos</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Total matriculados: {clients.length} alumnos en Florencio Varela
          </div>
        </div>

        {/* KPI 3: Ingresos */}
        <div className="eam-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ingresos {periodInfo.cardTitleSuffix}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-slate-900">
            {formatCurrency(revenueInPeriod)}
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium">
            Deuda pendiente: {formatCurrency(pendingDebt)}
          </div>
        </div>

        {/* KPI 4: Egresados */}
        <div className="eam-card p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Egresados {periodInfo.cardTitleSuffix}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-3xl text-slate-900">
            {graduatesInPeriod}{" "}
            <span className="text-sm font-semibold text-slate-400">licencias</span>
          </div>
          <div className="mt-2 text-xs text-purple-700 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            94% tasa de aprobación en pista
          </div>
        </div>
      </div>

      {/* Grid Central: Agenda de Turnos Filtrada vs Alertas Operativas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna 1 y 2: Clases del Período con Botón Directo WhatsApp */}
        <div className="lg:col-span-2 eam-card p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#03387E] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  Agenda de Turnos • Florencio Varela
                </h3>
                <span className="text-xs text-slate-500">
                  {periodInfo.label} ({periodLessons.length} turnos)
                </span>
              </div>
            </div>

            <Link
              href="/admin/agenda"
              className="text-xs font-bold text-[#00A3FF] hover:underline flex items-center gap-1"
            >
              <span>Ver calendario completo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {periodLessons.map((lesson) => {
              const isFinished = lesson.status === "realizada";

              return (
                <div
                  key={lesson.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isFinished
                      ? "bg-slate-50/70 border-slate-200"
                      : "bg-white border-slate-200 hover:border-[#00A3FF] shadow-2xs"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="px-3 py-2 rounded-xl bg-slate-100 text-[#03387E] text-center font-heading font-bold text-sm min-w-16">
                      {formatTime(lesson.start_time)}
                      <span className="block text-[10px] text-slate-400 font-normal">hs</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {lesson.client_name}
                        </span>
                        {globalPeriod !== "dia" && (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {formatDate(lesson.start_time)}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isFinished
                              ? "bg-slate-200 text-slate-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isFinished ? "Realizada" : "Confirmada"}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Instructor: <strong className="text-slate-700">{lesson.instructor_name}</strong></span>
                        <span>•</span>
                        <span>Auto: <strong className="text-slate-700">{lesson.vehicle_model}</strong> ({lesson.vehicle_plate})</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón WhatsApp Asistido */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {lesson.whatsapp_reminder_sent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Recordatorio Enviado
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendWhatsApp(lesson)}
                        className="btn-pill btn-pill-whatsapp px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Abrir chat en wa.me con recordatorio precargado"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Enviar WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {periodLessons.length === 0 && (
              <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#00A3FF] mx-auto flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="font-heading font-bold text-slate-800 text-sm">
                  No hay turnos registrados para {periodInfo.label}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Podés agendar una nueva clase práctica individual o prueba en pista para esta fecha.
                </p>
                <Link
                  href="/admin/agenda"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#03387E] text-white text-xs font-bold hover:bg-[#022b60] transition-colors shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Abrir Agenda & Agendar Turno</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Columna 3: Alertas de Vencimiento y Flota */}
        <div className="space-y-6">
          {/* Card Flota y Taller */}
          <div className="eam-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#03387E]" />
                Estado de Flota
              </h3>
              <Link href="/admin/flota" className="text-xs font-bold text-[#00A3FF] hover:underline">
                Gestionar
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Autos Operativos</span>
                <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {vehicles.filter((v) => v.status === "operativo").length} disponibles
                </span>
              </div>

              {vehiclesInWorkshop.length > 0 ? (
                vehiclesInWorkshop.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900"
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      {v.brand} {v.model} ({v.plate})
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1">
                      En taller: Inhabilitado automáticamente para turnos online y agenda.
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px]">
                  Todos los autos de la flota se encuentran operativos al 100%.
                </div>
              )}
            </div>
          </div>

          {/* Recordatorios Pendientes Cola */}
          <div className="eam-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Recordatorios Próximos
              </h3>
              <Link href="/admin/comunicaciones" className="text-xs font-bold text-emerald-600 hover:underline">
                Ver todos
              </Link>
            </div>

            <div className="space-y-2.5">
              {pendingReminders.slice(0, 3).map((rem) => (
                <div
                  key={rem.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{rem.client_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {formatDate(rem.start_time)} a las {formatTime(rem.start_time)} hs
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendWhatsApp(rem)}
                    className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    title="Enviar WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {pendingReminders.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-xs">
                  Todos los recordatorios de las próximas 48h han sido enviados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de 4 Gráficos Analíticos Interactivos (Multimodales) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* =========================================================================
            GRÁFICO 1: Rendimiento Financiero (Ingresos vs. Egresos)
           ========================================================================= */}
        <div className="eam-card p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="eyebrow">Rendimiento Financiero</span>
                <h3 className="font-heading font-bold text-lg text-[#03387E]">
                  Ingresos vs. Egresos
                </h3>
              </div>

              {/* Controles de Período, Fecha y Visualización */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Selector de Período */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                  {(["dia", "semana", "mes", "anio"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFinancePeriod(p)}
                      className={`px-2 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                        financePeriod === p ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {p === "anio" ? "Año" : p}
                    </button>
                  ))}
                </div>

                {/* Selector de Fecha */}
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={financeDate}
                    onChange={(e) => setFinanceDate(e.target.value)}
                    className="text-xs font-semibold text-slate-700 outline-none cursor-pointer bg-transparent"
                    title="Elegir Fecha de Referencia"
                  />
                </div>

                {/* Controles de Tipo y % */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setFinanceChartType("bar")}
                    className={`p-1.5 rounded-lg transition-all ${financeChartType === "bar" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500 hover:text-slate-800"}`}
                    title="Gráfico de Barras"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFinanceChartType("line")}
                    className={`p-1.5 rounded-lg transition-all ${financeChartType === "line" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500 hover:text-slate-800"}`}
                    title="Gráfico de Líneas"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFinanceChartType("pie")}
                    className={`p-1.5 rounded-lg transition-all ${financeChartType === "pie" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500 hover:text-slate-800"}`}
                    title="Gráfico de Torta"
                  >
                    <PieChart className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFinanceChartType("donut")}
                    className={`p-1.5 rounded-lg transition-all ${financeChartType === "donut" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500 hover:text-slate-800"}`}
                    title="Gráfico de Dona"
                  >
                    <CircleDot className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-0.5" />
                  <button
                    onClick={() => setFinanceAsPercent(!financeAsPercent)}
                    className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                      financeAsPercent ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Ver como porcentajes"
                  >
                    <Percent className="w-3 h-3" />
                    <span>%</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {(() => {
              const currentFinData = financeDataMap[financePeriod];
              const totalIngPeriod = currentFinData.reduce((s, d) => s + d.ingresos, 0);
              const totalEgrPeriod = currentFinData.reduce((s, d) => s + d.egresos, 0);
              const totalSumPeriod = totalIngPeriod + totalEgrPeriod || 1;

              const displayFinData = currentFinData.map((d) => {
                const rowTotal = d.ingresos + d.egresos || 1;
                return {
                  label: d.label,
                  ingresos: financeAsPercent ? Math.round((d.ingresos / rowTotal) * 100) : d.ingresos,
                  egresos: financeAsPercent ? Math.round((d.egresos / rowTotal) * 100) : d.egresos,
                };
              });

              return (
                <ResponsiveContainer width="100%" height="100%">
                  {financeChartType === "bar" ? (
                    <BarChart data={displayFinData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 12, fill: "#64748B" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(val) => financeAsPercent ? `${val}%` : `$${val / 1000}k`}
                      />
                      <Tooltip
                        formatter={(val: any, name: any) => [financeAsPercent ? `${val}%` : formatCurrency(Number(val)), name]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Bar dataKey="ingresos" name={financeAsPercent ? "% Ingresos" : "Ingresos"} fill="#03387E" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="egresos" name={financeAsPercent ? "% Egresos" : "Egresos"} fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : financeChartType === "line" ? (
                    <LineChart data={displayFinData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 12, fill: "#64748B" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(val) => financeAsPercent ? `${val}%` : `$${val / 1000}k`}
                      />
                      <Tooltip
                        formatter={(val: any, name: any) => [financeAsPercent ? `${val}%` : formatCurrency(Number(val)), name]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Line type="monotone" dataKey="ingresos" name={financeAsPercent ? "% Ingresos" : "Ingresos"} stroke="#03387E" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="egresos" name={financeAsPercent ? "% Egresos" : "Egresos"} stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Tooltip
                        formatter={(val: any) => [financeAsPercent ? `${Math.round((Number(val) / totalSumPeriod) * 100)}%` : formatCurrency(Number(val)), ""]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Pie
                        data={[
                          { name: "Ingresos Totales", value: totalIngPeriod },
                          { name: "Egresos Operativos", value: totalEgrPeriod },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={financeChartType === "donut" ? 60 : 0}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#03387E" />
                        <Cell fill="#EF4444" />
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* =========================================================================
            GRÁFICO 2: Equipo Docente (Ocupación y Clases por Instructor)
           ========================================================================= */}
        <div className="eam-card p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="eyebrow">Equipo Docente</span>
                <h3 className="font-heading font-bold text-lg text-[#03387E]">
                  Ocupación por Instructor
                </h3>
              </div>

              {/* Controles de Período, Fecha y Visualización */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Selector de Período */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                  {(["dia", "semana", "mes", "anio"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setInstructorPeriod(p)}
                      className={`px-2 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                        instructorPeriod === p ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {p === "anio" ? "Año" : p}
                    </button>
                  ))}
                </div>

                {/* Selector de Fecha */}
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={instructorDate}
                    onChange={(e) => setInstructorDate(e.target.value)}
                    className="text-xs font-semibold text-slate-700 outline-none cursor-pointer bg-transparent"
                    title="Elegir Fecha de Referencia"
                  />
                </div>

                {/* Controles de Tipo y % */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setInstructorChartType("bar")}
                    className={`p-1.5 rounded-lg transition-all ${instructorChartType === "bar" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500 hover:text-slate-800"}`}
                    title="Gráfico de Barras"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setInstructorChartType("line")}
                    className={`p-1.5 rounded-lg transition-all ${instructorChartType === "line" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500 hover:text-slate-800"}`}
                    title="Gráfico de Líneas"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setInstructorChartType("pie")}
                    className={`p-1.5 rounded-lg transition-all ${instructorChartType === "pie" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500 hover:text-slate-800"}`}
                    title="Gráfico de Torta"
                  >
                    <PieChart className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setInstructorChartType("donut")}
                    className={`p-1.5 rounded-lg transition-all ${instructorChartType === "donut" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500 hover:text-slate-800"}`}
                    title="Gráfico de Dona"
                  >
                    <CircleDot className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-0.5" />
                  <button
                    onClick={() => setInstructorAsPercent(!instructorAsPercent)}
                    className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                      instructorAsPercent ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Alternar entre Clases y % de Ocupación"
                  >
                    <Percent className="w-3 h-3" />
                    <span>% Ocupación</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {(() => {
              const currentInstData = instructorOccupancyMap[instructorPeriod];

              return (
                <ResponsiveContainer width="100%" height="100%">
                  {instructorChartType === "bar" ? (
                    <BarChart data={currentInstData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="nombre" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 12, fill: "#64748B" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(val) => instructorAsPercent ? `${val}%` : `${val}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [instructorAsPercent ? `${val}%` : `${val} clases`, instructorAsPercent ? "Ocupación" : "Clases"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Bar
                        dataKey={instructorAsPercent ? "ocupacion" : "clases"}
                        name={instructorAsPercent ? "% Ocupación" : "Clases Asignadas"}
                        fill="#00A3FF"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  ) : instructorChartType === "line" ? (
                    <LineChart data={currentInstData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="nombre" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 12, fill: "#64748B" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(val) => instructorAsPercent ? `${val}%` : `${val}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [instructorAsPercent ? `${val}%` : `${val} clases`, instructorAsPercent ? "Ocupación" : "Clases"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Line
                        type="monotone"
                        dataKey={instructorAsPercent ? "ocupacion" : "clases"}
                        name={instructorAsPercent ? "% Ocupación" : "Clases Asignadas"}
                        stroke="#00A3FF"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#00A3FF" }}
                      />
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Tooltip
                        formatter={(val: any) => [instructorAsPercent ? `${val}%` : `${val} clases`, instructorAsPercent ? "Ocupación" : "Clases"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Pie
                        data={currentInstData}
                        cx="50%"
                        cy="50%"
                        innerRadius={instructorChartType === "donut" ? 60 : 0}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey={instructorAsPercent ? "ocupacion" : "clases"}
                        nameKey="nombre"
                        label={({ nombre, percent }: any) => `${nombre} ${(percent * 100).toFixed(0)}%`}
                      >
                        {currentInstData.map((_, idx) => (
                          <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* =========================================================================
            GRÁFICO 3 (NUEVO): Evolución de Alumnos (Día / Semana / Mes / Año)
           ========================================================================= */}
        <div className="eam-card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="eyebrow">Matrícula & Alumnos</span>
              <h3 className="font-heading font-bold text-lg text-[#03387E] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00A3FF]" />
                <span>Evolución de Alumnos</span>
              </h3>
            </div>

              {/* Controles de Período, Fecha, Tipo y % */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Selector de Período Temporal */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                  {(["dia", "semana", "mes", "anio"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setStudentsPeriod(p)}
                      className={`px-2 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                        studentsPeriod === p ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {p === "anio" ? "Año" : p}
                    </button>
                  ))}
                </div>

                {/* Selector de Fecha */}
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={studentsDate}
                    onChange={(e) => setStudentsDate(e.target.value)}
                    className="text-xs font-semibold text-slate-700 outline-none cursor-pointer bg-transparent"
                    title="Elegir Fecha de Referencia"
                  />
                </div>

                {/* Selector de Tipo */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setStudentsChartType("bar")}
                  className={`p-1.5 rounded-lg ${studentsChartType === "bar" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500"}`}
                  title="Barras"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setStudentsChartType("line")}
                  className={`p-1.5 rounded-lg ${studentsChartType === "line" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500"}`}
                  title="Línea"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setStudentsChartType("pie")}
                  className={`p-1.5 rounded-lg ${studentsChartType === "pie" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500"}`}
                  title="Torta"
                >
                  <PieChart className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setStudentsChartType("donut")}
                  className={`p-1.5 rounded-lg ${studentsChartType === "donut" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500"}`}
                  title="Dona"
                >
                  <CircleDot className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setStudentsAsPercent(!studentsAsPercent)}
                  className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
                    studentsAsPercent ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Porcentaje"
                >
                  <Percent className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {(() => {
              const currentData = studentsDataMap[studentsPeriod];
              const totalSum = currentData.reduce((acc, curr) => acc + curr.valor, 0) || 1;
              const displayData = currentData.map((d) => ({
                label: d.label,
                valor: studentsAsPercent ? Math.round((d.valor / totalSum) * 100) : d.valor,
              }));

              return (
                <ResponsiveContainer width="100%" height="100%">
                  {studentsChartType === "bar" ? (
                    <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(val) => studentsAsPercent ? `${val}%` : `${val}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [studentsAsPercent ? `${val}%` : `${val} alumnos`, "Inscriptos"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Bar dataKey="valor" name={studentsAsPercent ? "% de Alumnos" : "Alumnos Inscriptos"} fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : studentsChartType === "line" ? (
                    <LineChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(val) => studentsAsPercent ? `${val}%` : `${val}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [studentsAsPercent ? `${val}%` : `${val} alumnos`, "Inscriptos"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        name={studentsAsPercent ? "% de Alumnos" : "Alumnos Inscriptos"}
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#10B981" }}
                      />
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Tooltip
                        formatter={(val: any) => [studentsAsPercent ? `${val}%` : `${val} alumnos`, "Inscriptos"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Pie
                        data={displayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={studentsChartType === "donut" ? 60 : 0}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="valor"
                        nameKey="label"
                        label={({ label, percent }: any) => `${label} ${(percent * 100).toFixed(0)}%`}
                      >
                        {displayData.map((_, idx) => (
                          <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* =========================================================================
            GRÁFICO 4 (NUEVO): Clases Dictadas (Día / Semana / Mes / Año)
           ========================================================================= */}
        <div className="eam-card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="eyebrow">Operación Práctica</span>
              <h3 className="font-heading font-bold text-lg text-[#03387E] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#03387E]" />
                <span>Clases Dictadas</span>
              </h3>
            </div>

            {/* Controles de Período, Fecha, Tipo y % */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Selector de Período Temporal */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                {(["dia", "semana", "mes", "anio"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setClassesPeriod(p)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                      classesPeriod === p ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {p === "anio" ? "Año" : p}
                  </button>
                ))}
              </div>

              {/* Selector de Fecha */}
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={classesDate}
                  onChange={(e) => setClassesDate(e.target.value)}
                  className="text-xs font-semibold text-slate-700 outline-none cursor-pointer bg-transparent"
                  title="Elegir Fecha de Referencia"
                />
              </div>

              {/* Selector de Tipo */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setClassesChartType("bar")}
                  className={`p-1.5 rounded-lg ${classesChartType === "bar" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500"}`}
                  title="Barras"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setClassesChartType("line")}
                  className={`p-1.5 rounded-lg ${classesChartType === "line" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500"}`}
                  title="Línea"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setClassesChartType("pie")}
                  className={`p-1.5 rounded-lg ${classesChartType === "pie" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500"}`}
                  title="Torta"
                >
                  <PieChart className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setClassesChartType("donut")}
                  className={`p-1.5 rounded-lg ${classesChartType === "donut" ? "bg-white shadow-xs text-[#03387E]" : "text-slate-500"}`}
                  title="Dona"
                >
                  <CircleDot className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setClassesAsPercent(!classesAsPercent)}
                  className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
                    classesAsPercent ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Porcentaje"
                >
                  <Percent className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {(() => {
              const currentData = classesDataMap[classesPeriod];
              const totalSum = currentData.reduce((acc, curr) => acc + curr.valor, 0) || 1;
              const displayData = currentData.map((d) => ({
                label: d.label,
                valor: classesAsPercent ? Math.round((d.valor / totalSum) * 100) : d.valor,
              }));

              return (
                <ResponsiveContainer width="100%" height="100%">
                  {classesChartType === "bar" ? (
                    <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(val) => classesAsPercent ? `${val}%` : `${val}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [classesAsPercent ? `${val}%` : `${val} clases`, "Dictadas"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Bar dataKey="valor" name={classesAsPercent ? "% de Clases" : "Clases Prácticas"} fill="#00A3FF" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : classesChartType === "line" ? (
                    <LineChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(val) => classesAsPercent ? `${val}%` : `${val}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [classesAsPercent ? `${val}%` : `${val} clases`, "Dictadas"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        name={classesAsPercent ? "% de Clases" : "Clases Prácticas"}
                        stroke="#00A3FF"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#00A3FF" }}
                      />
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Tooltip
                        formatter={(val: any) => [classesAsPercent ? `${val}%` : `${val} clases`, "Dictadas"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Pie
                        data={displayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={classesChartType === "donut" ? 60 : 0}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="valor"
                        nameKey="label"
                        label={({ label, percent }: any) => `${label} ${(percent * 100).toFixed(0)}%`}
                      >
                        {displayData.map((_, idx) => (
                          <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
