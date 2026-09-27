-- ==========================================================================
-- EAM Gestión — Seed de Demostración Realista
-- Florencio Varela, Buenos Aires
-- ==========================================================================

-- 1. Servicios ofrecidos por EAM
INSERT INTO services (id, name, description, duration_minutes, price, is_package, package_class_count, is_active, available_online)
VALUES 
  ('11111111-1111-1111-1111-111111111101', 'Clase Práctica Individual', 'Clase de 60 minutos en auto doble comando con instructor profesional.', 60, 24000.00, FALSE, 1, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111102', 'Práctica en Pista de Examen', 'Simulación de circuito de examen municipal de Florencio Varela.', 60, 28000.00, FALSE, 1, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111103', 'Pack 5 Clases Iniciales', 'Programa progresivo desde embrague hasta tránsito guiado.', 60, 110000.00, TRUE, 5, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111104', 'Pack 10 Clases Integral', 'Curso completo desde cero hasta estacionamiento y pista de examen.', 60, 205000.00, TRUE, 10, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111105', 'Clase Diagnóstico / Prueba', 'Evaluación para conductores que ya saben algo o tienen temor.', 45, 18000.00, FALSE, 1, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Categorías de Gastos
INSERT INTO expense_categories (id, name, description)
VALUES 
  ('22222222-2222-2222-2222-222222222201', 'Combustible', 'Carga de nafta / GNC en estaciones YPF / Shell'),
  ('22222222-2222-2222-2222-222222222202', 'Mantenimiento de Flota', 'Cambio de aceite, frenos, cubiertas y service'),
  ('22222222-2222-2222-2222-222222222203', 'Sueldos y Liquidaciones', 'Pago a instructores y personal de recepción'),
  ('22222222-2222-2222-2222-222222222204', 'Alquiler y Servicios', 'Sede Mitre 294, luz, internet y pista'),
  ('22222222-2222-2222-2222-222222222205', 'Seguros y VTV', 'Pólizas de seguro de aprendizaje y obleas VTV'),
  ('22222222-2222-2222-2222-222222222206', 'Publicidad y Marketing', 'Google Ads, folletería y redes sociales')
ON CONFLICT (id) DO NOTHING;

-- 3. Plantillas de Mensajes WhatsApp
INSERT INTO message_templates (code, title, content)
VALUES
  ('recordatorio_turno', 'Recordatorio de Turno (24/48h)', '¡Hola {nombre}! 🚗 Te recordamos tu clase de manejo en EAM el {fecha} a las {hora} con el instructor {instructor} en auto {vehiculo}. Por favor, presentate en {direccion} con 5 minutos de anticipación. Si necesitás reprogramar, avisanos con al menos 24 hs de anticipación: {link_reprogramar}. ¡Te esperamos!'),
  ('confirmacion_reserva', 'Confirmación de Reserva Online', '¡Hola {nombre}! Tu turno en EAM fue reservado con éxito para el {fecha} a las {hora}. Instructor asignado: {instructor}. Podes ver los detalles de tu turno o cancelarlo aquí: {link_reprogramar}'),
  ('clase_reprogramada', 'Reprogramación de Clase', 'Hola {nombre}, tu clase de manejo fue reprogramada para el {fecha} a las {hora} con {instructor}. ¡Te esperamos en nuestra sede de Florencio Varela!'),
  ('felicitacion_examen', 'Felicitaciones por Licencia Aprobada', '¡FELICITACIONES {nombre}! 🎓🎉 Nos alegra inmensamente que hayas aprobado tu examen de conducir en Florencio Varela. ¡Sos oficialmente un conductor seguro! Gracias por confiar en el equipo de EAM.'),
  ('aviso_saldo', 'Recordatorio de Saldo Pendiente', 'Hola {nombre}, te recordamos que tenés un saldo pendiente de {saldo} correspondiente a tu pack de clases en EAM. Podés abonarlo por transferencia bancaria o en nuestra secretaría de Mitre 294.')
ON CONFLICT (code) DO NOTHING;

-- 4. Checklist de Habilidades
INSERT INTO skill_checklists (code, title, description, sort_order)
VALUES
  ('SKILL_EMBRAGUE', 'Control de Embrague y Punto de Contacto', 'Dominio del pedal de embrague para salir suave sin que se apague el motor.', 1),
  ('SKILL_VOLANTE', 'Postura y Maniobras de Volante', 'Uso correcto de manos en posición 9 y 3, giros y retornos suaves.', 2),
  ('SKILL_FRENADO', 'Frenado Progresivo y Distancia', 'Frenado a tiempo sin brusquedad y mantenimiento de distancia preventiva.', 3),
  ('SKILL_ESTAC_45', 'Estacionamiento a 45 Grados', 'Ingreso y salida de dársenas a 45° con cálculo de trompa y cola.', 4),
  ('SKILL_ESTAC_PARALELO', 'Estacionamiento Paralelo (Entre dos autos)', 'Maniobra en 3 movimientos mirando espejos laterales y marcha atrás.', 5),
  ('SKILL_PENDIENTE', 'Arranque en Subida / Pendiente', 'Uso coordinado de freno de mano o pedales en calles empinadas.', 6),
  ('SKILL_TRANSITO', 'Circulación en Tránsito Urbano y Avenidas', 'Cambios de carril con guiño, cruces de vías y prioridad de paso.', 7),
  ('SKILL_PISTA', 'Recorrido de Examen Municipal', 'Práctica de conos, zigzag y circuito oficial de Florencio Varela.', 8)
ON CONFLICT (code) DO NOTHING;

-- 5. Configuración del Sistema
INSERT INTO settings (school_name, school_address, school_phone, min_hours_notice_booking, min_hours_notice_cancel, max_days_advance_booking, auto_confirm_bookings)
VALUES ('EAM - Escuela Argentina de Manejo', 'Mitre 294, Florencio Varela, Buenos Aires', '5491136373331', 12, 24, 30, TRUE)
ON CONFLICT DO NOTHING;
