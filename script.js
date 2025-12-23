const scroller = document.getElementById("master-canvas");
const sections = document.querySelectorAll(".card");
const progressBar = document.getElementById("progress-bar");
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbx_ksRnCz0bpcrNNt_SET0ONCMvhDoUAEh5oeDED0-NCrxLOf96gk3adlupfPPywLXQ/exec"; 

// --- VARIABLES DE CONTROL ---
let currentIndex = 0;           
let isLocked = false;           // Semáforo de bloqueo
const COOLDOWN_MS = 1000;       // Tiempo de silencio obligatorio tras cambiar slide

// VARIABLES EXCLUSIVAS PARA PC (El "Cubo")
let wheelAccumulator = 0;       // Aquí acumulamos la intención de scroll
const WHEEL_THRESHOLD = 80;     // Cuánto hay que scrollear para que la página reaccione (Ajustable)
let accumulatorResetTimer = null; // Para limpiar el acumulador si el usuario se detiene

// --- 1. SINCRONIZACIÓN VISUAL (Barra y Clases) ---
const updateUI = () => {
    // Si estamos en animación controlada (bloqueados), NO actualizamos el índice
    // leyendo el DOM. Confiamos en nuestra variable 'currentIndex'.
    // Esto evita que si scrolleas rápido mientras se mueve, calcule mal la posición.
    if (!isLocked) {
        currentIndex = Math.round(scroller.scrollLeft / window.innerWidth);
    }

    // Barra de progreso
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    if (maxScroll > 0) {
        const progress = (scroller.scrollLeft / maxScroll) * 100;
        if(progressBar) progressBar.style.width = `${progress}%`;
    }

    // Clases Activas
    sections.forEach((sec, index) => {
        if(index === currentIndex) {
            sec.classList.add("active-section");
        } else {
            sec.classList.remove("active-section");
        }
    });
};

scroller.addEventListener("scroll", () => window.requestAnimationFrame(updateUI));

// --- 2. FUNCIÓN DE MOVIMIENTO ---
function goToSection(index) {
    // Validar límites
    if (index < 0 || index >= sections.length) return;

    isLocked = true;   // 1. Bloqueamos inputs
    currentIndex = index; 

    // Mover pantalla
    scroller.scrollTo({
        left: window.innerWidth * index,
        behavior: "smooth"
    });

    // 2. Reiniciar acumuladores de PC para que no salte de nuevo por inercia
    wheelAccumulator = 0;

    // 3. Desbloquear después de que termine la animación
    setTimeout(() => {
        isLocked = false;
    }, COOLDOWN_MS);
}


// --- 3. LÓGICA PC (SOLUCIÓN DEFINITIVA DE SALTOS) ---
window.addEventListener("wheel", (evt) => {
    const modal = document.getElementById("modal");
    if(modal && modal.style.display === "flex") return;

    // A. Si es scroll horizontal nativo (Trackpad izquierda/derecha), DEJAR PASAR.
    if (Math.abs(evt.deltaX) > Math.abs(evt.deltaY)) return;

    // B. Si es vertical, tomamos el control.
    evt.preventDefault(); 

    // C. Si estamos bloqueados (animando), ignoramos la inercia del mouse.
    if (isLocked) return;

    // D. ACUMULADOR (EL FIX):
    // En lugar de movernos al detectar '1' de movimiento, sumamos el valor.
    wheelAccumulator += evt.deltaY;

    // Si el usuario deja de scrollear por 200ms, reiniciamos el acumulador a 0.
    // Esto evita que scrolles un poquito ahora y un poquito en 10 segundos y salte solo.
    clearTimeout(accumulatorResetTimer);
    accumulatorResetTimer = setTimeout(() => {
        wheelAccumulator = 0;
    }, 200);

    // E. DISPARADOR
    // Solo si el acumulador supera el UMBRAL (80), nos movemos.
    // Esto filtra vibraciones y toques accidentales.
    if (wheelAccumulator > WHEEL_THRESHOLD) {
        // Rueda Abajo -> Siguiente
        goToSection(currentIndex + 1);
    } else if (wheelAccumulator < -WHEEL_THRESHOLD) {
        // Rueda Arriba -> Anterior
        goToSection(currentIndex - 1);
    }

}, { passive: false });


// --- 4. LÓGICA MÓVIL (TOUCH - SIN CAMBIOS, PERFECTA) ---
let touchStartY = 0;
let touchStartX = 0;

scroller.addEventListener('touchstart', (e) => {
    if(isLocked) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
}, { passive: true });

scroller.addEventListener('touchmove', (e) => {
    if (isLocked) return;

    const touchEndY = e.touches[0].clientY;
    const touchEndX = e.touches[0].clientX;

    const diffY = touchStartY - touchEndY;
    const diffX = touchStartX - touchEndX;

    // Detección de Swipe Vertical estricto
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
        if (e.cancelable) e.preventDefault();
        
        touchStartY = touchEndY; // Resetear ancla
        
        if (diffY > 0) {
            goToSection(currentIndex + 1);
        } else {
            goToSection(currentIndex - 1);
        }
    }
}, { passive: false });

// --- 5. RESIZE ---
window.addEventListener('resize', () => {
    scroller.scrollTo({
        left: window.innerWidth * currentIndex,
        behavior: "auto"
    });
});

// --- 6. FORMULARIOS (Igual que antes) ---
// --- 6. FORMULARIOS (CORREGIDO PARA GARANTIZAR ENVÍO) ---
const mainForm = document.getElementById("mainForm");
if(mainForm) {
    mainForm.addEventListener("submit", (e) => { // Quitamos 'async' porque no vamos a pausar
        e.preventDefault();
        
        const btn = e.target.querySelector("button");
        const originalText = btn.innerHTML;
        
        btn.innerHTML = 'ABRIENDO WHATSAPP...';
        btn.disabled = true;

        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);

        // 1. FETCH CON KEEPALIVE
        // Esto le dice al navegador: "Envía esto sí o sí, aunque yo me vaya de la página"
        fetch(GOOGLE_URL, { 
            method: "POST", 
            mode: "no-cors", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            keepalive: true  // <--- ESTA ES LA CLAVE MÁGICA
        }).catch(console.error);

        // 2. REDIRECCIÓN INMEDIATA
        // Al no haber 'await' ni 'setTimeout', el móvil permite abrir la app
        const msg = `Hola! Me interesa la promo Landing Page.%0A*Nombre:* ${data.name}`;
        window.location.href = `https://wa.me/573154483584?text=${msg}`;

        // 3. Limpieza visual (por si el usuario vuelve atrás)
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            e.target.reset();
            closeModal();
        }, 1000);
    });
}