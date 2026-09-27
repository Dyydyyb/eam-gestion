"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  MessageSquare,
  Filter,
  Eye,
  Check,
  Trash2,
  CalendarDays,
  ListFilter,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Lesson, LessonStatus } from "@/lib/types";
import { formatTime, formatDate } from "@/lib/utils";
import { messagingService, DEFAULT_TEMPLATES } from "@/lib/messaging";

export default function AgendaPage() {
  const { lessons, instructors, vehicles, updateLessonStatus, markReminderSent, deleteLesson } = useApp();

  // Fecha seleccionada de referencia (por defecto 18 de septiembre de 2026)
  const [selectedDate, setSelectedDate] = useState("2026-09-18");
  const [viewMode, setViewMode] = useState<"mes" | "semana" | "dia" | "instructor">("mes");
  const [filterInstructor, setFilterInstructor] = useState<string>("all");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal para ver o editar estado de la clase
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [classNotes, setClassNotes] = useState("");
  const [completedStatus, setCompletedStatus] = useState<LessonStatus>("realizada");

  // Horarios de la jornada escolar (08:00 a 19:00)
  const timeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  // Cálculo del año y mes actual para el calendario
  const currentDateObj = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);
  const currentYear = currentDateObj.getFullYear();
  const currentMonth = currentDateObj.getMonth(); // 0 a 11

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  // Generador de la cuadrícula mensual (Lunes a Domingo)
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // En JS 0=Domingo, 1=Lunes... Convertir a 0=Lunes, 6=Domingo:
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // Días del mes anterior para rellenar
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === "2026-09-18",
        isSelected: dateStr === selectedDate,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === "2026-09-18",
        isSelected: dateStr === selectedDate,
      });
    }

    // Días del mes siguiente para completar cuadrícula (múltiplo de 7, máx 42 celdas)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === "2026-09-18",
        isSelected: dateStr === selectedDate,
      });
    }

    return cells;
  }, [currentYear, currentMonth, selectedDate]);

  // Días de la semana seleccionada (para vista semana)
  const currentWeekDays = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Lunes
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);

    const week: { dateStr: string; dayName: string; dayNumber: number; isSelected: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = dayDate.toISOString().split("T")[0];
      week.push({
        dateStr,
        dayName: daysOfWeek[i],
        dayNumber: dayDate.getDate(),
        isSelected: dateStr === selectedDate,
      });
    }
    return week;
  }, [selectedDate]);

  // Filtrar clases globales
  const allFilteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const matchInst = filterInstructor === "all" || l.instructor_id === filterInstructor;
      const matchVeh = filterVehicle === "all" || l.vehicle_id === filterVehicle;
      const matchStatus = filterStatus === "all" || l.status === filterStatus;
      return matchInst && matchVeh && matchStatus;
    });
  }, [lessons, filterInstructor, filterVehicle, filterStatus]);

  // Clases del día seleccionado
  const dayLessons = useMemo(() => {
    return allFilteredLessons.filter((l) => l.start_time.startsWith(selectedDate));
  }, [allFilteredLessons, selectedDate]);

  const handleOpenLesson = (lesson: Lesson, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedLesson(lesson);
    setClassNotes(lesson.instructor_notes || "");
    setCompletedStatus(lesson.status);
  };

  const handleSaveLessonStatus = () => {
    if (!selectedLesson) return;
    updateLessonStatus(selectedLesson.id, completedStatus, classNotes);
    setSelectedLesson(null);
  };

  const handleSendWhatsApp = (lesson: Lesson, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  const changeMonth = (delta: number) => {
    const nextDate = new Date(currentYear, currentMonth + delta, 1);
    setSelectedDate(nextDate.toISOString().split("T")[0]);
  };

  const changeDay = (days: number) => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const statusColors: Record<LessonStatus, { bg: string; text: string; border: string }> = {
    pendiente: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
    confirmada: { bg: "bg-blue-50", text: "text-[#03387E]", border: "border-blue-300" },
    en_curso: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-300" },
    realizada: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
    cancelada: { bg: "bg-red-50", text: "text-red-800", border: "border-red-300" },
    ausente: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
    reprogramada: { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-300" },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Principal de la Agenda */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-sm border border-slate-200 flex items-center justify-center shrink-0 ring-4 ring-[#03387E]/5">
            <Image src="/logo.png" alt="EAM Logo" width={38} height={38} className="object-contain" priority />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">Programación de Turnos</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#03387E]">
                Florencio Varela
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
              Agenda & Calendario
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Calendario dinámico con filtrado interactivo por instructores y anti-solapamiento de flota.
            </p>
          </div>
        </div>

        {/* Controles de Navegación de Fecha y Selector de Vista */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navegador de Fecha */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl shadow-2xs p-1">
            <button
              onClick={() => (viewMode === "mes" ? changeMonth(-1) : changeDay(-1))}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title={viewMode === "mes" ? "Mes anterior" : "Día anterior"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {viewMode === "mes" ? (
              <span className="px-3 py-1 text-xs md:text-sm font-bold text-slate-800 min-w-[140px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 text-xs md:text-sm font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
              />
            )}

            <button
              onClick={() => (viewMode === "mes" ? changeMonth(1) : changeDay(1))}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title={viewMode === "mes" ? "Mes siguiente" : "Día siguiente"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate("2026-09-18")}
              className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-[#03387E] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              title="Ir a hoy"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hoy</span>
            </button>
          </div>

          {/* Vistas: Mes (Calendario), Semana, Día, Por Instructor */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold">
            <button
              onClick={() => setViewMode("mes")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "mes" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Mes</span>
            </button>
            <button
              onClick={() => setViewMode("semana")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "semana" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode("dia")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "dia" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode("instructor")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "instructor" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Por Instructor
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtro Rápido por Instructores (Con Pills Interactivas) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#00A3FF]" />
            <span>Filtrar por Instructor:</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Auto:</span>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-hidden text-xs"
            >
              <option value="all">Toda la Flota</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.plate})
                </option>
              ))}
            </select>

            <span className="text-slate-500 ml-2">Estado:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-hidden text-xs"
            >
              <option value="all">Todos los estados</option>
              <option value="confirmada">Confirmadas</option>
              <option value="realizada">Realizadas</option>
              <option value="en_curso">En curso</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>

        {/* Pills de Instructores con Avatar y Conteo de Clases */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => setFilterInstructor("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterInstructor === "all"
                ? "bg-[#03387E] text-white shadow-xs scale-105"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Todos los Instructores</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterInstructor === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {lessons.length}
            </span>
          </button>

          {instructors.map((inst) => {
            const isSelected = filterInstructor === inst.id;
            const instLessonsCount = lessons.filter((l) => l.instructor_id === inst.id).length;

            return (
              <button
                key={inst.id}
                onClick={() => setFilterInstructor(isSelected ? "all" : inst.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? "bg-white border-[#00A3FF] text-[#03387E] shadow-sm ring-2 ring-[#00A3FF]/20 scale-105 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: inst.color_hex }}
                />
                <span>{inst.full_name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-[#00A3FF] text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {instLessonsCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          VISTA 1: CALENDARIO MENSUAL (Grilla 7 columnas Lunes a Domingo)
          ========================================================================= */}
      {viewMode === "mes" && (
        <div className="eam-card overflow-hidden p-0 border border-slate-200 shadow-sm">
          {/* Header de días de la semana */}
          <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center font-heading font-bold text-xs text-slate-600 py-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="truncate px-1">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.substring(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Grilla de celdas por día */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-200">
            {calendarGrid.map((cell, idx) => {
              const cellLessons = allFilteredLessons.filter((l) => l.start_time.startsWith(cell.dateStr));

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                  }}
                  className={`min-h-[110px] md:min-h-[135px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                    !cell.isCurrentMonth
                      ? "bg-slate-50/70 text-slate-400"
                      : cell.isSelected
                      ? "bg-blue-50/50"
                      : "bg-white hover:bg-slate-50/80"
                  }`}
                >
                  {/* Cabecera del día */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs md:text-sm font-heading font-black inline-flex items-center justify-center w-7 h-7 rounded-full transition-all ${
                        cell.isToday
                          ? "bg-[#00A3FF] text-white shadow-xs ring-2 ring-[#00A3FF]/30"
                          : cell.isSelected
                          ? "bg-[#03387E] text-white"
                          : cell.isCurrentMonth
                          ? "text-slate-800 group-hover:text-[#00A3FF]"
                          : "text-slate-400"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cellLessons.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {cellLessons.length} {cellLessons.length === 1 ? "turno" : "turnos"}
                      </span>
                    )}
                  </div>

                  {/* Lista de chips de turnos en el día */}
                  <div className="mt-1.5 space-y-1 flex-1 overflow-hidden">
                    {cellLessons.slice(0, 3).map((l) => {
                      const instObj = instructors.find((i) => i.id === l.instructor_id);
                      const instColor = instObj?.color_hex || "#03387E";

                      return (
                        <div
                          key={l.id}
                          onClick={(e) => handleOpenLesson(l, e)}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 truncate shadow-2xs border hover:scale-[1.02] transition-transform ${statusColors[l.status].bg} ${statusColors[l.status].border}`}
                          title={`${formatTime(l.start_time)} - ${l.client_name} (${l.instructor_name}) - ${l.status}`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: instColor }}
                          />
                          <span className="font-bold text-slate-900">{formatTime(l.start_time)}</span>
                          <span className="truncate text-slate-700">{l.client_name}</span>
                        </div>
                      );
                    })}

                    {cellLessons.length > 3 && (
                      <div className="text-[10px] font-bold text-[#00A3FF] text-center pt-0.5">
                        +{cellLessons.length - 3} más...
                      </div>
                    )}
                  </div>

                  {cellLessons.length === 0 && cell.isCurrentMonth && (
                    <div className="text-[10px] text-slate-300 italic opacity-0 group-hover:opacity-100 transition-opacity">
                      Libre
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 2: CALENDARIO SEMANAL
          ========================================================================= */}
      {viewMode === "semana" && (
        <div className="eam-card overflow-x-auto p-0 border border-slate-200 shadow-sm">
          <div className="min-w-[900px]">
            {/* Header de días de la semana actual */}
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 divide-x divide-slate-200 text-center py-2.5">
              {currentWeekDays.map((w) => (
                <div
                  key={w.dateStr}
                  onClick={() => setSelectedDate(w.dateStr)}
                  className={`cursor-pointer px-2 py-1 rounded-xl transition-all ${
                    w.isSelected ? "bg-white shadow-xs font-bold text-[#03387E]" : "hover:bg-slate-200/60"
                  }`}
                >
                  <div className="text-xs font-medium text-slate-500 uppercase">{w.dayName}</div>
                  <div className="text-base font-heading font-black text-slate-900">{w.dayNumber}</div>
                </div>
              ))}
            </div>

            {/* Columnas de los 7 días con sus turnos */}
            <div className="grid grid-cols-7 divide-x divide-slate-200 bg-white min-h-[450px]">
              {currentWeekDays.map((w) => {
                const dayWeekLessons = allFilteredLessons.filter((l) => l.start_time.startsWith(w.dateStr));

                return (
                  <div
                    key={w.dateStr}
                    className={`p-2.5 space-y-2 ${w.isSelected ? "bg-blue-50/20" : "bg-white"}`}
                  >
                    {dayWeekLessons.map((l) => {
                      const instObj = instructors.find((i) => i.id === l.instructor_id);

                      return (
                        <div
                          key={l.id}
                          onClick={() => handleOpenLesson(l)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:shadow-md transition-all ${statusColors[l.status].bg} ${statusColors[l.status].border}`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#00A3FF]" />
                              {formatTime(l.start_time)}
                            </span>
                            <span className={`text-[10px] uppercase font-black ${statusColors[l.status].text}`}>
                              {l.status}
                            </span>
                          </div>
                          <div className="font-bold text-slate-800 truncate mt-1">{l.client_name}</div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: instObj?.color_hex || "#03387E" }}
                            />
                            <span>{l.instructor_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{l.vehicle_model}</div>
                        </div>
                      );
                    })}

                    {dayWeekLessons.length === 0 && (
                      <div className="py-12 text-center text-slate-300 text-xs italic">
                        Sin turnos
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 3: AGENDA POR INSTRUCTOR (Columnas de Recursos)
          ========================================================================= */}
      {viewMode === "instructor" && (
        <div className="eam-card overflow-x-auto p-4 border border-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Turnos para la fecha: <strong>{formatDate(`${selectedDate}T12:00:00`)}</strong>
            </span>
          </div>

          <div className="min-w-[800px] grid grid-cols-5 gap-3">
            {instructors
              .filter((i) => filterInstructor === "all" || i.id === filterInstructor)
              .map((inst) => {
                const instLessons = dayLessons.filter((l) => l.instructor_id === inst.id);

                return (
                  <div key={inst.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                    <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-200">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: inst.color_hex }}
                      />
                      <div className="truncate">
                        <div className="font-heading font-bold text-xs text-slate-900 truncate">
                          {inst.full_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {instLessons.length} {instLessons.length === 1 ? "clase hoy" : "clases hoy"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {instLessons.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => handleOpenLesson(l)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:shadow-md transition-all ${statusColors[l.status].bg} ${statusColors[l.status].border}`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{formatTime(l.start_time)} hs</span>
                            <span className={`text-[10px] uppercase font-black ${statusColors[l.status].text}`}>
                              {l.status}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800 truncate mt-1">
                            {l.client_name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{l.vehicle_model}</div>
                        </div>
                      ))}

                      {instLessons.length === 0 && (
                        <div className="py-10 text-center text-slate-400 text-xs italic">
                          Sin turnos asignados
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 4: AGENDA DIARIA (Cronograma Horario)
          ========================================================================= */}
      {viewMode === "dia" && (
        <div className="eam-card p-6 divide-y divide-slate-100 border border-slate-200">
          <div className="pb-3 flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-slate-900">
              Cronograma del {formatDate(`${selectedDate}T12:00:00`)}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#03387E]">
              {dayLessons.length} clases agendadas
            </span>
          </div>

          {timeSlots.map((slotTime) => {
            const slotLessons = dayLessons.filter((l) =>
              formatTime(l.start_time).startsWith(slotTime.substring(0, 2))
            );

            return (
              <div key={slotTime} className="py-3.5 flex flex-col md:flex-row md:items-start gap-4">
                <div className="w-24 shrink-0 font-heading font-black text-sm text-[#03387E] flex items-center gap-1.5 pt-1">
                  <Clock className="w-4 h-4 text-[#00A3FF]" />
                  <span>{slotTime} hs</span>
                </div>

                <div className="flex-1 space-y-2">
                  {slotLessons.length > 0 ? (
                    slotLessons.map((lesson) => {
                      const instObj = instructors.find((i) => i.id === lesson.instructor_id);

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleOpenLesson(lesson)}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-md ${statusColors[lesson.status].bg} ${statusColors[lesson.status].border}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {lesson.client_name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[lesson.status].text}`}
                              >
                                {lesson.status.toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                • {lesson.service_name}
                              </span>
                            </div>

                            <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: instObj?.color_hex || "#03387E" }}
                                />
                                Instructor: <strong>{lesson.instructor_name}</strong>
                              </span>
                              <span className="flex items-center gap-1">
                                <Car className="w-3.5 h-3.5 text-slate-400" />
                                Auto: <strong>{lesson.vehicle_model}</strong> ({lesson.vehicle_plate})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {lesson.whatsapp_reminder_sent ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-full">
                                <Check className="w-3.5 h-3.5" />
                                Recordatorio Enviado
                              </span>
                            ) : (
                              <button
                                onClick={(e) => handleSendWhatsApp(lesson, e)}
                                className="btn-pill btn-pill-whatsapp px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-2 text-xs text-slate-400 italic">
                      Horario libre para asignación o reserva online
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle / Cierre de Clase */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-[#03387E] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                  <Image src="/logo.png" alt="EAM Logo" width={32} height={32} className="object-contain" />
                </div>
                <div>
                  <span className="eyebrow text-blue-200">Detalle Operativo EAM</span>
                  <h3 className="font-heading font-bold text-lg">Gestión de Turno</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedLesson(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-slate-900 text-base">
                    {selectedLesson.client_name}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      statusColors[selectedLesson.status].text
                    } ${statusColors[selectedLesson.status].bg}`}
                  >
                    {selectedLesson.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Fecha: {formatDate(selectedLesson.start_time)} • Horario:{" "}
                  {formatTime(selectedLesson.start_time)} a {formatTime(selectedLesson.end_time)} hs
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                  <span>
                    Instructor: <strong>{selectedLesson.instructor_name}</strong>
                  </span>
                  <span>
                    Auto: <strong>{selectedLesson.vehicle_model}</strong> ({selectedLesson.vehicle_plate})
                  </span>
                </div>
              </div>

              {/* Selector de Estado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Estado de la Clase
                </label>
                <select
                  value={completedStatus}
                  onChange={(e) => setCompletedStatus(e.target.value as LessonStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden focus:border-[#00A3FF]"
                >
                  <option value="confirmada">Confirmada</option>
                  <option value="en_curso">En curso</option>
                  <option value="realizada">Realizada (Clase completada)</option>
                  <option value="ausente">Ausente (Alumno no se presentó)</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="reprogramada">Reprogramada</option>
                </select>
              </div>

              {/* Observaciones del Instructor / Habilidades trabajadas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observaciones / Progreso de Habilidades
                </label>
                <textarea
                  rows={3}
                  value={classNotes}
                  onChange={(e) => setClassNotes(e.target.value)}
                  placeholder="Ej: Se practicó estacionamiento a 45°. Se recomienda reforzar embrague..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] text-xs resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(selectedLesson)}
                    className="btn-pill btn-pill-whatsapp px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `¿Estás seguro de eliminar el turno de ${selectedLesson.client_name}? Esta acción no se puede deshacer.`
                        )
                      ) {
                        deleteLesson(selectedLesson.id);
                        setSelectedLesson(null);
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-full transition-all flex items-center gap-1 cursor-pointer"
                    title="Eliminar este turno"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Turno</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLesson(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLessonStatus}
                    className="btn-pill btn-pill-primary px-5 py-2 text-xs font-bold cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
