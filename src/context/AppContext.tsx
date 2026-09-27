"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Instructor,
  Vehicle,
  Client,
  Lesson,
  Lead,
  Service,
  Payment,
  Expense,
  CashRegisterSession,
  Exam,
  UserRole,
  LessonStatus,
  MessageTemplate,
  ClientPackageAssignment,
} from "@/lib/types";
import {
  INITIAL_SERVICES,
  INITIAL_INSTRUCTORS,
  INITIAL_VEHICLES,
  INITIAL_CLIENTS,
  INITIAL_LESSONS,
  INITIAL_LEADS,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_CASH_SESSION,
  INITIAL_EXAMS,
  DEFAULT_EXAM_RENTAL_FEE,
  INITIAL_PACKAGE_ASSIGNMENTS,
} from "@/lib/mock-data";
import { DEFAULT_TEMPLATES } from "@/lib/messaging";
import { normalizeArgentinePhone } from "@/lib/phone";

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  services: Service[];
  instructors: Instructor[];
  vehicles: Vehicle[];
  clients: Client[];
  lessons: Lesson[];
  leads: Lead[];
  payments: Payment[];
  expenses: Expense[];
  cashSession: CashRegisterSession;
  exams: Exam[];
  templates: MessageTemplate[];
  packageAssignments: ClientPackageAssignment[];
  examRentalFee: number;
  setExamRentalFee: (fee: number) => void;

  // Acciones de Negocio
  bookLesson: (data: {
    client_name: string;
    client_dni: string;
    client_phone: string;
    client_email?: string;
    service_id: string;
    instructor_id: string;
    vehicle_id: string;
    start_time: string;
    end_time: string;
    pickup_address?: string;
    comments?: string;
  }) => { success: boolean; lesson?: Lesson; error?: string };

  deleteLesson: (lessonId: string) => void;
  updateLessonStatus: (lessonId: string, status: LessonStatus, notes?: string) => void;
  markReminderSent: (lessonId: string) => void;
  toggleVehicleStatus: (vehicleId: string, status: "operativo" | "en_taller" | "baja") => void;
  updateVehicle: (id: string, data: Partial<Vehicle>) => void;
  addVehicle: (vehicle: Omit<Vehicle, "id">) => void;
  deleteVehicle: (id: string) => void;
  updateInstructor: (id: string, data: Partial<Instructor>) => void;
  addInstructor: (instructor: Omit<Instructor, "id">) => void;
  deleteInstructor: (id: string) => void;
  addClient: (client: Omit<Client, "id" | "created_at">) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addLead: (lead: Omit<Lead, "id" | "created_at">) => Lead;
  updateLeadStage: (id: string, stage: Lead["stage"]) => void;
  addPayment: (payment: Omit<Payment, "id" | "created_at">) => void;
  deletePayment: (paymentId: string) => void;
  addExpense: (expense: Omit<Expense, "id" | "created_at">) => void;
  deleteExpense: (expenseId: string) => void;
  updateCashSession: (session: Partial<CashRegisterSession>) => void;
  checkSlotAvailable: (
    instructorId: string,
    vehicleId: string,
    startTime: string,
    endTime: string,
    excludeLessonId?: string
  ) => { available: boolean; conflictReason?: string };

  // Gestión de Packs y Aranceles
  addService: (service: Omit<Service, "id">) => void;
  updateService: (id: string, data: Partial<Service>) => void;
  deleteService: (id: string) => void;
  assignPackageToClient: (data: Omit<ClientPackageAssignment, "id" | "assigned_at">) => ClientPackageAssignment;
  updatePackageAssignment: (id: string, data: Partial<ClientPackageAssignment>) => void;
  removePackageAssignment: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "eam_gestion_data_v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("admin");
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [instructors, setInstructors] = useState<Instructor[]>(INITIAL_INSTRUCTORS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [cashSession, setCashSession] = useState<CashRegisterSession>(INITIAL_CASH_SESSION);
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [packageAssignments, setPackageAssignments] = useState<ClientPackageAssignment[]>(INITIAL_PACKAGE_ASSIGNMENTS);
  const [examRentalFee, setExamRentalFee] = useState<number>(DEFAULT_EXAM_RENTAL_FEE);
  const [templates, setTemplates] = useState<MessageTemplate[]>(
    DEFAULT_TEMPLATES.map((t, idx) => ({ id: `tpl-${idx}`, ...t, is_active: true }))
  );

  // Cargar estado inicial desde localStorage y sincronizar reservas de la web oficial
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lessons) setLessons(parsed.lessons);
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.vehicles) setVehicles(parsed.vehicles);
        if (parsed.instructors) setInstructors(parsed.instructors);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.role) setRole(parsed.role);
      }

      // Sincronizar reservas creadas desde la web oficial eam-escuela-manejo (localStorage)
      const extBookings = localStorage.getItem("eam_bookings");
      if (extBookings) {
        const parsedBookings = JSON.parse(extBookings);
        if (Array.isArray(parsedBookings) && parsedBookings.length > 0) {
          setLessons((prev) => {
            const existingTokens = new Set(prev.map((l: any) => l.token));
            const newLessons = [...prev];
            parsedBookings.forEach((b: any) => {
              if (b.token && !existingTokens.has(b.token)) {
                existingTokens.add(b.token);
                newLessons.unshift({
                  id: b.id || `ext-${b.token}`,
                  client_id: `cl-ext-${b.token}`,
                  instructor_id: "inst-1",
                  vehicle_id: "veh-1",
                  service_id: "srv-1",
                  start_time: `${b.date}T09:15:00-03:00`,
                  end_time: `${b.date}T10:15:00-03:00`,
                  status: "confirmada",
                  pickup_address: "Mitre 294, Florencio Varela",
                  notes: `Reserva Online desde Web Oficial (#${b.token}) - Alumno: ${b.client_name} - Tel: ${b.client_phone}`,
                  created_at: b.created_at || new Date().toISOString(),
                  token: b.token,
                } as any);
              }
            });
            return newLessons;
          });
        }
      }

      // Sincronizar reservas desde la API interna
      fetch("/api/bookings")
        .then((r) => r.json())
        .then((data) => {
          if (data?.bookings && Array.isArray(data.bookings)) {
            setLessons((prev) => {
              const existingTokens = new Set(prev.map((l: any) => l.token));
              const newLessons = [...prev];
              data.bookings.forEach((b: any) => {
                if (b.token && !existingTokens.has(b.token)) {
                  existingTokens.add(b.token);
                  newLessons.unshift({
                    id: b.id || `api-${b.token}`,
                    client_id: `cl-api-${b.token}`,
                    instructor_id: "inst-1",
                    vehicle_id: "veh-1",
                    service_id: "srv-1",
                    start_time: `${b.date}T10:30:00-03:00`,
                    end_time: `${b.date}T11:30:00-03:00`,
                    status: "confirmada",
                    pickup_address: "Mitre 294, Florencio Varela",
                    notes: `Reserva Online vía API (#${b.token}) - Alumno: ${b.client_name} - Tel: ${b.client_phone}`,
                    created_at: b.created_at || new Date().toISOString(),
                    token: b.token,
                  } as any);
                }
              });
              return newLessons;
            });
          }
        })
        .catch(() => {});
    } catch {
      // Ignorar errores de parseo
    }
  }, []);

  // Persistir en localStorage
  const saveState = (
    updatedLessons = lessons,
    updatedClients = clients,
    updatedVehicles = vehicles,
    updatedInstructors = instructors,
    updatedPayments = payments,
    updatedExpenses = expenses
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lessons: updatedLessons,
          clients: updatedClients,
          vehicles: updatedVehicles,
          instructors: updatedInstructors,
          leads,
          payments: updatedPayments,
          expenses: updatedExpenses,
          role,
        })
      );
    } catch {
      // Storage no disponible
    }
  };

  /**
   * Validador estricto anti-solapamiento:
   * Verifica que ni el instructor ni el vehículo tengan clases solapadas
   */
  const checkSlotAvailable = (
    instructorId: string,
    vehicleId: string,
    startTime: string,
    endTime: string,
    excludeLessonId?: string
  ) => {
    const newStart = new Date(startTime).getTime();
    const newEnd = new Date(endTime).getTime();

    // 1. Verificar si el vehículo está en taller
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle || vehicle.status === "en_taller") {
      return {
        available: false,
        conflictReason: `El vehículo ${vehicle?.brand || ""} ${vehicle?.model || ""} está en taller por mantenimiento y no puede utilizarse.`,
      };
    }

    // 2. Verificar solapamiento de turnos activos
    for (const l of lessons) {
      if (excludeLessonId && l.id === excludeLessonId) continue;
      if (l.status === "cancelada" || l.status === "reprogramada") continue;

      const lStart = new Date(l.start_time).getTime();
      const lEnd = new Date(l.end_time).getTime();

      // Existe solapamiento si: Max(StartA, StartB) < Min(EndA, EndB)
      const overlaps = Math.max(newStart, lStart) < Math.min(newEnd, lEnd);

      if (overlaps) {
        if (l.instructor_id === instructorId) {
          return {
            available: false,
            conflictReason: `El instructor ${l.instructor_name} ya tiene asignada una clase activa (${l.service_name}) en ese horario.`,
          };
        }
        if (l.vehicle_id === vehicleId) {
          return {
            available: false,
            conflictReason: `El vehículo ${l.vehicle_model} (${l.vehicle_plate}) ya se encuentra asignado a otra clase en ese horario.`,
          };
        }
      }
    }

    return { available: true };
  };

  const bookLesson = ({
    client_name,
    client_dni,
    client_phone,
    client_email,
    service_id,
    instructor_id,
    vehicle_id,
    start_time,
    end_time,
    pickup_address = "Mitre 294, Florencio Varela",
    comments,
  }: {
    client_name: string;
    client_dni: string;
    client_phone: string;
    client_email?: string;
    service_id: string;
    instructor_id: string;
    vehicle_id: string;
    start_time: string;
    end_time: string;
    pickup_address?: string;
    comments?: string;
  }) => {
    // 1. Validar solapamiento
    const check = checkSlotAvailable(instructor_id, vehicle_id, start_time, end_time);
    if (!check.available) {
      return { success: false, error: check.conflictReason };
    }

    // 2. Buscar o crear cliente
    let client = clients.find((c) => c.dni.replace(/\D/g, "") === client_dni.replace(/\D/g, ""));
    let updatedClients = [...clients];

    const normalizedPhone = normalizeArgentinePhone(client_phone);

    if (!client) {
      client = {
        id: `cli-${Date.now()}`,
        full_name: client_name,
        dni: client_dni,
        phone: normalizedPhone,
        email: client_email,
        experience_level: "cero",
        has_license: false,
        status: "activo",
        notes: comments,
        created_at: new Date().toISOString(),
      };
      updatedClients = [client, ...clients];
      setClients(updatedClients);
    }

    // 3. Crear Lead web
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      client_id: client.id,
      full_name: client_name,
      phone: normalizedPhone,
      email: client_email,
      stage: "nuevo",
      source: "web",
      notes: `Reserva online confirmada: ${comments || "Sin comentarios"}`,
      created_at: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);

    // 4. Crear turno
    const service = services.find((s) => s.id === service_id);
    const instructor = instructors.find((i) => i.id === instructor_id);
    const vehicle = vehicles.find((v) => v.id === vehicle_id);

    const newLesson: Lesson = {
      id: `les-${Date.now()}`,
      client_id: client.id,
      client_name: client.full_name,
      client_phone: client.phone,
      client_dni: client.dni,
      instructor_id,
      instructor_name: instructor?.full_name || "Instructor EAM",
      vehicle_id,
      vehicle_model: `${vehicle?.brand || ""} ${vehicle?.model || ""}`,
      vehicle_plate: vehicle?.plate || "",
      service_id,
      service_name: service?.name || "Clase de Manejo",
      start_time,
      end_time,
      status: "confirmada",
      pickup_address,
      instructor_notes: comments,
      whatsapp_reminder_sent: false,
      public_token: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };

    const updatedLessons = [newLesson, ...lessons];
    setLessons(updatedLessons);
    saveState(updatedLessons, updatedClients);

    return { success: true, lesson: newLesson };
  };

  const deleteLesson = (lessonId: string) => {
    setLessons((prev) => {
      const next = prev.filter((l) => l.id !== lessonId);
      saveState(next);
      return next;
    });
  };

  const updateLessonStatus = (lessonId: string, status: LessonStatus, notes?: string) => {
    setLessons((prev) => {
      const next = prev.map((l) =>
        l.id === lessonId ? { ...l, status, instructor_notes: notes ?? l.instructor_notes } : l
      );
      saveState(next);
      return next;
    });
  };

  const markReminderSent = (lessonId: string) => {
    setLessons((prev) => {
      const next = prev.map((l) =>
        l.id === lessonId
          ? { ...l, whatsapp_reminder_sent: true, whatsapp_reminder_sent_at: new Date().toISOString() }
          : l
      );
      saveState(next);
      return next;
    });
  };

  const toggleVehicleStatus = (vehicleId: string, status: "operativo" | "en_taller" | "baja") => {
    setVehicles((prev) => {
      const next = prev.map((v) => (v.id === vehicleId ? { ...v, status } : v));
      saveState(lessons, clients, next);
      return next;
    });
  };

  const updateVehicle = (id: string, data: Partial<Vehicle>) => {
    setVehicles((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, ...data } : v));
      saveState(lessons, clients, next);
      return next;
    });
  };

  const addVehicle = (vehicleData: Omit<Vehicle, "id">) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `veh-${Date.now()}`,
    };
    setVehicles((prev) => {
      const next = [...prev, newVehicle];
      saveState(lessons, clients, next);
      return next;
    });
  };

  const deleteVehicle = (id: string) => {
    setVehicles((prev) => {
      const next = prev.filter((v) => v.id !== id);
      saveState(lessons, clients, next);
      return next;
    });
  };

  const updateInstructor = (id: string, data: Partial<Instructor>) => {
    setInstructors((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...data } : i));
      saveState(lessons, clients, vehicles, next);
      return next;
    });
  };

  const addInstructor = (instructorData: Omit<Instructor, "id">) => {
    const newInstructor: Instructor = {
      ...instructorData,
      id: `inst-${Date.now()}`,
    };
    setInstructors((prev) => {
      const next = [...prev, newInstructor];
      saveState(lessons, clients, vehicles, next);
      return next;
    });
  };

  const deleteInstructor = (id: string) => {
    setInstructors((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveState(lessons, clients, vehicles, next);
      return next;
    });
  };

  const addClient = (clientData: Omit<Client, "id" | "created_at">) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setClients((prev) => {
      const next = [newClient, ...prev];
      saveState(lessons, next);
      return next;
    });
    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...data } : c));
      saveState(lessons, next);
      return next;
    });
  };

  const deleteClient = (clientId: string) => {
    setClients((prevClients) => {
      const nextClients = prevClients.filter((c) => c.id !== clientId);
      setLessons((prevLessons) => {
        const nextLessons = prevLessons.filter((l) => l.client_id !== clientId);
        saveState(nextLessons, nextClients);
        return nextLessons;
      });
      return nextClients;
    });
  };

  const addLead = (leadData: Omit<Lead, "id" | "created_at">) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  };

  const updateLeadStage = (id: string, stage: Lead["stage"]) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
  };

  const addPayment = (paymentData: Omit<Payment, "id" | "created_at">) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      receipt_number: `REC-2026-00${Math.floor(Math.random() * 900 + 100)}`,
      created_at: new Date().toISOString(),
    };
    setPayments((prev) => {
      const next = [newPayment, ...prev];
      saveState(lessons, clients, vehicles, instructors, next);
      return next;
    });
  };

  const deletePayment = (paymentId: string) => {
    setPayments((prev) => {
      const next = prev.filter((p) => p.id !== paymentId);
      saveState(lessons, clients, vehicles, instructors, next);
      return next;
    });
  };

  const addExpense = (expenseData: Omit<Expense, "id" | "created_at">) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => {
      const next = [newExpense, ...prev];
      saveState(lessons, clients, vehicles, instructors, payments, next);
      return next;
    });
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== expenseId);
      saveState(lessons, clients, vehicles, instructors, payments, next);
      return next;
    });
  };

  const updateCashSession = (sessionData: Partial<CashRegisterSession>) => {
    setCashSession((prev) => ({ ...prev, ...sessionData }));
  };

  // Gestión de Packs y Aranceles
  const addService = (serviceData: Omit<Service, "id">) => {
    const newService: Service = {
      ...serviceData,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [...prev, newService]);
  };

  const updateService = (id: string, data: Partial<Service>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const assignPackageToClient = (data: Omit<ClientPackageAssignment, "id" | "assigned_at">) => {
    const newAssignment: ClientPackageAssignment = {
      ...data,
      id: `pkg-asg-${Date.now()}`,
      assigned_at: new Date().toISOString(),
    };

    setPackageAssignments((prev) => [newAssignment, ...prev]);

    // Actualizar ficha del alumno (saldo pendiente y paquete asignado)
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === data.client_id) {
          return {
            ...c,
            balance_due: (c.balance_due || 0) + newAssignment.balance_due,
            assigned_package_id: newAssignment.id,
            assigned_package: newAssignment,
          };
        }
        return c;
      })
    );

    // Si hubo un pago inicial registrado, crearlo automáticamente en caja/finanzas
    if (data.amount_paid > 0) {
      addPayment({
        client_id: data.client_id,
        client_name: data.client_name,
        amount: data.amount_paid,
        payment_method: "transferencia",
        status: "completado",
      });
    }

    return newAssignment;
  };

  const updatePackageAssignment = (id: string, data: Partial<ClientPackageAssignment>) => {
    setPackageAssignments((prev) =>
      prev.map((asg) => {
        if (asg.id !== id) return asg;
        const updated = { ...asg, ...data };
        if (data.price_agreed !== undefined || data.exam_car_rental_fee !== undefined || data.amount_paid !== undefined || data.includes_exam_car_rental !== undefined) {
          const total = updated.price_agreed + (updated.includes_exam_car_rental ? updated.exam_car_rental_fee : 0);
          updated.total_amount = total;
          updated.balance_due = Math.max(0, total - updated.amount_paid);
          updated.payment_status = updated.balance_due === 0 ? "abonado" : updated.amount_paid > 0 ? "parcial" : "pendiente";
        }
        return updated;
      })
    );
  };

  const removePackageAssignment = (id: string) => {
    setPackageAssignments((prev) => prev.filter((asg) => asg.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        services,
        instructors,
        vehicles,
        clients,
        lessons,
        leads,
        payments,
        expenses,
        cashSession,
        exams,
        templates,
        packageAssignments,
        examRentalFee,
        setExamRentalFee,
        bookLesson,
        deleteLesson,
        updateLessonStatus,
        markReminderSent,
        toggleVehicleStatus,
        updateVehicle,
        addVehicle,
        deleteVehicle,
        updateInstructor,
        addInstructor,
        deleteInstructor,
        addClient,
        updateClient,
        deleteClient,
        addLead,
        updateLeadStage,
        addPayment,
        deletePayment,
        addExpense,
        deleteExpense,
        updateCashSession,
        checkSlotAvailable,
        addService,
        updateService,
        deleteService,
        assignPackageToClient,
        updatePackageAssignment,
        removePackageAssignment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp debe ser utilizado dentro de un AppProvider");
  }
  return context;
}
