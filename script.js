const scroller = document.getElementById("master-canvas");
const sections = document.querySelectorAll(".card");
const progressBar = document.getElementById("progress-bar");
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbx_ksRnCz0bpcrNNt_SET0ONCMvhDoUAEh5oeDED0-NCrxLOf96gk3adlupfPPywLXQ/exec"; 

// CONFIGURACIÓN
let isThrottled = false; // Semáforo para evitar spam de scroll
const THROTTLE_DELAY = 700; // Milisegundos de espera entre slides (Ajustar a gusto)

// --- 1. SINCRONIZACIÓN DE UI (Barra y Clases Activas) ---
const updateUI = () => {
    const scrollLeft = scroller.scrollLeft;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const width = window.innerWidth;
    
    // Calcular índice actual (Redondeado)
    const currentIndex = Math.round(scrollLeft / width);
    
    // Barra de progreso
    if (maxScroll > 0) {
        const progress = (scrollLeft / maxScroll) * 100;
        progressBar.style.width = `${progress}%`;
    }

    // Clases Activas (Para animaciones CSS)
    sections.forEach((sec, index) => {
        if(index === currentIndex) {
            sec.classList.add("active-section");
        } else {
            sec.classList.remove("active-section");
        }
    });
};

// Escuchar evento de scroll nativo (optimizado)
scroller.addEventListener("scroll", () => {
    // Usamos requestAnimationFrame para rendimiento
    window.requestAnimationFrame(updateUI);
});

// Inicializar UI
updateUI();


// --- 2. LÓGICA DE DESKTOP (RUEDA DEL MOUSE - SCROLL Y -> X) ---
scroller.addEventListener("wheel", (evt) => {
    // Si el modal está abierto, permitimos scroll normal dentro del modal o ignoramos
    const modal = document.getElementById("modal");
    if(modal && modal.style.display === "flex") return;

    // Si es un trackpad moviéndose horizontalmente, dejamos que el navegador actúe nativamente
    if (Math.abs(evt.deltaX) > Math.abs(evt.deltaY)) return;

    // Prevenimos el scroll vertical predeterminado
    evt.preventDefault();

    if (isThrottled) return; // Si estamos en tiempo de espera, ignoramos

    const direction = evt.deltaY > 0 ? 1 : -1; // 1 = Bajar/Derecha, -1 = Subir/Izquierda
    const width = window.innerWidth;
    const currentScroll = scroller.scrollLeft;
    
    // Calculamos el siguiente punto de snap
    const nextScroll = currentScroll + (direction * width);

    scroller.scrollTo({
        left: nextScroll,
        behavior: "smooth"
    });

    // Activamos el semáforo
    isThrottled = true;
    setTimeout(() => {
        isThrottled = false;
    }, THROTTLE_DELAY);

}, { passive: false }); // 'passive: false' es vital para poder usar preventDefault


// --- 3. LÓGICA MÓVIL (GESTOS TÁCTILES) ---
// El CSS 'scroll-snap' maneja el swipe horizontal perfectamente.
// Solo agregamos soporte para SWIPE VERTICAL -> CAMBIO HORIZONTAL (tu requerimiento)

let touchStartY = 0;
let touchStartX = 0;

scroller.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
}, { passive: true });

scroller.addEventListener('touchmove', (e) => {
    if(isThrottled) return;

    const touchEndY = e.touches[0].clientY;
    const touchEndX = e.touches[0].clientX;

    const diffY = touchStartY - touchEndY;
    const diffX = touchStartX - touchEndX;

    // Si el movimiento es mayormente VERTICAL y significativo (>50px)
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
        
        // Bloqueamos scroll vertical nativo
        if (e.cancelable) e.preventDefault();

        const width = window.innerWidth;
        const currentScroll = scroller.scrollLeft;

        // diffY > 0 significa dedo hacia arriba (queremos ir al siguiente)
        const direction = diffY > 0 ? 1 : -1;
        
        scroller.scrollTo({
            left: currentScroll + (direction * width),
            behavior: "smooth"
        });

        isThrottled = true;
        setTimeout(() => isThrottled = false, THROTTLE_DELAY);
    }
}, { passive: false });


// --- 4. FORMULARIO Y MODAL (Mantenido y adaptado) ---
const mainForm = document.getElementById("mainForm");

const formHandler = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ENVIANDO...';
    btn.disabled = true;

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);

    // Envío a Google Sheets (sin esperar respuesta para UX rápida)
    fetch(GOOGLE_URL, { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data) 
    }).catch(err => console.error(err));

    // Redirección WhatsApp
    const msg = `Hola! Me interesa la promo Landing Page.%0A*Nombre:* ${data.name}%0A*Email:* ${data.email}`;
    
    setTimeout(() => {
        window.open(`https://wa.me/573154483584?text=${msg}`, "_blank");
        btn.innerHTML = originalText;
        btn.disabled = false;
        e.target.reset();
        closeModal();
    }, 1500);
};

if(mainForm) mainForm.addEventListener("submit", formHandler);

// Funciones globales para HTML onclick
window.openModal = function() {
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modal-content");
    const form = document.getElementById("mainForm");
    
    if(modal && form) {
        modal.style.display = "flex";
        modalContent.appendChild(form); // Movemos el form al modal
    }
}

window.closeModal = function() {
    const modal = document.getElementById("modal");
    const form = document.getElementById("mainForm");
    const desktopContainer = document.querySelector(".cta-form-container");
    
    if(modal) modal.style.display = "none";
    
    // Devolvemos el form a desktop si existe el contenedor (responsive switch)
    if(desktopContainer && form) {
        desktopContainer.appendChild(form);
    }
}