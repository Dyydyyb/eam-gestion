# EAM Escuela de Manejo — Plataforma Web & CRM Integral

Plataforma operativa completa desarrollada para **EAM - Escuela Argentina de Manejo** (Sede Florencio Varela). Incluye Landing Page de conversión, sistema de turnos online, asistente interactivo de WhatsApp y un panel CRM integral para administración escolar, docentes y flota.

---

## 🚀 Características Principales

### 🌐 Portal Público & Alumnos
- **Landing Page de Alta Conversión**: Presentación institucional, testimonios reales, mapa de cobertura y cotizador de clases.
- **Turnero Online Autogestionable**: Selección de instructor, vehículo, fecha y horario con confirmación automática.
- **Asistente WhatsApp de 3 Pasos**: Flujo guiado para principiantes o conductores avanzados con prellenado de consultas.

### 🛡️ Panel de Control & CRM (`/admin/dashboard`)
- **Dashboard Operativo**: KPIs en vivo de clases del día, ocupación de flota, balance de caja y retención.
- **Agenda y Turnos con Calendario Interactivo (`/admin/agenda`)**:
  - Vistas Mensual, Semanal, Diaria y por Instructor.
  - **Filtro dinámico de instructores** con códigos de color e indicadores de carga horaria.
  - Modal operativo para asignar alumnos, cambiar estados, reprogramar y enviar recordatorios por WhatsApp.
- **Packs y Aranceles (`/admin/packs`)**:
  - Catálogo de paquetes de clases estándar y configuración de clases personalizadas.
  - **Asignación individual a cada alumno**: paquete elegido o tarifa especial por clase.
  - **Arancel de Alquiler de Auto para Rendir Examen**: Valor base configurable ($45.000) e inclusión en la ficha financiera del alumno.
- **Alumnos / CRM (`/admin/clientes`)**:
  - Ficha detallada de cada estudiante con historial de clases, paquete contratado, pagos y saldo pendiente.
- **Flota y Vehículos (`/admin/flota`)**:
  - Monitoreo de unidades activas, mantenimiento y kilometraje.
- **Finanzas y Reportes (`/admin/finanzas`, `/admin/reportes`)**:
  - Flujo de caja, balance diario/mensual y métricas académicas.

---

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router, React 19)
- **Estilos**: Tailwind CSS 4 & Vanilla CSS
- **Iconos**: Lucide React
- **Gráficos**: Recharts
- **Efectos**: Canvas Confetti
- **Base de Datos**: Supabase (PostgreSQL)

---

## ⚙️ Configuración Local

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🚢 Despliegue en Vercel

1. En el dashboard de Vercel, hacer clic en **Add New... ➔ Project**.
2. Seleccionar el repositorio **`Dyydyyb/eam-gestion`**.
3. Mantener el Preset en **Next.js** y hacer clic en **Deploy**.
