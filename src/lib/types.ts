export type UserRole = "admin" | "recepcion" | "instructor" | "finanzas";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Instructor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  dni: string;
  license_number: string;
  license_expiry: string;
  hire_date: string;
  hourly_rate: number;
  class_rate: number;
  commission_rate?: number; // Porcentaje de ganancia del docente (0-100), el resto va para los dueños
  color_hex: string;
  allowed_transmissions: ("manual" | "automatico")[];
  status: "activo" | "licencia" | "inactivo";
  classes_given_count?: number;
  pass_rate_percentage?: number;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: "vtv" | "seguro" | "matafuego" | "cedula" | "patente";
  expiration_date: string;
  alert_days_before: number;
  notes?: string;
}

export interface VehicleMaintenance {
  id: string;
  vehicle_id: string;
  type: "preventivo" | "correctivo" | "service_oficial";
  description: string;
  cost: number;
  start_date: string;
  end_date?: string;
  locks_calendar: boolean;
  workshop_name?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  transmission: "manual" | "automatico";
  dual_control: boolean;
  mileage: number;
  status: "operativo" | "en_taller" | "baja";
  color_hex: string;
  photo_url?: string;
  documents?: VehicleDocument[];
  maintenances?: VehicleMaintenance[];
}

export type ClientStatus = "lead" | "activo" | "en_pausa" | "egresado" | "baja";
export type ExperienceLevel = "cero" | "principiante" | "intermedio" | "avanzado";

export interface Client {
  id: string;
  full_name: string;
  dni: string;
  phone: string;
  email?: string;
  birth_date?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  experience_level: ExperienceLevel;
  has_license: boolean;
  status: ClientStatus;
  notes?: string;
  balance_due?: number; // Saldo deudor pendiente
  assigned_package_id?: string;
  assigned_package?: ClientPackageAssignment;
  created_at: string;
}

export type LeadStage = "nuevo" | "contactado" | "clase_prueba" | "inscripto" | "perdido";
export type LeadSource = "web" | "whatsapp" | "presencial" | "recomendacion" | "redes";

export interface Lead {
  id: string;
  client_id?: string;
  full_name: string;
  phone: string;
  email?: string;
  stage: LeadStage;
  source: LeadSource;
  notes?: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_package: boolean;
  package_class_count: number;
  is_active: boolean;
  available_online: boolean;
}

export interface ClientPackageAssignment {
  id: string;
  client_id: string;
  client_name?: string;
  client_dni?: string;
  client_phone?: string;
  service_id?: string;
  service_name: string;
  is_custom: boolean;
  class_count: number;
  classes_taken: number;
  price_agreed: number; // Precio del pack o clase acordado con el alumno
  includes_exam_car_rental: boolean; // Si incluye el alquiler de auto para rendir examen
  exam_car_rental_fee: number; // Valor asignado del alquiler para examen
  total_amount: number; // price_agreed + (includes_exam_car_rental ? exam_car_rental_fee : 0)
  amount_paid: number;
  balance_due: number;
  payment_status: "pendiente" | "parcial" | "abonado";
  notes?: string;
  assigned_at: string;
  status: "activo" | "completado" | "pausado";
}

export interface Enrollment {
  id: string;
  client_id: string;
  service_id: string;
  service_name?: string;
  classes_total: number;
  classes_taken: number;
  classes_remaining: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export type LessonStatus =
  | "pendiente"
  | "confirmada"
  | "en_curso"
  | "realizada"
  | "cancelada"
  | "ausente"
  | "reprogramada";

export interface Lesson {
  id: string;
  client_id: string;
  client_name?: string;
  client_phone?: string;
  client_dni?: string;
  instructor_id: string;
  instructor_name?: string;
  vehicle_id: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  service_id: string;
  service_name?: string;
  enrollment_id?: string;
  start_time: string;
  end_time: string;
  status: LessonStatus;
  cancellation_reason?: string;
  instructor_notes?: string;
  pickup_address: string;
  whatsapp_reminder_sent: boolean;
  whatsapp_reminder_sent_at?: string;
  public_token: string;
  created_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  client_name?: string;
  amount: number;
  payment_method: "efectivo" | "transferencia" | "debito" | "credito" | "mercadopago";
  status: "completado" | "pendiente" | "anulado";
  receipt_number?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id: string;
  category_name?: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  amount: number;
  description: string;
  payment_method: string;
  expense_date: string;
  created_at: string;
}

export interface CashRegisterSession {
  id: string;
  opened_by_name: string;
  opening_time: string;
  closing_time?: string;
  opening_balance: number;
  closing_balance_real?: number;
  closing_balance_system?: number;
  difference?: number;
  status: "abierta" | "cerrada";
}

export interface Exam {
  id: string;
  client_id: string;
  client_name: string;
  instructor_id?: string;
  instructor_name?: string;
  exam_date: string;
  location: string;
  attempt_number: number;
  result: "pendiente" | "aprobado" | "desaprobado";
  show_in_graduates_consent: boolean;
  notes?: string;
}

export interface SkillItem {
  id: string;
  code: string;
  title: string;
  description: string;
  status: "no_iniciado" | "en_practica" | "dominado";
}

export interface MessageTemplate {
  id: string;
  code: string;
  title: string;
  content: string;
  is_active: boolean;
}
