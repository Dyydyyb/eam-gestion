"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Car,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Phone,
  Sparkles,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { normalizeArgentinePhone, isValidArgentinePhone } from "@/lib/phone";
import { messagingService, DEFAULT_TEMPLATES } from "@/lib/messaging";
import { Service, Instructor, Vehicle } from "@/lib/types";

export default function ReservarTurnoPage() {
  const { services, instructors, vehicles, lessons, checkSlotAvailable, bookLesson } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1: Servicio
  const [selectedService, setSelectedService] = useState<Service>(services[0]);

  // Paso 2: Fecha y Horario
  const [selectedDate, setSelectedDate] = useState("2026-09-19");
  const [preferredInstructor, setPreferredInstructor] = useState<string>("all");
  const [selectedSlot, setSelectedSlot] = useState<{
    instructorId: string;
    instructorName: string;
    vehicleId: string;
    vehicleModel: string;
    startTime: string;
    endTime: string;
    timeLabel: string;
  } | null>(null);

  // Paso 3: Datos del Alumno
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState<"cero" | "principiante" | "intermedio" | "avanzado">("cero");
  const [hasLicense, setHasLicense] = useState(false);
  const [comments, setComments] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Hold Timer (10 minutos)
  const [holdTimeLeft, setHoldTimeLeft] = useState(600); // 10 minutos en segundos

  // Paso 4: Confirmación
  const [confirmedBooking, setConfirmedBooking] = useState<{
    lessonId: string;
    token: string;
    startTime: string;
    endTime: string;
    instructorName: string;
    vehicleModel: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Contador regresivo del Hold
  useEffect(() => {
    if (step === 3 && holdTimeLeft > 0) {
      const timer = setInterval(() => {
        setHoldTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, holdTimeLeft]);

  // Horarios posibles durante la jornada
  const daySlots = [
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

  // Calcular slots disponibles reales (Instructor + Auto libres simultáneamente)
  const availableSlots = daySlots
    .map((slot) => {
      const start = `${selectedDate}T${slot}:00-03:00`;
      const [h, m] = slot.split(":").map(Number);
      const endH = String(h + 1).padStart(2, "0");
      const end = `${selectedDate}T${endH}:${String(m).padStart(2, "0")}:00-03:00`;

      // Buscar si existe al menos 1 instructor Y 1 vehículo operativo libre
      const availableInstructors = instructors.filter(
        (i) =>
          i.status === "activo" &&
          (preferredInstructor === "all" || i.id === preferredInstructor)
      );

      const availableVehicles = vehicles.filter((v) => v.status === "operativo");

      for (const inst of availableInstructors) {
        for (const veh of availableVehicles) {
          const check = checkSlotAvailable(inst.id, veh.id, start, end);
          if (check.available) {
            return {
              instructorId: inst.id,
              instructorName: inst.full_name,
              vehicleId: veh.id,
              vehicleModel: `${veh.brand} ${veh.model} (${veh.plate})`,
              startTime: start,
              endTime: end,
              timeLabel: slot,
            };
          }
        }
      }
      return null;
    })
    .filter(Boolean);

  const handleSelectSlot = (slot: any) => {
    setSelectedSlot(slot);
    setHoldTimeLeft(600); // Iniciar hold de 10 min
    setStep(3);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Por favor ingresá tu nombre y apellido.");
      return;
    }

    if (!dni.trim() || dni.length < 7) {
      setErrorMsg("Por favor ingresá un DNI válido.");
      return;
    }

    if (!isValidArgentinePhone(phone)) {
      setErrorMsg("Por favor ingresá un número de WhatsApp argentino válido (ej: 11 3637-3331).");
      return;
    }

    if (!acceptedTerms) {
      setErrorMsg("Debés aceptar los términos y políticas de reserva de EAM.");
      return;
    }

    if (!selectedSlot) {
      setErrorMsg("Seleccioná un horario disponible.");
      return;
    }

    const res = bookLesson({
      client_name: fullName,
      client_dni: dni,
      client_phone: phone,
      client_email: email,
      service_id: selectedService.id,
      instructor_id: selectedSlot.instructorId,
      vehicle_id: selectedSlot.vehicleId,
      start_time: selectedSlot.startTime,
      end_time: selectedSlot.endTime,
      comments,
    });

    if (!res.success) {
      setErrorMsg(res.error || "El horario acaba de ser ocupado. Por favor elegí otro horario.");
      setStep(2);
    } else {
      setConfirmedBooking({
        lessonId: res.lesson!.id,
        token: res.lesson!.public_token,
        startTime: res.lesson!.start_time,
        endTime: res.lesson!.end_time,
        instructorName: res.lesson!.instructor_name || "Instructor EAM",
        vehicleModel: res.lesson!.vehicle_model || "Auto doble comando",
      });

      setStep(4);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleWhatsAppConfirmation = () => {
    if (!confirmedBooking) return;

    const template =
      DEFAULT_TEMPLATES.find((t) => t.code === "confirmacion_reserva")?.content || "";

    const text = messagingService.buildMessage(template, {
      nombre: fullName,
      fecha: formatDate(confirmedBooking.startTime),
      hora: formatTime(confirmedBooking.startTime),
      instructor: confirmedBooking.instructorName,
      vehiculo: confirmedBooking.vehicleModel,
      link_reprogramar: `http://localhost:3000/reservar/turno/${confirmedBooking.token}`,
    });

    // Abrir WhatsApp hacia el número de la secretaría de EAM
    const schoolPhone = "5491136373331";
    const url = messagingService.generateWhatsAppLink(schoolPhone, text);
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#00A3FF] selection:text-white">
      {/* Header Institucional */}
      <header className="bg-[#03387E] text-white border-b border-white/10 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shadow-md">
              <Image src="/logo.png" alt="EAM Logo" width={32} height={32} className="object-contain" priority />
            </div>
            <div>
              <div className="font-heading font-black text-lg text-white leading-none">
                EAM <span className="text-[#00A3FF]">TURNOS</span>
              </div>
              <div className="text-[11px] text-blue-200">Florencio Varela • Autos Doble Comando</div>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:flex items-center gap-1.5 text-blue-200">
              <MapPin className="w-3.5 h-3.5 text-[#00A3FF]" /> Mitre 294, Varela
            </span>
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Stepper Header (4 Pasos) */}
      <div className="bg-white border-b border-slate-200 py-4 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            <div className={`pb-2 border-b-2 transition-all ${step >= 1 ? "border-[#00A3FF] text-[#03387E]" : "border-slate-200 text-slate-400"}`}>
              <span className="block text-[10px] text-slate-400">PASO 1</span>
              <span>1. Servicio</span>
            </div>
            <div className={`pb-2 border-b-2 transition-all ${step >= 2 ? "border-[#00A3FF] text-[#03387E]" : "border-slate-200 text-slate-400"}`}>
              <span className="block text-[10px] text-slate-400">PASO 2</span>
              <span>2. Día y Horario</span>
            </div>
            <div className={`pb-2 border-b-2 transition-all ${step >= 3 ? "border-[#00A3FF] text-[#03387E]" : "border-slate-200 text-slate-400"}`}>
              <span className="block text-[10px] text-slate-400">PASO 3</span>
              <span>3. Tus Datos</span>
            </div>
            <div className={`pb-2 border-b-2 transition-all ${step === 4 ? "border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-400"}`}>
              <span className="block text-[10px] text-slate-400">PASO 4</span>
              <span>4. Confirmación</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor Central del Stepper */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        {/* PASO 1: Selección de Servicio */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="eyebrow">Paso 1 de 4</span>
              <h1 className="font-heading font-black text-3xl text-[#03387E] tracking-tight">
                Elegí tu clase o programa
              </h1>
              <p className="text-sm text-slate-600">
                Seleccioná si querés una clase individual, prueba de manejo o un pack de cursada completa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => {
                const isSelected = selectedService.id === service.id;

                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`eam-card p-6 cursor-pointer border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-[#00A3FF] bg-blue-50/20 shadow-lg shadow-[#00A3FF]/15 ring-2 ring-[#00A3FF]/20"
                        : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#00A3FF] uppercase tracking-wider">
                          {service.is_package ? `Pack ${service.package_class_count} Clases` : "Clase Práctica"}
                        </span>
                        {service.is_package && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Más Elegido
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">
                        {service.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {service.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{service.duration_minutes} minutos</span>
                      </div>
                      <div className="font-heading font-black text-xl text-[#03387E]">
                        {formatCurrency(service.price)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="btn-pill btn-pill-primary px-8 py-3 font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Continuar a Horarios</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Selección de Fecha y Horario */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="eyebrow">Paso 2 de 4</span>
              <h1 className="font-heading font-black text-3xl text-[#03387E] tracking-tight">
                Elegí fecha y horario disponible
              </h1>
              <p className="text-sm text-slate-600">
                Mostramos únicamente horarios con instructor y vehículo doble comando libres.
              </p>
            </div>

            <div className="eam-card p-6 space-y-5">
              {/* Filtros de Fecha e Instructor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fecha de la Clase
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-hidden focus:border-[#00A3FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Instructor Preferido (Opcional)
                  </label>
                  <select
                    value={preferredInstructor}
                    onChange={(e) => setPreferredInstructor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-hidden focus:border-[#00A3FF]"
                  >
                    <option value="all">Cualquier instructor disponible</option>
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grilla de Horarios */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Horarios Disponibles para el {formatDate(selectedDate)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {availableSlots.length} turnos libres
                  </span>
                </div>

                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((slot: any) => (
                      <button
                        key={slot.timeLabel}
                        onClick={() => handleSelectSlot(slot)}
                        className="p-3 rounded-2xl border border-slate-200 hover:border-[#00A3FF] hover:bg-blue-50/50 hover:shadow-md transition-all text-center group cursor-pointer"
                      >
                        <span className="font-heading font-black text-lg text-slate-900 group-hover:text-[#00A3FF] block">
                          {slot.timeLabel} hs
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {slot.instructorName.split(" ")[0]} • {slot.vehicleModel.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <h4 className="font-bold text-sm text-slate-800">
                      No hay horarios libres para la fecha seleccionada
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Probá seleccionando otro día o anotate en nuestra lista de espera para que te avisemos si se libera un turno.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="btn-pill px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Datos del Alumno y Bloqueo Temporal (Hold 10 min) */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="eyebrow">Paso 3 de 4</span>
              <h1 className="font-heading font-black text-3xl text-[#03387E] tracking-tight">
                Completá tus datos de contacto
              </h1>
              <p className="text-sm text-slate-600">
                Retenemos tu horario durante 10 minutos mientras terminás de cargar tu información.
              </p>
            </div>

            {/* Banner de Hold Temporal */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Horario bloqueado: <strong>{formatDate(selectedSlot?.startTime || "")} a las {selectedSlot?.timeLabel} hs</strong>
                </span>
              </div>
              <span className="font-mono font-black text-sm text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-lg">
                {Math.floor(holdTimeLeft / 60)}:{String(holdTimeLeft % 60).padStart(2, "0")} min
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleConfirmBooking} className="eam-card p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Sofía Benítez"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
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
                    placeholder="Ej: 43.123.456"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 11 3637-3331"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                  />
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Te enviaremos la confirmación y el recordatorio a este número.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sofia@gmail.com"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ¿Tenés experiencia previa al volante?
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value as any)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF]"
                  >
                    <option value="cero">Ninguna, empiezo desde cero</option>
                    <option value="principiante">Sé arrancar, pero me cuesta frenar/doblar</option>
                    <option value="intermedio">Manejo pero me da miedo el tránsito</option>
                    <option value="avanzado">Sólo necesito práctica para el examen</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="licenseCheck"
                    checked={hasLicense}
                    onChange={(e) => setHasLicense(e.target.checked)}
                    className="w-4 h-4 rounded-sm text-[#00A3FF]"
                  />
                  <label htmlFor="licenseCheck" className="text-xs font-bold text-slate-700">
                    ¿Tenés licencia de conducir previa?
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Comentarios o dudas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Ej: Tengo temor al embrague, me gustaría salir con calma..."
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#00A3FF] resize-none"
                  />
                </div>

                <div className="sm:col-span-2 flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded-sm text-[#00A3FF] mt-0.5"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600">
                    Acepto la política de cancelación de EAM (avisar con 24 hs de anticipación) y autorizo a recibir el recordatorio de la clase vía WhatsApp conforme a la Ley 25.326.
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-pill px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cambiar Horario
                </button>
                <button
                  type="submit"
                  className="btn-pill btn-pill-primary px-8 py-3 text-sm font-bold shadow-md cursor-pointer"
                >
                  Confirmar Reserva de Turno
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 4: Confirmación Exitosa */}
        {step === 4 && confirmedBooking && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="eyebrow text-emerald-600">¡Reserva Confirmada!</span>
              <h1 className="font-heading font-black text-3xl md:text-4xl text-[#03387E] tracking-tight">
                ¡Tu turno en EAM ya está agendado!
              </h1>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Te esperamos en nuestra sede central de Florencio Varela. Guardá el enlace para autogestionar o reprogramar tu turno.
              </p>
            </div>

            {/* Tarjeta Resumen */}
            <div className="eam-card p-6 max-w-md mx-auto text-left space-y-3 bg-white border-2 border-emerald-300 shadow-xl">
              <div className="flex justify-between pb-3 border-b border-slate-100 text-xs">
                <span className="text-slate-400 uppercase font-bold">Servicio</span>
                <strong className="text-slate-900">{selectedService.name}</strong>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100 text-xs">
                <span className="text-slate-400 uppercase font-bold">Día y Horario</span>
                <strong className="text-[#03387E]">
                  {formatDate(confirmedBooking.startTime)} a las {formatTime(confirmedBooking.startTime)} hs
                </strong>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100 text-xs">
                <span className="text-slate-400 uppercase font-bold">Instructor Asignado</span>
                <strong className="text-slate-900">{confirmedBooking.instructorName}</strong>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100 text-xs">
                <span className="text-slate-400 uppercase font-bold">Auto</span>
                <strong className="text-slate-900">{confirmedBooking.vehicleModel}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 uppercase font-bold">Punto de Encuentro</span>
                <strong className="text-slate-900">Mitre 294, Florencio Varela</strong>
              </div>
            </div>

            {/* Acciones Finales: WhatsApp y Link */}
            <div className="space-y-3 max-w-md mx-auto pt-2">
              <button
                onClick={handleWhatsAppConfirmation}
                className="btn-pill btn-pill-whatsapp w-full py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Confirmar por WhatsApp con la Escuela</span>
              </button>

              <Link
                href={`/reservar/turno/${confirmedBooking.token}`}
                className="block text-xs font-bold text-[#00A3FF] hover:underline"
              >
                Ver enlace de autogestión de mi turno
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
