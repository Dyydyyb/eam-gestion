# Guía de Integración: Turnero Online EAM en el Sitio Web Actual

Este documento explica cómo integrar el sistema de turnos online y el panel de gestión en el sitio web institucional existente de **EAM Escuela de Manejo**.

---

## 1. Opción A: Enlace Directo / Botón CTA en la Landing

Para que los botones principales del sitio ("Consultar Ahora", "Iniciar Consulta Guiada", "Reservá tu Turno") lleven al flujo de 4 pasos optimizado:

```html
<!-- Enlace en el Header -->
<a href="http://localhost:3000/reservar" class="btn-header-cta" target="_blank" rel="noopener">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
  <span>Reservar Turno Online</span>
</a>
```

---

## 2. Opción B: Widget Embebible (Iframe Responsive)

Podés insertar el widget compacto directamente dentro de cualquier sección de la landing (por ejemplo, en la sección de clases o reemplazando el paso 3 del formulario):

```html
<div class="eam-booking-widget-container" style="max-width: 580px; margin: 0 auto; padding: 20px 0;">
  <iframe 
    src="http://localhost:3000/widget/reservar" 
    width="100%" 
    height="560" 
    frameborder="0" 
    scrolling="no"
    style="border: none; border-radius: 24px; box-shadow: 0 12px 35px rgba(3, 56, 126, 0.12);"
    title="Reserva de Turnos Online - EAM Escuela de Manejo"
  ></iframe>
</div>
```

---

## 3. Opción C: Modal Pop-up (JavaScript Snippet)

Para abrir el turnero en una ventana modal flotante sin sacar al usuario de la página:

```html
<!-- Botón disparador -->
<button onclick="openEamBookingModal()" class="btn-cta-primary">
  Reservar Turno Online
</button>

<!-- Script -->
<script>
  function openEamBookingModal() {
    const modal = document.createElement('div');
    modal.id = 'eamBookingModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(2,37,84,0.7);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="position:relative;width:100%;max-width:600px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
        <button onclick="document.getElementById('eamBookingModal').remove()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;color:#64748B;z-index:10;">✕</button>
        <iframe src="http://localhost:3000/widget/reservar" width="100%" height="560" frameborder="0" style="border:none;"></iframe>
      </div>
    `;
    document.body.appendChild(modal);
  }
</script>
```

---

## 4. Funcionamiento Anti-Solapamiento y Sincronización en Vivo

1. Cuando un usuario confirma una reserva en el widget o en `/reservar`:
   - Se crea automáticamente el cliente (o se actualiza por DNI).
   - Se inserta el turno en la tabla `lessons`.
   - Se genera el lead web en `leads`.
   - El horario desaparece instantáneamente de la grilla de disponibilidad pública.
   - El nuevo turno aparece de inmediato en la **Agenda y Calendario** (`/admin/agenda`) del panel administrativo para los instructores y recepción.
