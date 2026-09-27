/**
 * EAM — Escuela de Manejo (Florencio Varela)
 * Main Application Script
 * Features:
 *  - Sticky Header with transition to solid petrol blue on scroll
 *  - Theme Seatbelt Latch Animation (one-time viewport trigger)
 *  - Interactive H-Pattern Shifter (SVG gear console & dynamic pedagogical guide)
 *  - 3-Step WhatsApp Consultation Wizard with live personalized message generation
 *  - Mobile menu toggle and scroll reveal animations
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileNav();
  initSeatbeltAnimation();
  initGearbox();
  initWizard();
  initScrollAnimations();
});

/* ==========================================================================
   1. Site Header (Scroll transition & Sticky)
   ========================================================================== */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ==========================================================================
   2. Mobile Navigation Toggle
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const navMenu = document.getElementById('navMenu');
  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile menu on nav link click
  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ==========================================================================
   3. Seatbelt Animation (Scroll-triggered once)
   ========================================================================== */
function initSeatbeltAnimation() {
  const stage = document.getElementById('seatbeltMechanism');
  const statusLabel = document.getElementById('seatbeltStatusLabel');
  if (!stage) return;

  let hasTriggered = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasTriggered) {
        hasTriggered = true;
        stage.classList.add('buckled');
        
        // Update label text smoothly when click impact happens
        setTimeout(() => {
          if (statusLabel) {
            statusLabel.textContent = '¡Cinturón de seguridad abrochado y bloqueado! Listo para arrancar';
          }
        }, 600);

        // Disconnect after triggering once
        observer.unobserve(stage);
      }
    });
  }, {
    threshold: 0.35,
    rootMargin: '0px 0px -50px 0px'
  });

  observer.observe(stage);
}

/* ==========================================================================
   4. Interactive Gearbox (Caja de Cambios H-Pattern)
   ========================================================================== */
function initGearbox() {
  const leverKnob = document.getElementById('leverKnob');
  const gearBtns = document.querySelectorAll('.gear-node-btn');
  const badgeEl = document.getElementById('currentGearBadge');
  const speedEl = document.getElementById('currentSpeedRange');
  const titleEl = document.getElementById('gearStepTitle');
  const descEl = document.getElementById('gearStepDesc');
  const tipsListEl = document.getElementById('gearTipsList');
  const objMsgEl = document.getElementById('gearObjectiveMsg');

  if (!leverKnob || gearBtns.length === 0) return;

  // Pedagogical data for each gear position
  const gearsData = {
    '1': {
      posClass: 'pos-1',
      badge: '1ª Velocidad',
      speed: '0 a 20 km/h • Salida y Tracción Inicial',
      title: 'Arranque suave y control del embrague',
      desc: 'El primer gran hito de cualquier conductor. En esta fase aprendés a encontrar el "punto de contacto" del pedal de embrague, coordinar el pie con el acelerador y poner el vehículo en movimiento con total suavidad sin que se te apague.',
      tips: [
        'Punto de fricción: sentir la suave vibración del motor cuando el disco acopla.',
        'Arranque en llano: técnica de talón apoyado en el piso y despegue milimétrico.',
        'Doble comando: el instructor acompaña cada salida para tu total tranquilidad.'
      ],
      objective: 'Eliminar la ansiedad del arranque para que salir en un semáforo sea un acto mecánico y natural.'
    },
    '2': {
      posClass: 'pos-2',
      badge: '2ª Velocidad',
      speed: '20 a 35 km/h • Maniobras Urbanas y Giros',
      title: 'Primeras maniobras a baja velocidad',
      desc: 'El cambio de marcha más utilizado en la circulación barrial y céntrica de Florencio Varela. Practicamos la transición fluida de primera a segunda, aproximación a esquinas y maniobras de doblaje seguro.',
      tips: [
        'Transición de marcha sin tirones llevando la palanca hacia abajo y a la izquierda.',
        'Uso del freno motor y anticipación antes de doblar en esquinas angostas.',
        'Posición de manos "diez y diez" para conservar el control en giros cerrados.'
      ],
      objective: 'Ganar soltura al doblar y familiarizarse con el espacio y radio de giro del vehículo.'
    },
    '3': {
      posClass: 'pos-3',
      badge: '3ª Velocidad',
      speed: '30 a 50 km/h • Circulación Fluida en Avenidas',
      title: 'Circulación en avenidas y calles principales',
      desc: 'Para cuando ya dominás los pedales en zonas calmas. Damos el salto a avenidas con tráfico real (San Martín, Senzabello o Monteagudo), incorporando la lectura del tránsito, colectivos y semáforos continuos.',
      tips: [
        'Mantenimiento de carril central y velocidad constante acorde al flujo.',
        'Monitoreo activo de espejos retrovisores cada 5 a 8 segundos.',
        'Distancia preventiva de frenado respecto al vehículo delantero.'
      ],
      objective: 'Perder el miedo a convivir con otros conductores y ganar fluidez en el tránsito real.'
    },
    '4': {
      posClass: 'pos-4',
      badge: '4ª Velocidad',
      speed: '50 a 70 km/h • Desplazamiento Ágil y Seguro',
      title: 'Transición de marchas altas y sobrepasos',
      desc: 'Uso eficiente de la caja de cambios en avenidas anchas y accesos. Desarrollamos la técnica de rebaje preventivo (de 4ª a 3ª o 2ª) para detener el auto o superar obstáculos sin forzar los frenos.',
      tips: [
        'Técnica de rebaje de marchas para doblar o disminuir la marcha progresivamente.',
        'Control de puntos ciegos antes de cualquier cambio de carril en avenidas.',
        'Frenado progresivo y suave cuidando la estabilidad y adherencia.'
      ],
      objective: 'Aprender a escuchar el régimen del motor para saber con exactitud cuándo subir o bajar marcha.'
    },
    '5': {
      posClass: 'pos-5',
      badge: '5ª Velocidad',
      speed: '70 a 100+ km/h • Manejo en Ruta y Autovía',
      title: 'Manejo en ruta y trayectos rápidos',
      desc: 'Conceptos avanzados de aerodinámica, estabilidad vehicular a velocidad crucero, adelantamientos en tramos permitidos y lectura de cartelería vial vertical y horizontal.',
      tips: [
        'Sujeción firme del volante sin movimientos bruscos a velocidades altas.',
        'Cálculo preciso de distancias y tiempos para maniobras de sobrepaso seguras.',
        'Mantenimiento de la distancia reglamentaria de 2 segundos en ruta.'
      ],
      objective: 'Seguridad y aplomo para emprender viajes en autopista con tu familia o amigos.'
    },
    'r': {
      posClass: 'pos-r',
      badge: 'Marcha Atrás (Reversa)',
      speed: '0 a 5 km/h • Estacionamiento y Maniobras',
      title: 'Estacionamiento y maniobras de precisión',
      desc: 'La prueba clave del examen municipal de Florencio Varela. Ensayamos con conos reglamentarios las 3 modalidades exigidas: a 90° (batería), a 45° y en paralelo (180°) entre vehículos sin tocar cordón ni vallas.',
      tips: [
        'Embrague en el punto justo de fricción para mover el auto milímetro a milímetro.',
        'Alineación precisa tomando de referencia los parantes y retrovisores.',
        'Técnica infalible de giros de volante para no rozar los conos en el examen.'
      ],
      objective: 'Llegar al examen de manejo con la certeza de que el estacionamiento está 100% dominado.'
    }
  };

  function selectGear(gearKey) {
    const data = gearsData[gearKey];
    if (!data) return;

    // 1. Update Lever Knob position
    leverKnob.className.baseVal = `gear-lever-knob ${data.posClass}`;

    // 2. Update active gear button state
    gearBtns.forEach(btn => {
      const isTarget = btn.getAttribute('data-gear') === gearKey;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-pressed', isTarget);
    });

    // 3. Smoothly update text contents
    const infoCard = document.getElementById('gearboxInfoCard');
    if (infoCard) {
      infoCard.style.opacity = '0.7';
    }

    setTimeout(() => {
      if (badgeEl) badgeEl.textContent = data.badge;
      if (speedEl) speedEl.textContent = data.speed;
      if (titleEl) titleEl.textContent = data.title;
      if (descEl) descEl.textContent = data.desc;
      if (objMsgEl) objMsgEl.textContent = data.objective;

      if (tipsListEl) {
        tipsListEl.innerHTML = '';
        data.tips.forEach(tip => {
          const li = document.createElement('li');
          li.innerHTML = `<span class="bullet">▸</span> ${tip}`;
          tipsListEl.appendChild(li);
        });
      }

      if (infoCard) {
        infoCard.style.opacity = '1';
      }
    }, 120);
  }

  // Attach click & keydown events to each gear node
  gearBtns.forEach(btn => {
    const gear = btn.getAttribute('data-gear');
    btn.addEventListener('click', () => selectGear(gear));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectGear(gear);
      }
    });
  });

  // Default selection: 1ª
  selectGear('1');
}

/* ==========================================================================
   5. WhatsApp Consultation Wizard (3 Steps + Live Message Generator)
   ========================================================================== */
function initWizard() {
  const wizardData = {
    step: 1,
    level: 'Nunca manejé / soy principiante',
    interest: 'Información sobre precios',
    name: ''
  };

  const step1Pane = document.getElementById('wizardStep1');
  const step2Pane = document.getElementById('wizardStep2');
  const step3Pane = document.getElementById('wizardStep3');

  const tab1 = document.getElementById('stepTab1');
  const tab2 = document.getElementById('stepTab2');
  const tab3 = document.getElementById('stepTab3');

  const progressFill = document.getElementById('wizardProgressFill');
  const btnBack = document.getElementById('wizardBtnBack');
  const btnNext = document.getElementById('wizardBtnNext');
  const btnSubmit = document.getElementById('wizardBtnSubmit');

  const nameInput = document.getElementById('wizardInputName');
  const messagePreview = document.getElementById('wizardGeneratedMessage');

  // Option cards click handlers for Step 1 & Step 2
  const optionCards = document.querySelectorAll('.wizard-option-card');
  optionCards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-name');
      const val = card.getAttribute('data-value');

      // Unselect siblings
      const parent = card.closest('.wizard-options-grid');
      if (parent) {
        parent.querySelectorAll('.wizard-option-card').forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });
      }

      // Select this
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');

      if (type === 'level') {
        wizardData.level = val;
      } else if (type === 'interest') {
        wizardData.interest = val;
      }

      updateMessage();
    });

    // Keyboard support for option cards
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // Name input listener
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      wizardData.name = e.target.value.trim();
      updateMessage();
    });
  }

  // Update dynamic message preview and WhatsApp submit link
  function updateMessage() {
    let text = '';
    const phone = '5491136373331';

    if (wizardData.name) {
      text = `Hola EAM, soy ${wizardData.name}. Mi nivel actual es: ${wizardData.level}. Me interesa: ${wizardData.interest}. ¿Podrían darme más información sobre los cursos y aranceles?`;
    } else {
      text = `Hola EAM, mi nivel actual es: ${wizardData.level}. Me interesa: ${wizardData.interest}. ¿Podrían darme más información sobre los cursos y aranceles?`;
    }

    if (messagePreview) {
      messagePreview.textContent = `"${text}"`;
    }

    if (btnSubmit) {
      const encoded = encodeURIComponent(text);
      btnSubmit.href = `https://wa.me/${phone}?text=${encoded}`;
    }
  }

  // Switch steps visually
  function goToStep(step) {
    wizardData.step = step;

    // Panes
    if (step1Pane) step1Pane.classList.toggle('active', step === 1);
    if (step2Pane) step2Pane.classList.toggle('active', step === 2);
    if (step3Pane) step3Pane.classList.toggle('active', step === 3);

    // Tabs
    if (tab1) tab1.classList.toggle('active', step === 1);
    if (tab2) tab2.classList.toggle('active', step === 2);
    if (tab3) tab3.classList.toggle('active', step === 3);

    // Progress Bar Fill
    if (progressFill) {
      if (step === 1) progressFill.style.width = '33.33%';
      if (step === 2) progressFill.style.width = '66.66%';
      if (step === 3) progressFill.style.width = '100%';
    }

    // Action buttons display logic
    if (btnBack) {
      btnBack.style.visibility = step === 1 ? 'hidden' : 'visible';
    }

    if (step === 3) {
      if (btnNext) btnNext.style.display = 'none';
      if (btnSubmit) btnSubmit.style.display = 'inline-flex';
    } else {
      if (btnNext) btnNext.style.display = 'inline-flex';
      if (btnSubmit) btnSubmit.style.display = 'none';
    }

    updateMessage();
  }

  // Next / Back button clicks
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (wizardData.step < 3) {
        goToStep(wizardData.step + 1);
      }
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      if (wizardData.step > 1) {
        goToStep(wizardData.step - 1);
      }
    });
  }

  // Tabs direct clicks
  if (tab1) tab1.addEventListener('click', () => goToStep(1));
  if (tab2) tab2.addEventListener('click', () => goToStep(2));
  if (tab3) tab3.addEventListener('click', () => goToStep(3));

  // Initialize initial message
  updateMessage();
}

/* ==========================================================================
   6. Scroll Reveal Animations (IntersectionObserver)
   ========================================================================== */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}
