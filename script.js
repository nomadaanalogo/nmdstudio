const canvas = document.getElementById("master-canvas");
const sections = document.querySelectorAll("section");
const stickyContainer = document.querySelector(".sticky-container");
const bar = document.getElementById("progress-bar");

const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbx_ksRnCz0bpcrNNt_SET0ONCMvhDoUAEh5oeDED0-NCrxLOf96gk3adlupfPPywLXQ/exec"; 

// --- VARIABLES DE CONTROL DE SCROLL (Card a Card) ---
let currentSectionIndex = 0; // Índice actual (0, 1, 2, 3)
let isScrolling = false;     // Semáforo para bloquear spam de scroll
const totalSections = sections.length;

// --- 1. FUNCIÓN MAESTRA DE MOVIMIENTO ---
function scrollToSection(index) {
    // Validar que el índice exista (no ir menos de 0 ni más del total)
    if (index < 0 || index >= totalSections) return;

    isScrolling = true; // Bloqueamos nuevos inputs
    currentSectionIndex = index; // Actualizamos dónde estamos

    // Calculamos a qué pixel movernos (Ancho de pantalla * número de sección)
    const targetLeft = window.innerWidth * index;

    stickyContainer.scrollTo({
        left: targetLeft,
        behavior: "smooth"
    });

    // Esperamos 800ms (tiempo aprox de la animación) antes de permitir otro movimiento
    setTimeout(() => {
        isScrolling = false;
    }, 800);
}

// --- 2. DETECTOR DE SECCIÓN ACTIVA (VISUAL) ---
const observerOptions = {
    root: stickyContainer,
    rootMargin: "0px",
    threshold: 0.5 
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active-section");
        } else {
            entry.target.classList.remove("active-section");
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

// --- 3. BARRA DE PROGRESO Y SINCRONIZACIÓN ---
stickyContainer.addEventListener("scroll", () => {
    // Actualizamos la barra
    const scrollLeft = stickyContainer.scrollLeft;
    const scrollWidth = stickyContainer.scrollWidth - stickyContainer.clientWidth;
    if (scrollWidth > 0 && bar) {
        const scrollProgress = (scrollLeft / scrollWidth) * 100;
        bar.style.width = `${scrollProgress}%`;
    }

    // Si el usuario mueve el scroll nativamente (trackpad horizontal),
    // actualizamos nuestro índice para no perdernos.
    if (!isScrolling) {
        currentSectionIndex = Math.round(stickyContainer.scrollLeft / window.innerWidth);
    }
});

// --- 4. SCROLL EN PC (RUEDA DEL MOUSE) ---
window.addEventListener("wheel", (evt) => {
    // Si el modal está abierto, no hacer nada
    const modal = document.getElementById("modal");
    if (modal && modal.style.display === "flex") return;

    if (isScrolling) return; // Si ya se está moviendo, ignorar

    // Si es scroll horizontal nativo (Trackpad izquierda/derecha), dejarlo pasar
    if (Math.abs(evt.deltaX) > Math.abs(evt.deltaY)) {
        return; 
    }

    // Si es vertical (Rueda), convertir a PASOS
    evt.preventDefault();

    if (evt.deltaY > 0) {
        // Rueda abajo -> Siguiente
        scrollToSection(currentSectionIndex + 1);
    } else {
        // Rueda arriba -> Anterior
        scrollToSection(currentSectionIndex - 1);
    }
}, { passive: false });

// --- 5. SCROLL EN MÓVIL (TOUCH VERTICAL -> PASOS) ---
let touchStartY = 0;
let touchStartX = 0;

stickyContainer.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    
    // Sincronizar índice por seguridad
    currentSectionIndex = Math.round(stickyContainer.scrollLeft / window.innerWidth);
}, { passive: true });

stickyContainer.addEventListener('touchmove', (e) => {
    if (isScrolling) return;

    const touchEndY = e.touches[0].clientY;
    const touchEndX = e.touches[0].clientX;

    const diffY = touchStartY - touchEndY; // Diferencia Vertical
    const diffX = touchStartX - touchEndX; // Diferencia Horizontal

    // Lógica: Si el movimiento es Vertical (más Y que X) y es largo (> 50px)
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
        
        if (e.cancelable) e.preventDefault(); // Evitar scroll nativo vertical

        if (diffY > 0) {
            // Dedo hacia arriba (queremos bajar) -> Siguiente
            scrollToSection(currentSectionIndex + 1);
        } else {
            // Dedo hacia abajo (queremos subir) -> Anterior
            scrollToSection(currentSectionIndex - 1);
        }
    }
}, { passive: false });


// --- 6. FORMULARIO & MODAL ---
const formHandler = async (e) => {
    e.preventDefault();
    
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    
    const btn = e.target.querySelector("button");
    const originalText = btn.innerHTML;
    btn.innerHTML = "Enviando...";
    btn.disabled = true;

    if(GOOGLE_URL.includes("http")) {
        try { 
            await fetch(GOOGLE_URL, { 
                method: "POST", 
                mode: "no-cors", 
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(data) 
            }); 
        } catch(error){
            console.error("Error envío:", error);
        }
    }

    const msg = `Hola! Vi la landing de alto impacto y quiero una igual.%0A*Nombre:* ${data.name}%0A*WhatsApp:* ${data.phone}`;
    window.open(`https://wa.me/573154483584?text=${msg}`, "_blank");
    
    btn.innerHTML = originalText;
    btn.disabled = false;
    e.target.reset(); 
    closeModal();    
};

const mainForm = document.getElementById("mainForm");
if(mainForm) {
    mainForm.addEventListener("submit", formHandler);
}

function openModal() {
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modal-content");
    const form = document.getElementById("mainForm");
    
    if(modal && modalContent && form) {
        modal.style.display = "flex"; 
        modalContent.appendChild(form);
        form.style.display = "flex";
    }
}

function closeModal() {
    const modal = document.getElementById("modal");
    const form = document.getElementById("mainForm");
    const desktopContainer = document.querySelector(".cta-form");
    
    if(modal) modal.style.display = "none";
    
    // Devolver el form a su lugar original si estamos en desktop
    if(desktopContainer && form) {
        desktopContainer.appendChild(form);
        form.style.display = ""; 
    }
}