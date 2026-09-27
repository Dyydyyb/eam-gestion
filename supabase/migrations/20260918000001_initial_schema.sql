-- ==========================================================================
-- EAM Gestión — Esquema Relacional Completo en PostgreSQL (Supabase)
-- Migración Inicial con Anti-Solapamiento (btree_gist) y RLS Estricto
-- ==========================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Tipos enumerados (Enums)
CREATE TYPE user_role AS ENUM ('admin', 'recepcion', 'instructor', 'finanzas');
CREATE TYPE instructor_status AS ENUM ('activo', 'licencia', 'inactivo');
CREATE TYPE client_status AS ENUM ('lead', 'activo', 'en_pausa', 'egresado', 'baja');
CREATE TYPE experience_level AS ENUM ('cero', 'principiante', 'intermedio', 'avanzado');
CREATE TYPE lead_stage AS ENUM ('nuevo', 'contactado', 'clase_prueba', 'inscripto', 'perdido');
CREATE TYPE lead_source AS ENUM ('web', 'whatsapp', 'presencial', 'recomendacion', 'redes');
CREATE TYPE vehicle_transmission AS ENUM ('manual', 'automatico');
CREATE TYPE vehicle_status AS ENUM ('operativo', 'en_taller', 'baja');
CREATE TYPE document_type AS ENUM ('vtv', 'seguro', 'matafuego', 'cedula', 'patente');
CREATE TYPE maintenance_type AS ENUM ('preventivo', 'correctivo', 'service_oficial');
CREATE TYPE lesson_status AS ENUM ('pendiente', 'confirmada', 'en_curso', 'realizada', 'cancelada', 'ausente', 'reprogramada');
CREATE TYPE hold_status AS ENUM ('active', 'converted', 'expired');
CREATE TYPE waitlist_status AS ENUM ('esperando', 'contactado', 'resuelto', 'descartado');
CREATE TYPE payment_method AS ENUM ('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago');
CREATE TYPE payment_status AS ENUM ('completado', 'pendiente', 'anulado');
CREATE TYPE cash_session_status AS ENUM ('abierta', 'cerrada');
CREATE TYPE exam_result AS ENUM ('pendiente', 'aprobado', 'desaprobado');
CREATE TYPE skill_level AS ENUM ('no_iniciado', 'en_practica', 'dominado');

-- ==========================================================================
-- 3. Tablas Principales
-- ==========================================================================

-- 3.1 Perfiles de usuario (Vinculados a Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'recepcion',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Instructores / Personal docente
CREATE TABLE instructors (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dni TEXT UNIQUE NOT NULL,
  license_number TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  class_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  color_hex TEXT NOT NULL DEFAULT '#03387E',
  allowed_transmissions vehicle_transmission[] NOT NULL DEFAULT '{"manual", "automatico"}',
  status instructor_status NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Disponibilidad semanal recurrente del instructor
CREATE TABLE instructor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 60,
  CONSTRAINT check_time_order CHECK (start_time < end_time)
);

-- 3.4 Excepciones y bloqueos de agenda (vacaciones, licencias)
CREATE TABLE availability_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_exception_time CHECK (start_time < end_time)
);

-- 3.5 Feriados y días no laborables
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holiday_date DATE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3.6 Clientes / Alumnos
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  dni TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  experience_level experience_level NOT NULL DEFAULT 'cero',
  has_license BOOLEAN NOT NULL DEFAULT FALSE,
  status client_status NOT NULL DEFAULT 'activo',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 Leads (Prospectos comerciales)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  stage lead_stage NOT NULL DEFAULT 'nuevo',
  source lead_source NOT NULL DEFAULT 'web',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 Flota de Vehículos
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  transmission vehicle_transmission NOT NULL DEFAULT 'manual',
  dual_control BOOLEAN NOT NULL DEFAULT TRUE,
  mileage INT NOT NULL DEFAULT 0,
  status vehicle_status NOT NULL DEFAULT 'operativo',
  color_hex TEXT NOT NULL DEFAULT '#00A3FF',
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.9 Documentación y vencimientos del vehículo (VTV, Seguro, etc.)
CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  issue_date DATE,
  expiration_date DATE NOT NULL,
  alert_days_before INT NOT NULL DEFAULT 30,
  attachment_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 Mantenimiento y Services de Vehículos
CREATE TABLE vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type maintenance_type NOT NULL DEFAULT 'preventivo',
  description TEXT NOT NULL,
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  mileage_at_service INT,
  start_date DATE NOT NULL,
  end_date DATE,
  workshop_name TEXT,
  invoice_url TEXT,
  locks_calendar BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.11 Servicios y Clases ofrecidas
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  price NUMERIC(12, 2) NOT NULL,
  is_package BOOLEAN NOT NULL DEFAULT FALSE,
  package_class_count INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  available_online BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.12 Packs de Clases y suscripciones de Alumnos
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  classes_total INT NOT NULL DEFAULT 1,
  classes_taken INT NOT NULL DEFAULT 0,
  classes_remaining INT GENERATED ALWAYS AS (classes_total - classes_taken) STORED,
  expires_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.13 Clases de Manejo / Turnos (Con Rango Temporal para Anti-Solapamiento)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  time_range TSTZRANGE GENERATED ALWAYS AS (TSTZRANGE(start_time, end_time)) STORED,
  status lesson_status NOT NULL DEFAULT 'confirmada',
  cancellation_reason TEXT,
  instructor_notes TEXT,
  pickup_address TEXT NOT NULL DEFAULT 'Mitre 294, Florencio Varela',
  whatsapp_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_reminder_sent_at TIMESTAMPTZ,
  public_token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_lesson_duration CHECK (start_time < end_time)
);

-- EXCLUSION CONSTRAINTS (Anti-solapamiento estricto a nivel de base de datos)
ALTER TABLE lessons ADD CONSTRAINT no_overlapping_instructor_lessons
EXCLUDE USING gist (
  instructor_id WITH =,
  time_range WITH &&
) WHERE (status NOT IN ('cancelada', 'reprogramada'));

ALTER TABLE lessons ADD CONSTRAINT no_overlapping_vehicle_lessons
EXCLUDE USING gist (
  vehicle_id WITH =,
  time_range WITH &&
) WHERE (status NOT IN ('cancelada', 'reprogramada'));

ALTER TABLE lessons ADD CONSTRAINT no_overlapping_client_lessons
EXCLUDE USING gist (
  client_id WITH =,
  time_range WITH &&
) WHERE (status NOT IN ('cancelada', 'reprogramada'));

-- 3.14 Holds temporales de Reserva Online (10 minutos de bloqueo preventivo)
CREATE TABLE booking_holds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES instructors(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  status hold_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.15 Lista de Espera (Cuando no hay horarios disponibles)
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  preferred_days TEXT[],
  preferred_time_range TEXT,
  status waitlist_status NOT NULL DEFAULT 'esperando',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.16 Caja Diaria (Sesiones de Apertura y Cierre)
CREATE TABLE cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opened_by UUID NOT NULL REFERENCES profiles(id),
  closed_by UUID REFERENCES profiles(id),
  opening_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closing_time TIMESTAMPTZ,
  opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  closing_balance_real NUMERIC(12, 2),
  closing_balance_system NUMERIC(12, 2),
  difference NUMERIC(12, 2),
  status cash_session_status NOT NULL DEFAULT 'abierta',
  notes TEXT
);

-- 3.17 Pagos y Cobros
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  session_id UUID REFERENCES cash_register_sessions(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'efectivo',
  status payment_status NOT NULL DEFAULT 'completado',
  receipt_number TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.18 Categorías de Gastos
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 3.19 Gastos y Egresos
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  session_id UUID REFERENCES cash_register_sessions(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'efectivo',
  invoice_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.20 Liquidaciones de Personal / Instructores
CREATE TABLE payroll_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES instructors(id),
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INT NOT NULL,
  classes_count INT NOT NULL DEFAULT 0,
  gross_amount NUMERIC(12, 2) NOT NULL,
  advances_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  net_amount NUMERIC(12, 2) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.21 Exámenes de Conducir y Egresados
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES instructors(id),
  exam_date DATE NOT NULL,
  location TEXT NOT NULL DEFAULT 'Pista Florencio Varela',
  attempt_number INT NOT NULL DEFAULT 1,
  result exam_result NOT NULL DEFAULT 'pendiente',
  show_in_graduates_consent BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.22 Checklist de Habilidades de Manejo
CREATE TABLE skill_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

-- 3.23 Progreso del Alumno en cada Habilidad
CREATE TABLE skill_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skill_checklists(id) ON DELETE CASCADE,
  status skill_level NOT NULL DEFAULT 'no_iniciado',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, skill_id)
);

-- 3.24 Plantillas de Mensajes de WhatsApp
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3.25 Registro de Mensajes y Comunicaciones (Audit Log)
CREATE TABLE message_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  template_code TEXT,
  phone_sent TEXT NOT NULL,
  message_content TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp_assisted',
  sent_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.26 Configuración General del Sistema
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_name TEXT NOT NULL DEFAULT 'EAM - Escuela Argentina de Manejo',
  school_address TEXT NOT NULL DEFAULT 'Mitre 294, Florencio Varela, Buenos Aires',
  school_phone TEXT NOT NULL DEFAULT '5491136373331',
  min_hours_notice_booking INT NOT NULL DEFAULT 12,
  min_hours_notice_cancel INT NOT NULL DEFAULT 24,
  max_days_advance_booking INT NOT NULL DEFAULT 30,
  auto_confirm_bookings BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- 4. ROW LEVEL SECURITY (RLS) en TODAS las Tablas
-- ==========================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Funciones auxiliares de RLS para roles
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'recepcion', 'instructor', 'finanzas')
    AND is_active = TRUE
  );
$$ LANGUAGE sql STABLE;

-- Políticas de lectura de Servicios para visitantes (pública)
CREATE POLICY "Public services read" ON services
  FOR SELECT USING (is_active = TRUE);

-- Políticas de Holidays para lectura general
CREATE POLICY "Public holidays read" ON holidays
  FOR SELECT USING (TRUE);

-- Políticas para personal autenticado
CREATE POLICY "Staff full read profiles" ON profiles
  FOR SELECT USING (is_staff());

CREATE POLICY "Staff read instructors" ON instructors
  FOR ALL USING (is_staff());

CREATE POLICY "Staff read clients" ON clients
  FOR ALL USING (is_staff());

CREATE POLICY "Staff read lessons" ON lessons
  FOR ALL USING (is_staff());

CREATE POLICY "Staff read vehicles" ON vehicles
  FOR ALL USING (is_staff());

CREATE POLICY "Staff read payments" ON payments
  FOR ALL USING (is_staff());

CREATE POLICY "Staff read expenses" ON expenses
  FOR ALL USING (is_staff());

CREATE POLICY "Staff read leads" ON leads
  FOR ALL USING (is_staff());

CREATE POLICY "Staff read templates" ON message_templates
  FOR ALL USING (is_staff());

CREATE POLICY "Staff read settings" ON settings
  FOR ALL USING (is_staff());

-- ==========================================================================
-- 5. FUNCIONES RPC TRANSACCIONALES PARA EL MÓDULO PÚBLICO (SECURITY DEFINER)
-- ==========================================================================

-- 5.1 Consultar slots disponibles para reserva pública
CREATE OR REPLACE FUNCTION get_available_booking_slots(
  p_date DATE,
  p_service_id UUID,
  p_instructor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  instructor_id UUID,
  instructor_name TEXT,
  vehicle_id UUID,
  vehicle_model TEXT,
  transmission vehicle_transmission,
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration INT;
  v_day_of_week INT;
BEGIN
  -- Obtener duración del servicio
  SELECT duration_minutes INTO v_duration FROM services WHERE id = p_service_id;
  IF v_duration IS NULL THEN
    v_duration := 60;
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_date);

  -- Si es feriado, retornar vacío
  IF EXISTS (SELECT 1 FROM holidays WHERE holiday_date = p_date) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH slots AS (
    SELECT 
      ia.instructor_id,
      p.full_name AS instructor_name,
      v.id AS vehicle_id,
      (v.brand || ' ' || v.model || ' (' || v.plate || ')') AS vehicle_model,
      v.transmission,
      (p_date + (ia.start_time + (step * (v_duration || ' minutes')::interval)))::timestamptz AS slot_start,
      (p_date + (ia.start_time + ((step + 1) * (v_duration || ' minutes')::interval)))::timestamptz AS slot_end
    FROM instructor_availability ia
    JOIN instructors i ON i.id = ia.instructor_id AND i.status = 'activo'
    JOIN profiles p ON p.id = i.id
    CROSS JOIN vehicles v
    CROSS JOIN generate_series(
      0, 
      FLOOR((EXTRACT(EPOCH FROM (ia.end_time - ia.start_time)) / 60) / v_duration)::int - 1
    ) AS step
    WHERE ia.day_of_week = v_day_of_week
      AND v.status = 'operativo'
      AND (p_instructor_id IS NULL OR ia.instructor_id = p_instructor_id)
      -- El vehículo no debe estar en taller
      AND NOT EXISTS (
        SELECT 1 FROM vehicle_maintenance vm 
        WHERE vm.vehicle_id = v.id 
          AND vm.locks_calendar = TRUE 
          AND p_date BETWEEN vm.start_date AND COALESCE(vm.end_date, CURRENT_DATE + 365)
      )
  )
  SELECT s.instructor_id, s.instructor_name, s.vehicle_id, s.vehicle_model, s.transmission, s.slot_start, s.slot_end
  FROM slots s
  -- Excluir excepciones del instructor
  WHERE NOT EXISTS (
    SELECT 1 FROM availability_exceptions ae
    WHERE ae.instructor_id = s.instructor_id
      AND ae.start_time < s.slot_end AND ae.end_time > s.slot_start
  )
  -- Excluir clases ya reservadas para el instructor
  AND NOT EXISTS (
    SELECT 1 FROM lessons l
    WHERE l.instructor_id = s.instructor_id
      AND l.status NOT IN ('cancelada', 'reprogramada')
      AND l.time_range && TSTZRANGE(s.slot_start, s.slot_end)
  )
  -- Excluir clases ya reservadas para el vehículo
  AND NOT EXISTS (
    SELECT 1 FROM lessons l
    WHERE l.vehicle_id = s.vehicle_id
      AND l.status NOT IN ('cancelada', 'reprogramada')
      AND l.time_range && TSTZRANGE(s.slot_start, s.slot_end)
  )
  -- Excluir holds activos no vencidos
  AND NOT EXISTS (
    SELECT 1 FROM booking_holds bh
    WHERE (bh.instructor_id = s.instructor_id OR bh.vehicle_id = s.vehicle_id)
      AND bh.status = 'active'
      AND bh.expires_at > NOW()
      AND TSTZRANGE(bh.start_time, bh.end_time) && TSTZRANGE(s.slot_start, s.slot_end)
  )
  ORDER BY s.slot_start, s.instructor_name;
END;
$$;

-- 5.2 Crear hold temporal para bloquear el horario durante el checkout
CREATE OR REPLACE FUNCTION create_booking_hold(
  p_instructor_id UUID,
  p_vehicle_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_session_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold_id UUID;
BEGIN
  -- Limpiar holds vencidos
  UPDATE booking_holds SET status = 'expired' WHERE status = 'active' AND expires_at <= NOW();

  -- Verificar si ya hay una clase en ese horario
  IF EXISTS (
    SELECT 1 FROM lessons 
    WHERE (instructor_id = p_instructor_id OR vehicle_id = p_vehicle_id)
      AND status NOT IN ('cancelada', 'reprogramada')
      AND time_range && TSTZRANGE(p_start_time, p_end_time)
  ) THEN
    RAISE EXCEPTION 'El horario ya fue reservado por otro usuario.';
  END IF;

  -- Verificar si hay otro hold activo
  IF EXISTS (
    SELECT 1 FROM booking_holds
    WHERE (instructor_id = p_instructor_id OR vehicle_id = p_vehicle_id)
      AND status = 'active'
      AND expires_at > NOW()
      AND session_id <> p_session_id
      AND TSTZRANGE(start_time, end_time) && TSTZRANGE(p_start_time, p_end_time)
  ) THEN
    RAISE EXCEPTION 'El horario se encuentra temporalmente retenido por otro usuario. Intente en unos minutos.';
  END IF;

  INSERT INTO booking_holds (instructor_id, vehicle_id, start_time, end_time, session_id, expires_at, status)
  VALUES (p_instructor_id, p_vehicle_id, p_start_time, p_end_time, p_session_id, NOW() + INTERVAL '10 minutes', 'active')
  RETURNING id INTO v_hold_id;

  RETURN v_hold_id;
END;
$$;

-- 5.3 Confirmar la reserva online
CREATE OR REPLACE FUNCTION confirm_online_booking(
  p_hold_id UUID,
  p_service_id UUID,
  p_full_name TEXT,
  p_dni TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_experience experience_level DEFAULT 'cero',
  p_has_license BOOLEAN DEFAULT FALSE,
  p_comments TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold booking_holds%ROWTYPE;
  v_client_id UUID;
  v_lesson_id UUID;
  v_token UUID;
BEGIN
  -- 1. Validar el hold
  SELECT * INTO v_hold FROM booking_holds WHERE id = p_hold_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El turno seleccionado expiró o no es válido.';
  END IF;

  IF v_hold.expires_at <= NOW() THEN
    UPDATE booking_holds SET status = 'expired' WHERE id = p_hold_id;
    RAISE EXCEPTION 'El tiempo de espera de 10 minutos ha expirado. Por favor seleccione el horario nuevamente.';
  END IF;

  -- 2. Crear o actualizar cliente por DNI
  SELECT id INTO v_client_id FROM clients WHERE dni = p_dni;
  IF v_client_id IS NULL THEN
    INSERT INTO clients (full_name, dni, phone, email, experience_level, has_license, status, notes)
    VALUES (p_full_name, p_dni, p_phone, p_email, p_experience, p_has_license, 'activo', p_comments)
    RETURNING id INTO v_client_id;
  ELSE
    UPDATE clients 
    SET full_name = p_full_name, phone = p_phone, email = COALESCE(p_email, email), updated_at = NOW()
    WHERE id = v_client_id;
  END IF;

  -- 3. Crear Lead con origen 'web'
  INSERT INTO leads (client_id, full_name, phone, email, stage, source, notes)
  VALUES (v_client_id, p_full_name, p_phone, p_email, 'nuevo', 'web', 'Reserva online confirmada: ' || COALESCE(p_comments, ''));

  -- 4. Crear la clase
  v_token := uuid_generate_v4();
  INSERT INTO lessons (
    client_id, instructor_id, vehicle_id, service_id, 
    start_time, end_time, status, public_token, instructor_notes
  )
  VALUES (
    v_client_id, v_hold.instructor_id, v_hold.vehicle_id, p_service_id,
    v_hold.start_time, v_hold.end_time, 'confirmada', v_token, p_comments
  )
  RETURNING id INTO v_lesson_id;

  -- 5. Marcar el hold como convertido
  UPDATE booking_holds SET status = 'converted' WHERE id = p_hold_id;

  RETURN jsonb_build_object(
    'lesson_id', v_lesson_id,
    'client_id', v_client_id,
    'public_token', v_token,
    'start_time', v_hold.start_time,
    'end_time', v_hold.end_time
  );
END;
$$;

-- 5.4 Consultar detalle de reserva por token público (sin login)
CREATE OR REPLACE FUNCTION get_booking_by_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', l.id,
    'start_time', l.start_time,
    'end_time', l.end_time,
    'status', l.status,
    'pickup_address', l.pickup_address,
    'service_name', s.name,
    'service_price', s.price,
    'instructor_name', p.full_name,
    'vehicle_model', (v.brand || ' ' || v.model || ' (' || v.plate || ')'),
    'transmission', v.transmission,
    'client_name', c.full_name,
    'client_phone', c.phone,
    'client_email', c.email
  ) INTO v_res
  FROM lessons l
  JOIN services s ON s.id = l.service_id
  JOIN instructors i ON i.id = l.instructor_id
  JOIN profiles p ON p.id = i.id
  JOIN vehicles v ON v.id = l.vehicle_id
  JOIN clients c ON c.id = l.client_id
  WHERE l.public_token = p_token;

  RETURN v_res;
END;
$$;

-- 5.5 Cancelar reserva por token público respetando política de 24 horas
CREATE OR REPLACE FUNCTION cancel_booking_by_token(p_token UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE public_token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada.';
  END IF;

  IF v_lesson.status = 'cancelada' THEN
    RAISE EXCEPTION 'La reserva ya se encuentra cancelada.';
  END IF;

  -- Comprobar política de 24 horas
  IF v_lesson.start_time <= (NOW() + INTERVAL '24 hours') THEN
    RAISE EXCEPTION 'Las cancelaciones online deben realizarse con al menos 24 horas de anticipación. Por favor comuníquese por WhatsApp con la secretaría de EAM.';
  END IF;

  UPDATE lessons 
  SET status = 'cancelada', 
      cancellation_reason = COALESCE(p_reason, 'Cancelado por el alumno desde la web'),
      updated_at = NOW()
  WHERE id = v_lesson.id;

  RETURN jsonb_build_object('success', true, 'message', 'Tu turno ha sido cancelado con éxito.');
END;
$$;
