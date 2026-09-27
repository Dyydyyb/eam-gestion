"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Car,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  Check,
  LayoutDashboard,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { isValidArgentinePhone } from "@/lib/phone";
import { messagingService, DEFAULT_TEMPLATES } from "@/lib/messaging";
import "./landing.css";

export default function HomePage() {
  const { services, instructors, vehicles, checkSlotAvailable, bookLesson } = useApp();

  // Modo de consulta: "turnero" (Reserva Online en vivo) o "whatsapp" (Asistente guiado)
  const [activeConsultationTab, setActiveConsultationTab] = useState<"turnero" | "whatsapp">("turnero");

  // Estados del Turnero Online integrado
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState(services[0]);
  const [selectedDate, setSelectedDate] = useState("2026-09-19");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [comments, setComments] = useState("");
  const [holdTimer, setHoldTimer] = useState(600);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Estados de la Caja de Cambios Interactiva
  const [currentGear, setCurrentGear] = useState<"1" | "2" | "3" | "4" | "5" | "r">("1");

  // Estados del Asistente WhatsApp de 3 pasos
  const [wizStep, setWizStep] = useState(1);
  const [wizLevel, setWizLevel] = useState("Nunca manejé / soy principiante");
  const [wizInterest, setWizInterest] = useState("Información sobre precios");
  const [wizName, setWizName] = useState("");

  // Mobile navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Timer del Hold en paso 3
  useEffect(() => {
    if (bookingStep === 3 && holdTimer > 0) {
      const timer = setInterval(() => setHoldTimer((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [bookingStep, holdTimer]);

  // Animaciones de scroll y cinturón
  useEffect(() => {
    // Header scroll background
    const handleScroll = () => {
      const header = document.getElementById("siteHeader");
      if (header) {
        if (window.scrollY > 40) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Seatbelt scroll trigger
    const stage = document.getElementById("seatbeltMechanism");
    const statusLabel = document.getElementById("seatbeltStatusLabel");
    if (stage) {
      let triggered = false;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !triggered) {
              triggered = true;
              stage.classList.add("buckled");
              setTimeout(() => {
                if (statusLabel) {
                  statusLabel.textContent = "¡Cinturón de seguridad abrochado y bloqueado! Listo para arrancar";
                }
              }, 600);
              observer.unobserve(stage);
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(stage);
    }

    // Scroll reveal
    const revealElements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
    const revObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealElements.forEach((el) => revObserver.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Datos pedagógicos de la Caja de Cambios
  const gearsData: Record<
    string,
    { badge: string; speed: string; title: string; desc: string; tips: string[]; objective: string; posClass: string }
  > = {
    "1": {
      posClass: "pos-1",
      badge: "1ª Velocidad",
      speed: "0 a 20 km/h • Salida y Tracción Inicial",
      title: "Arranque suave y control del embrague",
      desc: "El primer gran hito de cualquier conductor. En esta fase aprendés a encontrar el 'punto de contacto' del pedal de embrague, coordinar el pie con el acelerador y poner el vehículo en movimiento con total suavidad sin que se te apague.",
      tips: [
        "Punto de fricción: sentir la suave vibración del motor cuando el disco acopla.",
        "Arranque en llano: técnica de talón apoyado en el piso y despegue milimétrico.",
        "Doble comando: el instructor acompaña cada salida para tu total tranquilidad.",
      ],
      objective: "Eliminar la ansiedad del arranque para que salir en un semáforo sea un acto mecánico y natural.",
    },
    "2": {
      posClass: "pos-2",
      badge: "2ª Velocidad",
      speed: "20 a 35 km/h • Maniobras Urbanas y Giros",
      title: "Primeras maniobras a baja velocidad",
      desc: "El cambio de marcha más utilizado en la circulación barrial y céntrica de Florencio Varela. Practicamos la transición fluida de primera a segunda, aproximación a esquinas y maniobras de doblaje seguro.",
      tips: [
        "Transición de marcha sin tirones llevando la palanca hacia abajo y a la izquierda.",
        "Uso del freno motor y anticipación antes de doblar en esquinas angostas.",
        "Posición de manos 'diez y diez' para conservar el control en giros cerrados.",
      ],
      objective: "Ganar soltura al doblar y familiarizarse con el espacio y radio de giro del vehículo.",
    },
    "3": {
      posClass: "pos-3",
      badge: "3ª Velocidad",
      speed: "30 a 50 km/h • Circulación Fluida en Avenidas",
      title: "Circulación en avenidas y calles principales",
      desc: "Para cuando ya dominás los pedales en zonas calmas. Damos el salto a avenidas con tráfico real (San Martín, Senzabello o Monteagudo), incorporando la lectura del tránsito, colectivos y semáforos continuos.",
      tips: [
        "Mantenimiento de carril central y velocidad constante acorde al flujo.",
        "Monitoreo activo de espejos retrovisores cada 5 a 8 segundos.",
        "Distancia preventiva de frenado respecto al vehículo delantero.",
      ],
      objective: "Perder el miedo a convivir con otros conductores y ganar fluidez en el tránsito real.",
    },
    "4": {
      posClass: "pos-4",
      badge: "4ª Velocidad",
      speed: "50 a 70 km/h • Desplazamiento Ágil y Seguro",
      title: "Transición de marchas altas y sobrepasos",
      desc: "Uso eficiente de la caja de cambios en avenidas anchas y accesos. Desarrollamos la técnica de rebaje preventivo (de 4ª a 3ª o 2ª) para detener el auto o superar obstáculos sin forzar los frenos.",
      tips: [
        "Técnica de rebaje de marchas para doblar o disminuir la marcha progresivamente.",
        "Control de puntos ciegos antes de cualquier cambio de carril en avenidas.",
        "Frenado progresivo y suave cuidando la estabilidad y adherencia.",
      ],
      objective: "Aprender a escuchar el régimen del motor para saber con exactitud cuándo subir o bajar marcha.",
    },
    "5": {
      posClass: "pos-5",
      badge: "5ª Velocidad",
      speed: "70 a 100+ km/h • Manejo en Ruta y Autovía",
      title: "Manejo en ruta y trayectos rápidos",
      desc: "Conceptos avanzados de aerodinámica, estabilidad vehicular a velocidad crucero, adelantamientos en tramos permitidos y lectura de cartelería vial vertical y horizontal.",
      tips: [
        "Sujeción firme del volante sin movimientos bruscos a velocidades altas.",
        "Cálculo preciso de distancias y tiempos para maniobras de sobrepaso seguras.",
        "Mantenimiento de la distancia reglamentaria de 2 segundos en ruta.",
      ],
      objective: "Seguridad y aplomo para emprender viajes en autopista con tu familia o amigos.",
    },
    "r": {
      posClass: "pos-r",
      badge: "Marcha Atrás (Reversa)",
      speed: "0 a 5 km/h • Estacionamiento y Maniobras",
      title: "Estacionamiento y maniobras de precisión",
      desc: "La prueba clave del examen municipal de Florencio Varela. Ensayamos con conos reglamentarios las 3 modalidades exigidas: a 90° (batería), a 45° y en paralelo (180°) entre vehículos sin tocar cordón ni vallas.",
      tips: [
        "Embrague en el punto justo de fricción para mover el auto milímetro a milímetro.",
        "Alineación precisa tomando de referencia los parantes y retrovisores.",
        "Técnica infalible de giros de volante para no rozar los conos en el examen.",
      ],
      objective: "Llegar al examen de manejo con la certeza de que el estacionamiento está 100% dominado.",
    },
  };

  // Cálculo de slots libres para el turnero integrado
  const daySlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
  const availableSlots = daySlots
    .map((slot) => {
      const start = `${selectedDate}T${slot}:00-03:00`;
      const [h, m] = slot.split(":").map(Number);
      const endH = String(h + 1).padStart(2, "0");
      const end = `${selectedDate}T${endH}:${String(m).padStart(2, "0")}:00-03:00`;

      for (const inst of instructors.filter((i) => i.status === "activo")) {
        for (const veh of vehicles.filter((v) => v.status === "operativo")) {
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

  const handleConfirmTurno = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !dni || !isValidArgentinePhone(phone)) {
      setErrorMsg("Por favor completá tu nombre, DNI y número de WhatsApp válido (ej: 11 3637-3331).");
      return;
    }

    const res = bookLesson({
      client_name: fullName,
      client_dni: dni,
      client_phone: phone,
      service_id: selectedService.id,
      instructor_id: selectedSlot.instructorId,
      vehicle_id: selectedSlot.vehicleId,
      start_time: selectedSlot.startTime,
      end_time: selectedSlot.endTime,
      comments,
    });

    if (!res.success) {
      setErrorMsg(res.error || "El turno seleccionado acaba de ser ocupado.");
    } else {
      setConfirmedBooking(res.lesson);
      setBookingStep(4);
      confetti({ particleCount: 70, spread: 70 });
    }
  };

  const handleSendWhatsAppTurno = () => {
    if (!confirmedBooking) return;
    const template = DEFAULT_TEMPLATES[1].content;
    const text = messagingService.buildMessage(template, {
      nombre: fullName,
      fecha: formatDate(confirmedBooking.start_time),
      hora: formatTime(confirmedBooking.start_time),
      instructor: confirmedBooking.instructor_name,
      vehiculo: confirmedBooking.vehicle_model,
      link_reprogramar: `http://localhost:3000/reservar/turno/${confirmedBooking.public_token}`,
    });
    window.open(messagingService.generateWhatsAppLink("5491136373331", text), "_blank");
  };

  // WhatsApp Wizard submit
  const getWizardMessage = () => {
    if (wizName.trim()) {
      return `Hola EAM, soy ${wizName.trim()}. Mi nivel actual es: ${wizLevel}. Me interesa: ${wizInterest}. ¿Podrían darme más información sobre los cursos y turnos disponibles?`;
    }
    return `Hola EAM, mi nivel actual es: ${wizLevel}. Me interesa: ${wizInterest}. ¿Podrían darme más información sobre los cursos y turnos disponibles?`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#00A3FF] selection:text-white">
      {/* ==========================================================================
           Top Announcement Bar
           ========================================================================== */}
      <div className="top-announcement-bar">
        <div className="container announcement-inner">
          <span className="announcement-pill">Inscripciones Abiertas</span>
          <span className="announcement-text">
            Clases prácticas individuales en Florencio Varela con autos doble comando
          </span>
          <span className="announcement-time">• Mitre 294 • WhatsApp: 11 3637-3331</span>
        </div>
      </div>

      {/* ==========================================================================
           Site Header (Sticky & Transitions on Scroll)
           ========================================================================== */}
      <header className="site-header" id="siteHeader">
        <div className="main-header-bar">
          <div className="container header-container">
            {/* Brand Logo */}
            <a href="#inicio" className="brand-logo-link" aria-label="EAM Escuela de Manejo - Inicio">
              <img src="/assets/logo.png" alt="Logo oficial EAM Escuela de Manejo" className="brand-logo-img" />
              <div className="brand-text-block">
                <span className="brand-name">EAM</span>
                <span className="brand-slogan">Escuela de Manejo</span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="main-nav" aria-label="Navegación principal">
              <ul className={`nav-menu ${mobileMenuOpen ? "open" : ""}`} id="navMenu">
                <li><a href="#inicio" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Inicio</a></li>
                <li><a href="#sobre-eam" className="nav-link" onClick={() => setMobileMenuOpen(false)}>EAM</a></li>
                <li><a href="#clases" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Clases</a></li>
                <li><a href="#tips" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Tips</a></li>
                <li><a href="#egresados" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Egresados</a></li>
                <li><a href="#ubicacion" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Ubicación</a></li>
                <li><a href="#wizard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Turnos</a></li>
                <li className="md:hidden"><Link href="/admin/dashboard" className="nav-link font-bold text-[#00A3FF]" onClick={() => setMobileMenuOpen(false)}>Acceso CRM</Link></li>
              </ul>
            </nav>

            {/* Header Actions: Botón Turnos + Botón Consultar + Acceso Panel */}
            <div className="header-actions">
              <Link
                href="/admin/dashboard"
                className="btn-header-cta"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.12)", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.25)" }}
                title="Acceso al Panel de Control y CRM"
              >
                <LayoutDashboard className="w-4 h-4 text-[#38BDF8]" />
                <span>Panel CRM</span>
              </Link>

              <Link
                href="/reservar"
                className="btn-header-cta"
                style={{ backgroundColor: "#00A3FF", color: "#FFFFFF", border: "none" }}
              >
                <Calendar className="w-4 h-4" />
                <span>Reservar Turno</span>
              </Link>

              <a href="#wizard" className="btn-header-cta" id="btnHeaderCta">
                <MessageSquare className="w-4 h-4" />
                <span>Consultar</span>
              </a>

              {/* Mobile Toggle Button */}
              <button
                className="mobile-nav-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Abrir menú de navegación"
                aria-expanded={mobileMenuOpen}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================================================
           1. Hero Section (100vh Full Screen)
           ========================================================================== */}
      <section className="hero-section" id="inicio">
        <div className="hero-overlay-shapes"></div>
        <div className="container">
          <div className="hero-content">
            {/* Live status badge */}
            <div className="hero-badge-container reveal">
              <div className="hero-badge">
                <span className="pulse-dot"></span>
                <span>Inscripciones Abiertas • Ciclo 2026</span>
              </div>
            </div>

            {/* Main Title */}
            <h1 className="hero-title reveal delay-1">
              Convertite en un conductor <span className="text-gradient-blue">seguro y confiado</span>
            </h1>

            {/* Subtitle Description */}
            <p className="hero-description reveal delay-2">
              Te acompañamos paso a paso desde tu primera clase hasta el día de tu examen de conducir. Práctica individual, instructores profesionales y autos con doble comando en Florencio Varela.
            </p>

            {/* Location Pill */}
            <div className="hero-location-pill reveal delay-3">
              <MapPin className="w-4 h-4 text-[#00A3FF]" />
              <span>Sede central: <strong>Mitre 294</strong>, Florencio Varela, Buenos Aires</span>
            </div>

            {/* CTA Buttons */}
            <div className="hero-actions reveal delay-4">
              <Link href="/reservar" className="btn-cta-primary" id="heroCtaReservar">
                <Calendar className="w-5 h-5" />
                <span>Reservar Turno Online</span>
              </Link>
              <a href="#wizard" className="btn-cta-secondary" id="heroCtaConsultar">
                <MessageSquare className="w-5 h-5" />
                <span>Iniciar Consulta Guiada</span>
              </a>
            </div>

            {/* Trust Stats Row */}
            <div className="hero-stats-row reveal delay-4">
              <div className="hero-stat-item">
                <div className="hero-stat-icon">
                  <User className="w-5 h-5" />
                </div>
                <div className="hero-stat-text">
                  <strong>100% Personalizado</strong>
                  <span>1 alumno por auto</span>
                </div>
              </div>

              <div className="hero-stat-item">
                <div className="hero-stat-icon">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="hero-stat-text">
                  <strong>Doble Comando</strong>
                  <span>Máxima tranquilidad</span>
                </div>
              </div>

              <div className="hero-stat-item">
                <div className="hero-stat-icon">
                  <Car className="w-5 h-5" />
                </div>
                <div className="hero-stat-text">
                  <strong>Pista de Examen</strong>
                  <span>Circuito oficial Varela</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <a href="#seguridad" className="hero-scroll-indicator" aria-label="Desplazarse hacia abajo">
          <div className="mouse-icon">
            <div className="mouse-wheel"></div>
          </div>
          <span>Deslizá</span>
        </a>
      </section>

      {/* ==========================================================================
           2. Animación Temática: Cinturón de Seguridad al Scroll
           ========================================================================== */}
      <section className="seatbelt-section" id="seguridad">
        <div className="container">
          <div className="seatbelt-container">
            <div className="seatbelt-badge reveal">
              <ShieldCheck className="w-4 h-4" />
              <span>Primer Paso Fundamental</span>
            </div>

            <h2 className="seatbelt-heading reveal delay-1">
              "Antes de arrancar, lo primero es la seguridad"
            </h2>

            <p className="seatbelt-subtext reveal delay-2">
              En EAM formamos conductores responsables desde el primer segundo. La técnica y la confianza comienzan con el hábito correcto.
            </p>

            {/* SVG Mechanism Stage */}
            <div className="seatbelt-mechanism-stage reveal-scale delay-3" id="seatbeltMechanism">
              <svg className="seatbelt-svg" viewBox="0 0 640 140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mecanismo de cinturón de seguridad abrochándose">
                <defs>
                  <linearGradient id="tongueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E2E8F0" />
                    <stop offset="50%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </linearGradient>
                  <linearGradient id="buckleBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <linearGradient id="strapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <radialGradient id="clickGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00A3FF" stopOpacity="0.9" />
                    <stop offset="70%" stopColor="#00A3FF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00A3FF" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <line x1="30" y1="70" x2="610" y2="70" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="6 6" />

                <g className="seatbelt-strap-group" id="seatbeltStrapGroup">
                  <rect x="0" y="44" width="240" height="52" rx="4" fill="url(#strapGrad)" stroke="#475569" strokeWidth="1.5" />
                  <rect x="220" y="40" width="30" height="60" rx="8" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                  <path d="M 245 52 L 316 52 A 10 10 0 0 1 326 62 L 326 78 A 10 10 0 0 1 316 88 L 245 88 Z" fill="url(#tongueGrad)" stroke="#64748B" strokeWidth="2" />
                  <rect x="278" y="60" width="24" height="20" rx="4" fill="#090D16" stroke="#475569" strokeWidth="1.5" />
                </g>

                <g className="seatbelt-buckle-group" id="seatbeltBuckleGroup">
                  <rect x="460" y="46" width="180" height="48" rx="4" fill="url(#strapGrad)" stroke="#475569" strokeWidth="1.5" />
                  <rect x="325" y="30" width="145" height="80" rx="14" fill="url(#buckleBodyGrad)" stroke="#475569" strokeWidth="2.5" />
                  <rect x="335" y="38" width="125" height="64" rx="10" fill="#0B1120" stroke="#334155" strokeWidth="1.5" />
                  <rect x="330" y="46" width="24" height="48" rx="4" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
                  <text x="342" y="73" fill="#FFFFFF" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="9" textAnchor="middle" letterSpacing="1" transform="rotate(-90 342 73)">PRESS</text>
                  <circle cx="430" cy="70" r="11" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                  <circle className="seatbelt-status-light" id="seatbeltLed" cx="430" cy="70" r="6" />
                  <text x="390" y="74" fill="#64748B" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="11" letterSpacing="1">EAM</text>
                </g>

                <g className="seatbelt-click-flash" id="seatbeltClickFlash">
                  <circle cx="328" cy="70" r="36" fill="url(#clickGlow)" />
                </g>
              </svg>
            </div>

            <div className="seatbelt-status-bar">
              <span className="status-dot"></span>
              <span className="status-text" id="seatbeltStatusLabel">
                Acomodá el asiento, colocá el cinturón y arrancá tu formación con nosotros
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
           3. Sobre EAM (Institucional & Propuesta de Valor)
           ========================================================================== */}
      <section className="about-section" id="sobre-eam">
        <div className="container">
          <div className="about-grid">
            <div className="about-visual-col reveal-left">
              <div className="about-badge-tag">
                <span>Trayectoria & Compromiso</span>
              </div>
              <h2 className="about-title">
                La autoescuela elegida en <span className="highlight">Florencio Varela</span>
              </h2>
              <p className="about-lead">
                Ubicados en Mitre 294, brindamos un espacio de aprendizaje donde la paciencia, la pedagogía y la tecnología se unen para que aprendas a manejar sin estrés ni frustraciones.
              </p>

              <div className="about-pill-points">
                <div className="about-pill-point">
                  <span className="point-check">✓</span>
                  <span>Instructores matriculados con vocación pedagógica</span>
                </div>
                <div className="about-pill-point">
                  <span className="point-check">✓</span>
                  <span>Autos modernos habilitados con doble pedalera</span>
                </div>
                <div className="about-pill-point">
                  <span className="point-check">✓</span>
                  <span>Prácticas directas en el circuito del examen municipal</span>
                </div>
              </div>
              <div className="about-experience-stamp">
                Sede Central • Mitre 294, Florencio Varela
              </div>
            </div>

            <div className="about-content reveal-right">
              <h3>Enseñanza cálida, cercana y enfocada en vos</h3>
              <p>
                Sabemos que cada alumno tiene sus propios tiempos. Si nunca tocaste un volante o si tuviste una mala experiencia en el pasado, en EAM vas a encontrar un ambiente seguro, comprensivo y diseñado para darte confianza clase a clase.
              </p>
              <p>
                Nuestro programa cubre desde los comandos esenciales de pedales hasta maniobras de alta precisión como estacionamiento en paralelo, arranque en pendiente y circulación en avenidas transitadas.
              </p>

              <div className="about-features-grid">
                <div className="about-feature-item">
                  <div className="about-feature-icon">
                    <ShieldCheck className="w-5 h-5 text-[#00A3FF]" />
                  </div>
                  <div>
                    <strong>Cero Estrés</strong>
                    <span>Aprender sin gritos ni apuros, a tu propio ritmo.</span>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="about-feature-icon">
                    <Car className="w-5 h-5 text-[#00A3FF]" />
                  </div>
                  <div>
                    <strong>Doble Comando</strong>
                    <span>El instructor cuenta con pedales propios de freno y embrague.</span>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="about-feature-icon">
                    <Calendar className="w-5 h-5 text-[#00A3FF]" />
                  </div>
                  <div>
                    <strong>Pista de Examen</strong>
                    <span>Ensayamos las maniobras exactas que te toman en Varela.</span>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="about-feature-icon">
                    <Clock className="w-5 h-5 text-[#00A3FF]" />
                  </div>
                  <div>
                    <strong>Horarios Flexibles</strong>
                    <span>Coordinamos tus clases según tu trabajo o estudio.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
           4. Clases & Cómo Aprendés con EAM (Caja de Cambios Interactiva)
           ========================================================================== */}
      <section className="classes-section" id="clases">
        <div className="container">
          <div className="section-title-wrap">
            <span className="pill-badge">Metodología de Aprendizaje</span>
            <h2 className="section-title">Cómo aprendés con <span className="highlight">EAM</span></h2>
            <p className="section-subtitle">
              Explorá nuestra guía interactiva de progresión. Tocá en cada marcha para ver qué habilidades desarrollamos en cada etapa de tu aprendizaje.
            </p>
          </div>

          <div className="gearbox-interactive-wrapper reveal">
            {/* Left: Physical Gear Console (H-Pattern) */}
            <div className="gearbox-console-col">
              <div className="gearbox-console-plate">
                <div className="gearbox-chrome-bezel">
                  <svg className="gearbox-svg" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Caja de cambios manual interactiva en H">
                    <line x1="70" y1="60" x2="70" y2="220" className="h-track-base" />
                    <line x1="140" y1="60" x2="140" y2="220" className="h-track-base" />
                    <line x1="210" y1="60" x2="210" y2="220" className="h-track-base" />
                    <line x1="70" y1="140" x2="210" y2="140" className="h-track-base" />

                    <line x1="70" y1="60" x2="70" y2="220" className="h-track-chrome" />
                    <line x1="140" y1="60" x2="140" y2="220" className="h-track-chrome" />
                    <line x1="210" y1="60" x2="210" y2="220" className="h-track-chrome" />
                    <line x1="70" y1="140" x2="210" y2="140" className="h-track-chrome" />

                    <circle cx="140" cy="140" r="10" fill="#334155" />

                    {/* Gear Nodes */}
                    <g className={`gear-node-btn ${currentGear === "1" ? "active" : ""}`} onClick={() => setCurrentGear("1")} role="button" tabIndex={0}>
                      <circle className="gear-node-outer" cx="70" cy="60" r="22" />
                      <text x="70" y="60">1ª</text>
                    </g>
                    <g className={`gear-node-btn ${currentGear === "2" ? "active" : ""}`} onClick={() => setCurrentGear("2")} role="button" tabIndex={0}>
                      <circle className="gear-node-outer" cx="70" cy="220" r="22" />
                      <text x="70" y="220">2ª</text>
                    </g>
                    <g className={`gear-node-btn ${currentGear === "3" ? "active" : ""}`} onClick={() => setCurrentGear("3")} role="button" tabIndex={0}>
                      <circle className="gear-node-outer" cx="140" cy="60" r="22" />
                      <text x="140" y="60">3ª</text>
                    </g>
                    <g className={`gear-node-btn ${currentGear === "4" ? "active" : ""}`} onClick={() => setCurrentGear("4")} role="button" tabIndex={0}>
                      <circle className="gear-node-outer" cx="140" cy="220" r="22" />
                      <text x="140" y="220">4ª</text>
                    </g>
                    <g className={`gear-node-btn ${currentGear === "5" ? "active" : ""}`} onClick={() => setCurrentGear("5")} role="button" tabIndex={0}>
                      <circle className="gear-node-outer" cx="210" cy="60" r="22" />
                      <text x="210" y="60">5ª</text>
                    </g>
                    <g className={`gear-node-btn ${currentGear === "r" ? "active" : ""}`} onClick={() => setCurrentGear("r")} role="button" tabIndex={0}>
                      <circle className="gear-node-outer" cx="210" cy="220" r="22" />
                      <text x="210" y="220">R</text>
                    </g>

                    {/* Lever Knob */}
                    <g className={`gear-lever-knob ${gearsData[currentGear].posClass}`} id="leverKnob">
                      <circle cx="0" cy="0" r="24" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />
                      <circle cx="0" cy="0" r="14" fill="#03387E" stroke="#00A3FF" strokeWidth="1.8" />
                      <circle cx="-5" cy="-6" r="4" fill="#FFFFFF" fillOpacity="0.6" />
                    </g>
                  </svg>
                </div>
              </div>

              <div className="gearbox-instructions-hint">
                <span>Tocá las marchas (1ª a 5ª y R) para mover la palanca</span>
              </div>
            </div>

            {/* Right: Dynamic Pedagogical Card */}
            <div className="gearbox-info-card" id="gearboxInfoCard">
              <div className="gearbox-badge-row">
                <span className="gearbox-current-gear-badge">{gearsData[currentGear].badge}</span>
                <span className="gearbox-speed-range">{gearsData[currentGear].speed}</span>
              </div>

              <h3 className="gearbox-step-title">{gearsData[currentGear].title}</h3>
              <p className="gearbox-step-desc">{gearsData[currentGear].desc}</p>

              <ul className="gearbox-tips-list">
                {gearsData[currentGear].tips.map((tip, idx) => (
                  <li key={idx}>
                    <span className="bullet">▸</span> {tip}
                  </li>
                ))}
              </ul>

              <div className="wizard-preview-card" style={{ marginBottom: 0, padding: "14px 16px" }}>
                <div className="wizard-preview-badge">Objetivo Pedagógico EAM</div>
                <div className="wizard-preview-message" style={{ fontSize: "0.88rem" }}>
                  {gearsData[currentGear].objective}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
           5. Tips de Manejo
           ========================================================================== */}
      <section className="tips-section" id="tips">
        <div className="container">
          <div className="section-title-wrap">
            <span className="pill-badge">Educación Vial</span>
            <h2 className="section-title">Tips de manejo <span className="highlight">EAM</span></h2>
            <p className="section-subtitle">
              Secretos prácticos que compartimos en nuestro Instagram para que manejes con soltura y apruebes a la primera.
            </p>
          </div>

          <div className="tips-grid">
            <div className="tip-card reveal delay-1">
              <span className="tip-number-badge">Tip 01 • Embrague</span>
              <h3 className="tip-card-title">El punto de fricción sin que se te apague el auto</h3>
              <p className="tip-card-desc">
                Nunca levantes el pie del embrague de golpe. Mantené el talón apoyado en el piso, levantá la punta suavemente hasta que el motor baje levemente sus revoluciones y sostené ahí 2 segundos mientras acelerás apenas.
              </p>
              <div className="tip-key-takeaway">
                <strong>Clave:</strong> El talón fijo es tu ancla de control.
              </div>
            </div>

            <div className="tip-card reveal delay-2">
              <span className="tip-number-badge">Tip 02 • Estacionamiento</span>
              <h3 className="tip-card-title">Estacionamiento paralelo 180° en 3 pasos</h3>
              <p className="tip-card-desc">
                Colocá tu auto espejo con espejo respecto al contiguo. Poné marcha atrás, girá el volante todo hacia el cordón hasta ver la óptica trasera del auto de atrás en tu espejo izquierdo, y recién ahí enderezá.
              </p>
              <div className="tip-key-takeaway">
                <strong>Clave:</strong> Las referencias visuales no fallan.
              </div>
            </div>

            <div className="tip-card reveal delay-3">
              <span className="tip-number-badge">Tip 03 • Espejos</span>
              <h3 className="tip-card-title">Regulá los espejos para no tener puntos ciegos</h3>
              <p className="tip-card-desc">
                En los espejos laterales solo debés ver una mínima porción de la manija trasera de tu propio auto. El resto del espejo tiene que enfocar la calle para detectar motos y autos que se adelanten.
              </p>
              <div className="tip-key-takeaway">
                <strong>Clave:</strong> Tu auto no se mueve de carril sin mirar espejos.
              </div>
            </div>

            <div className="tip-card reveal delay-4">
              <span className="tip-number-badge">Tip 04 • Pendientes</span>
              <h3 className="tip-card-title">Arranque en subida sin usar freno de mano</h3>
              <p className="tip-card-desc">
                Con el freno de pie apretado, soltá el embrague hasta que sientas el "temblor" de tracción. En ese instante exacto, podés pasar el pie derecho del freno al acelerador: el auto no se va a ir para atrás.
              </p>
              <div className="tip-key-takeaway">
                <strong>Clave:</strong> Confianza total en la tracción del motor.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
           6. Egresados Aprobados
           ========================================================================== */}
      <section className="graduates-section" id="egresados">
        <div className="container">
          <div className="section-title-wrap">
            <span className="pill-badge">Casos de Éxito</span>
            <h2 className="section-title">Nuestros <span className="highlight">Egresados</span></h2>
            <p className="section-subtitle">
              Alumnos de Florencio Varela que llegaron con dudas y hoy circulan con total seguridad con su registro en mano.
            </p>
          </div>

          <div className="graduates-grid">
            <div className="graduate-card reveal-left">
              <div className="graduate-photo-wrap">
                <img src="/assets/egresado-1.jpg" alt="Egresados de EAM" className="graduate-photo" loading="lazy" />
                <span className="graduate-badge-license">¡Examen Aprobado!</span>
              </div>
              <div className="graduate-body">
                <p className="graduate-quote">
                  "Completó sus clases prácticas con éxito y superó el examen de conducir en Florencio Varela al primer intento. ¡Un nuevo conductor seguro y con su licencia en mano!"
                </p>
                <div className="graduate-author">
                  <div>
                    <span className="graduate-name">Egresado EAM</span>
                    <span className="graduate-detail">Alumno de Florencio Varela</span>
                  </div>
                  <span className="graduate-verified">Licencia B1</span>
                </div>
              </div>
            </div>

            <div className="graduate-card reveal delay-1">
              <div className="graduate-photo-wrap">
                <img src="/assets/egresado-2.png" alt="Egresada de EAM" className="graduate-photo" loading="lazy" />
                <span className="graduate-badge-license">¡Licencia Obtenida!</span>
              </div>
              <div className="graduate-body">
                <p className="graduate-quote">
                  "Superó los temores iniciales al tránsito y fue ganando total soltura y tranquilidad clase a clase con nuestros instructores. ¡Felicitaciones por este gran logro!"
                </p>
                <div className="graduate-author">
                  <div>
                    <span className="graduate-name">Egresada EAM</span>
                    <span className="graduate-detail">Alumna de Florencio Varela</span>
                  </div>
                  <span className="graduate-verified">Licencia B1</span>
                </div>
              </div>
            </div>

            <div className="graduate-card reveal-right delay-2">
              <div className="graduate-photo-wrap">
                <img src="/assets/egresado-3.png" alt="Egresado de EAM" className="graduate-photo" loading="lazy" />
                <span className="graduate-badge-license">¡Conductor Seguro!</span>
              </div>
              <div className="graduate-body">
                <p className="graduate-quote">
                  "Entrenamiento intensivo en maniobras de precisión, estacionamiento reglamentario y arranque en subida. ¡Aprobado y listo para circular con plena confianza!"
                </p>
                <div className="graduate-author">
                  <div>
                    <span className="graduate-name">Egresado EAM</span>
                    <span className="graduate-detail">Alumno de Florencio Varela</span>
                  </div>
                  <span className="graduate-verified">Licencia B1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
           7. Ubicación y Horarios
           ========================================================================== */}
      <section className="location-section" id="ubicacion">
        <div className="container">
          <div className="location-wrapper">
            <div className="location-map-card reveal-left">
              <iframe
                title="Mapa de ubicación EAM Escuela de Manejo en Mitre 294 Florencio Varela"
                src="https://maps.google.com/maps?q=Mitre+294,+Florencio+Varela,+Provincia+de+Buenos+Aires&t=&z=16&ie=UTF8&iwloc=&output=embed"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>

            <div className="location-info-col reveal-right">
              <span className="pill-badge light">Atención Presencial & WhatsApp</span>
              <h3>Vení a visitarnos en pleno centro de Varela</h3>
              <p>
                Nuestra oficina se encuentra en una ubicación estratégica y de fácil acceso para iniciar tus clases prácticas en los circuitos reales de la zona sur.
              </p>

              <div className="location-details-list">
                <div className="location-detail-item">
                  <div className="location-detail-text">
                    <strong>Dirección</strong>
                    <span>Mitre 294, Florencio Varela, Buenos Aires, Argentina</span>
                  </div>
                </div>

                <div className="location-detail-item">
                  <div className="location-detail-text">
                    <strong>Horario de Atención</strong>
                    <span>Lunes a Viernes de 9:00 a 18:30 hs. | Sábados de 9:00 a 13:00 hs.</span>
                  </div>
                </div>

                <div className="location-detail-item">
                  <div className="location-detail-text">
                    <strong>Teléfono / WhatsApp</strong>
                    <a href="https://wa.me/5491136373331" target="_blank" rel="noopener noreferrer">11 3637-3331</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
           8. SECCIÓN DE RESERVA DE TURNOS ONLINE INTEGRADA + ASISTENTE WHATSAPP
           ========================================================================== */}
      <section className="wizard-section" id="wizard">
        <div className="container">
          <div className="section-title-wrap">
            <span className="pill-badge">Turnos & Consultas Online</span>
            <h2 className="section-title">
              Reservá tu turno o <span className="highlight">consultá por WhatsApp</span>
            </h2>
            <p className="section-subtitle">
              Elegí si preferís reservar directamente tu horario en tiempo real o armar tu consulta personalizada.
            </p>
          </div>

          {/* Selector de Modo: Turnero Online vs WhatsApp Wizard */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-full bg-slate-200 shadow-inner">
              <button
                onClick={() => setActiveConsultationTab("turnero")}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeConsultationTab === "turnero"
                    ? "bg-[#03387E] text-white shadow-md"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-4 h-4 text-[#00A3FF]" />
                <span>Reservar Turno Online (Disponibilidad en Vivo)</span>
              </button>
              <button
                onClick={() => setActiveConsultationTab("whatsapp")}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeConsultationTab === "whatsapp"
                    ? "bg-[#25D366] text-white shadow-md"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Consulta Guiada por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* TAB 1: SISTEMA DE TURNOS ONLINE INTEGRADO */}
          {activeConsultationTab === "turnero" && (
            <div className="wizard-card reveal p-6 md:p-8">
              {/* Stepper Header */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold pb-6 mb-6 border-b border-slate-100">
                <div className={`pb-2 border-b-2 ${bookingStep >= 1 ? "border-[#00A3FF] text-[#03387E]" : "border-slate-200 text-slate-400"}`}>
                  1. Servicio
                </div>
                <div className={`pb-2 border-b-2 ${bookingStep >= 2 ? "border-[#00A3FF] text-[#03387E]" : "border-slate-200 text-slate-400"}`}>
                  2. Horario Libre
                </div>
                <div className={`pb-2 border-b-2 ${bookingStep >= 3 ? "border-[#00A3FF] text-[#03387E]" : "border-slate-200 text-slate-400"}`}>
                  3. Tus Datos
                </div>
                <div className={`pb-2 border-b-2 ${bookingStep === 4 ? "border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-400"}`}>
                  4. ¡Confirmado!
                </div>
              </div>

              {/* Paso 1: Servicio */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-heading font-bold text-xl text-slate-900">Elegí tu clase o programa</h3>
                    <p className="text-xs text-slate-500">Tarifas oficiales y duraciones en Florencio Varela</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedService(s)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          selectedService.id === s.id
                            ? "border-[#00A3FF] bg-blue-50/30 shadow-md ring-2 ring-[#00A3FF]/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <span className="text-[11px] font-bold text-[#00A3FF] uppercase tracking-wider block mb-1">
                            {s.is_package ? `Pack ${s.package_class_count} Clases` : "Clase Práctica"}
                          </span>
                          <h4 className="font-heading font-bold text-base text-slate-900">{s.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500">{s.duration_minutes} min</span>
                          <span className="font-heading font-black text-lg text-[#03387E]">
                            {formatCurrency(s.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setBookingStep(2)}
                      className="btn-pill btn-pill-primary px-8 py-3 text-sm font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continuar a Días y Horarios</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Horarios */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">Fecha Seleccionada</span>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="font-bold text-sm bg-transparent border-none outline-hidden cursor-pointer"
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                      {availableSlots.length} horarios libres reales
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableSlots.map((slot: any) => (
                      <button
                        key={slot.timeLabel}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setHoldTimer(600);
                          setBookingStep(3);
                        }}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#00A3FF] hover:bg-blue-50 text-center transition-all cursor-pointer group"
                      >
                        <span className="font-heading font-black text-lg text-slate-900 group-hover:text-[#00A3FF] block">
                          {slot.timeLabel} hs
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {slot.instructorName.split(" ")[0]} • Auto Doble Comando
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setBookingStep(1)}
                      className="btn-pill px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                    >
                      ← Cambiar Servicio
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3: Datos */}
              {bookingStep === 3 && (
                <form onSubmit={handleConfirmTurno} className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>
                        Turno bloqueado: <strong>{formatDate(selectedSlot?.startTime)} a las {selectedSlot?.timeLabel} hs</strong>
                      </span>
                    </div>
                    <span className="font-mono font-black text-xs bg-amber-200 px-2 py-0.5 rounded-md">
                      {Math.floor(holdTimer / 60)}:{String(holdTimer % 60).padStart(2, "0")} min
                    </span>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Nombre y Apellido *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej: Laura Rossi"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">DNI *</label>
                      <input
                        type="text"
                        required
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        placeholder="Ej: 42.981.321"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 uppercase mb-1">Teléfono / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="11 3637-3331"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="btn-pill px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                    >
                      ← Elegir otro Horario
                    </button>
                    <button
                      type="submit"
                      className="btn-pill btn-pill-primary px-8 py-3 text-sm font-bold cursor-pointer"
                    >
                      Confirmar Reserva de Turno
                    </button>
                  </div>
                </form>
              )}

              {/* Paso 4: Confirmación */}
              {bookingStep === 4 && (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                  <h3 className="font-heading font-black text-2xl text-[#03387E]">
                    ¡Tu turno en EAM ya está agendado!
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Te esperamos el {formatDate(confirmedBooking?.start_time)} a las{" "}
                    {formatTime(confirmedBooking?.start_time)} hs en Mitre 294, Florencio Varela.
                  </p>

                  <div className="p-4 bg-slate-50 rounded-2xl max-w-sm mx-auto text-xs text-left space-y-1.5 border border-slate-200">
                    <div>Servicio: <strong>{selectedService.name}</strong></div>
                    <div>Instructor: <strong>{confirmedBooking?.instructor_name}</strong></div>
                    <div>Auto: <strong>{confirmedBooking?.vehicle_model}</strong></div>
                  </div>

                  <button
                    onClick={handleSendWhatsAppTurno}
                    className="btn-pill btn-pill-whatsapp px-8 py-3 text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Confirmar por WhatsApp con la Escuela</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONSULTA GUIADA WHATSAPP (ORIGINAL DE EAM) */}
          {activeConsultationTab === "whatsapp" && (
            <div className="wizard-card reveal">
              <div className="wizard-header">
                <h3>Asistente de Inscripción EAM</h3>
                <p>Completá los datos y te enviamos la información exacta directo a tu WhatsApp.</p>
                <div className="wizard-progress-bar-container">
                  <div
                    className="wizard-progress-bar-fill"
                    style={{ width: wizStep === 1 ? "33%" : wizStep === 2 ? "66%" : "100%" }}
                  ></div>
                </div>
              </div>

              <div className="wizard-steps-nav">
                <div className={`wizard-step-tab ${wizStep === 1 ? "active" : ""}`} onClick={() => setWizStep(1)}>
                  <span className="wizard-step-number">1</span>
                  <span className="step-text">Nivel Actual</span>
                </div>
                <div className={`wizard-step-tab ${wizStep === 2 ? "active" : ""}`} onClick={() => setWizStep(2)}>
                  <span className="wizard-step-number">2</span>
                  <span className="step-text">Qué Buscás</span>
                </div>
                <div className={`wizard-step-tab ${wizStep === 3 ? "active" : ""}`} onClick={() => setWizStep(3)}>
                  <span className="wizard-step-number">3</span>
                  <span className="step-text">Mensaje Final</span>
                </div>
              </div>

              <div className="wizard-body">
                {wizStep === 1 && (
                  <div className="wizard-step-pane active">
                    <h4 className="wizard-pane-title">Paso 1 — Contanos tu experiencia previa:</h4>
                    <div className="wizard-options-grid">
                      <div
                        className={`wizard-option-card ${wizLevel === "Nunca manejé / soy principiante" ? "selected" : ""}`}
                        onClick={() => setWizLevel("Nunca manejé / soy principiante")}
                      >
                        <strong className="wizard-option-title">Nunca manejé / soy principiante</strong>
                        <span className="wizard-option-desc">Quiero aprender desde cero, con paciencia y en un ambiente seguro.</span>
                      </div>
                      <div
                        className={`wizard-option-card ${wizLevel === "Ya manejé algo, pero necesito practicar" ? "selected" : ""}`}
                        onClick={() => setWizLevel("Ya manejé algo, pero necesito practicar")}
                      >
                        <strong className="wizard-option-title">Ya manejé algo, pero necesito practicar</strong>
                        <span className="wizard-option-desc">Tengo nociones básicas de pedales pero me falta soltura en la calle.</span>
                      </div>
                      <div
                        className={`wizard-option-card ${wizLevel === "Sé manejar, quiero perfeccionar antes del examen" ? "selected" : ""}`}
                        onClick={() => setWizLevel("Sé manejar, quiero perfeccionar antes del examen")}
                      >
                        <strong className="wizard-option-title">Sé manejar, quiero perfeccionar antes del examen</strong>
                        <span className="wizard-option-desc">Tengo fecha confirmada en Florencio Varela y quiero ensayar el circuito.</span>
                      </div>
                    </div>
                  </div>
                )}

                {wizStep === 2 && (
                  <div className="wizard-step-pane active">
                    <h4 className="wizard-pane-title">Paso 2 — ¿Qué modalidad te interesa?</h4>
                    <div className="wizard-options-grid">
                      <div
                        className={`wizard-option-card ${wizInterest === "Información sobre precios" ? "selected" : ""}`}
                        onClick={() => setWizInterest("Información sobre precios")}
                      >
                        <strong className="wizard-option-title">Información sobre precios</strong>
                        <span className="wizard-option-desc">Quiero conocer tarifas actuales, medios de pago y promociones.</span>
                      </div>
                      <div
                        className={`wizard-option-card ${wizInterest === "Paquete de clases" ? "selected" : ""}`}
                        onClick={() => setWizInterest("Paquete de clases")}
                      >
                        <strong className="wizard-option-title">Paquete de clases</strong>
                        <span className="wizard-option-desc">Programa integral desde lo básico hasta la pista con descuento.</span>
                      </div>
                      <div
                        className={`wizard-option-card ${wizInterest === "Clases sueltas" ? "selected" : ""}`}
                        onClick={() => setWizInterest("Clases sueltas")}
                      >
                        <strong className="wizard-option-title">Clases sueltas</strong>
                        <span className="wizard-option-desc">Para practicar temas específicos a tu propio ritmo.</span>
                      </div>
                    </div>
                  </div>
                )}

                {wizStep === 3 && (
                  <div className="wizard-step-pane active">
                    <h4 className="wizard-pane-title">Paso 3 — Tu mensaje personalizado:</h4>
                    <div className="wizard-input-group">
                      <label htmlFor="wizardInputName" className="wizard-input-label">Tu Nombre (opcional):</label>
                      <input
                        type="text"
                        id="wizardInputName"
                        value={wizName}
                        onChange={(e) => setWizName(e.target.value)}
                        className="wizard-input-text"
                        placeholder="Ej: Lucas Martínez"
                      />
                    </div>
                    <div className="wizard-preview-card">
                      <div className="wizard-preview-badge">Mensaje generado automáticamente:</div>
                      <p className="wizard-preview-message">"{getWizardMessage()}"</p>
                    </div>
                  </div>
                )}

                <div className="wizard-footer-actions">
                  {wizStep > 1 && (
                    <button type="button" className="btn-wizard-back" onClick={() => setWizStep(wizStep - 1)}>
                      <span>Volver</span>
                    </button>
                  )}

                  {wizStep < 3 ? (
                    <button type="button" className="btn-wizard-next" onClick={() => setWizStep(wizStep + 1)}>
                      <span>Siguiente</span>
                    </button>
                  ) : (
                    <a
                      href={`https://wa.me/5491136373331?text=${encodeURIComponent(getWizardMessage())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-wizard-submit"
                    >
                      <span>Enviar por WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==========================================================================
           9. Footer
           ========================================================================== */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-top-grid">
            <div className="footer-brand-info">
              <a href="#inicio" className="brand-logo-link">
                <img src="/assets/logo.png" alt="Logo oficial EAM Escuela de Manejo" className="brand-logo-img" />
                <div className="brand-text-block">
                  <span className="brand-name">EAM</span>
                  <span className="brand-slogan">Escuela de Manejo</span>
                </div>
              </a>
              <p>
                "Tu destino para convertirte en un conductor seguro y confiado." Enseñanza práctica personalizada para la obtención y perfeccionamiento de tu licencia en Florencio Varela.
              </p>
            </div>

            <div className="footer-col">
              <h4 className="footer-col-title">Secciones</h4>
              <ul className="footer-links-list">
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#sobre-eam">Sobre EAM</a></li>
                <li><a href="#clases">Clases & Caja de Cambios</a></li>
                <li><a href="#tips">Tips de Manejo</a></li>
                <li><a href="#egresados">Egresados Aprobados</a></li>
                <li><a href="#ubicacion">Ubicación y Horarios</a></li>
                <li><Link href="/reservar">Reserva de Turnos Online</Link></li>
                <li><Link href="/admin/dashboard">Panel de Gestión Interno</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-col-title">Contacto Directo</h4>
              <ul className="footer-contact-list">
                <li><span>Mitre 294, Florencio Varela</span></li>
                <li><a href="https://wa.me/5491136373331" target="_blank" rel="noopener noreferrer">11 3637-3331</a></li>
                <li><a href="https://instagram.com/escuelademanejo.eam" target="_blank" rel="noopener noreferrer">@escuelademanejo.eam</a></li>
                <li><span>Lun a Vie 9:00 a 18:30 hs. | Sáb 9:00 a 13:00 hs.</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>© 2026 EAM — Escuela de Manejo. Todos los derechos reservados.</span>
            <span>Florencio Varela, Buenos Aires, Argentina.</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5491136373331?text=Hola%20EAM%2C%20quisiera%20consultar%20por%20las%20clases%20de%20manejo"
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp-btn"
        id="floatingWhatsapp"
        aria-label="Contactar a EAM por WhatsApp"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
        </svg>
      </a>
    </div>
  );
}
