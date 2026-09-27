# Registro de Decisiones de Arquitectura y Diseño — EAM Gestión

Este documento registra las decisiones técnicas, de negocio y de diseño tomadas durante el desarrollo del sistema de gestión y reserva de turnos online para **EAM – Escuela Argentina de Manejo** (Florencio Varela).

---

## ADR 001: Ubicación del Proyecto y Desacople con la Landing
- **Fecha:** 18/09/2026
- **Decisión:** Desarrollar el sistema en `C:\Users\dylan\.gemini\antigravity-ide\scratch\eam-gestion` como una aplicación Next.js 14+ App Router independiente, conectada a Supabase.
- **Razón:** Permite que la landing estática existente en `eam-escuela-manejo` continúe funcionando sin interrupciones, integrando la reserva de turnos de dos formas directas: (a) redirección al flujo completo `/reservar` y (b) widget embebible `/widget/reservar` mediante `<iframe>` o componente modal.
- **Consecuencias:** Se comparten los assets (logo oficial) y las variables de diseño exactas (`#03387E`, `#00A3FF`, `Outfit`, `Plus Jakarta Sans`).

---

## ADR 002: Modelo Anti-Solapamiento y Concurrencia (PostgreSQL btree_gist)
- **Fecha:** 18/09/2026
- **Decisión:** Implementar restricciones de exclusión relacionales (`EXCLUDE USING gist`) en PostgreSQL utilizando la extensión `btree_gist` sobre rangos temporales (`tstzrange`) para:
  1. Instructor (`instructor_id WITH =, time_range WITH &&`)
  2. Vehículo (`vehicle_id WITH =, time_range WITH &&`)
  3. Alumno (`client_id WITH =, time_range WITH &&`)
- **Razón:** La validación en frontend o en memoria de servidor es susceptible a condiciones de carrera (*race conditions*) con reservas concurrentes. PostgreSQL garantiza a nivel ACID que es matemáticamente imposible insertar dos turnos solapados para el mismo instructor, auto o alumno.
- **Bloqueo Temporal (Hold):** Se añade una tabla `booking_holds` con caducidad automática de 10 minutos para retener el horario mientras el usuario completa sus datos personales en el paso 3 del asistente de reserva.

---

## ADR 003: Seguridad RLS y Funciones RPC con SECURITY DEFINER
- **Fecha:** 18/09/2026
- **Decisión:** Activar Row Level Security (RLS) en el 100% de las tablas. Los visitantes anónimos de la web no tienen permiso de `SELECT`, `INSERT` ni `UPDATE` directo sobre las tablas nucleares (`clients`, `lessons`, `vehicles`). Toda consulta de disponibilidad y creación de reservas públicas se realiza mediante funciones RPC específicas (`get_available_booking_slots`, `create_booking_hold`, `confirm_online_booking`, `get_booking_by_token`, `cancel_booking_by_token`) con `SECURITY DEFINER` y `SET search_path = public`.
- **Razón:** Cumplimiento con la Ley 25.326 de Protección de Datos Personales de Argentina y prevención de raspado de agendas o fuga de información de alumnos.

---

## ADR 004: Normalización Telefónica y Mensajería WhatsApp
- **Fecha:** 18/09/2026
- **Decisión:** Se implementa un normalizador estricto para números de teléfono argentinos:
  - Elimina prefijos locales como `0` y `15`.
  - Agrega el prefijo internacional `549` seguido del código de área (ej: `11` para Buenos Aires/AMBA) y el número local.
  - La mensajería se estructura bajo una interfaz desacoplada `IMessagingService`, cuya implementación en Fase 1 genera enlaces universales `https://wa.me/549XXXXXXXXXX?text=...` con texto precargado desde plantillas configurables con variables `{nombre}`, `{fecha}`, `{hora}`, etc., y registro automático de auditoría al hacer clic.
- **Razón:** Permite el envío asistido inmediato sin costo de API en Fase 1, dejando la base lista para conectarse con WhatsApp Cloud API en el futuro sin modificar la UI.

---

## ADR 005: Resiliencia de Datos y Modo Demo / Local
- **Fecha:** 18/09/2026
- **Decisión:** Implementar un proveedor de datos híbrido que interactúa con el cliente Supabase oficial cuando las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están configuradas, y que provee un almacén local inicializado con el seed completo de demostración (5 instructores, 6 autos, 40 alumnos, turnos y finanzas) si la instancia remota aún no ha sido provista.
- **Razón:** Asegura que la aplicación se pueda ejecutar, probar y navegar en cualquier entorno de desarrollo o evaluación de manera 100% interactiva.
