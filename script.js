const sections = document.querySelectorAll("section");
const stickyContainer = document.querySelector(".sticky-container");
const bar = document.getElementById("progress-bar");
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbx_ksRnCz0bpcrNNt_SET0ONCMvhDoUAEh5oeDED0-NCrxLOf96gk3adlupfPPywLXQ/exec"; 

// --- 1. DETECTOR DE SECCIÓN ACTIVA ---
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

// --- 2. BARRA DE PROGRESO (Barra superior) ---
stickyContainer.addEventListener("scroll", () => {
    const scrollLeft = stickyContainer.scrollLeft;
    const scrollWidth = stickyContainer.scrollWidth - stickyContainer.clientWidth;
    if (scrollWidth > 0) {
        const scrollProgress = (scrollLeft / scrollWidth) * 100;
        bar.style.width = `${scrollProgress}%`;
    }
});

// --- 3. SCROLL UNIVERSAL (LA MAGIA) ---
// Escuchamos en toda la ventana para que no falle nunca
window.addEventListener("wheel", (evt) => {
    // Si hay un modal abierto, no hacemos scroll horizontal
    if(document.getElementById("modal").style.display === "flex") return;

    const container = document.querySelector(".sticky-container");
    if (!container) return;

    // A. ¿El usuario está deslizando horizontalmente con trackpad? -> DEJAR NATIVO
    // Comparamos el movimiento X vs Y. Si X es mayor, es intención horizontal.
    if (Math.abs(evt.deltaX) > Math.abs(evt.deltaY)) {
        return; 
    }

    // B. ¿Es rueda del mouse o gesto vertical? -> CONVERTIR A HORIZONTAL
    evt.preventDefault();
    
    // Multiplicador de velocidad (ajústalo si lo sientes lento o rápido)
    const velocidad = 2.5; 

    container.scrollBy({
        left: evt.deltaY * velocidad,
        behavior: "auto" // 'auto' es mejor que 'smooth' aquí para respuesta instantánea
    });

}, { passive: false });


// --- 4. FORMULARIO & MODAL ---
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
    
    modal.style.display = "flex"; 
    modalContent.appendChild(form);
    form.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("modal");
    const form = document.getElementById("mainForm");
    const desktopContainer = document.querySelector(".cta-form");
    
    modal.style.display = "none";
    
    if(desktopContainer) {
        desktopContainer.appendChild(form);
        form.style.display = ""; 
    }
}

// --- 5. HACK PARA MÓVILES: SWIPE VERTICAL -> SCROLL HORIZONTAL ---
let touchStartY = 0;
let touchStartX = 0;

stickyContainer.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
}, { passive: true });

stickyContainer.addEventListener('touchmove', (e) => {
    if (!touchStartY || !touchStartX) return;

    const touchEndY = e.touches[0].clientY;
    const touchEndX = e.touches[0].clientX;

    const diffY = touchStartY - touchEndY; // Cuánto movió el dedo verticalmente
    const diffX = touchStartX - touchEndX; // Cuánto movió el dedo horizontalmente

    // Si el movimiento es mayormente VERTICAL (el usuario quiere bajar/subir)
    // y es más significativo que el movimiento horizontal...
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
        
        // Movemos el scroll horizontalmente usando la diferencia vertical
        // Multiplicamos por 1.5 para que se sienta ágil
        stickyContainer.scrollLeft += diffY * 1.5;
        
        // Prevenir el comportamiento nativo (evitar recargar página o rebotes raros)
        if (e.cancelable) e.preventDefault();
        
        // Actualizamos la posición de inicio para que el movimiento sea continuo
        touchStartY = touchEndY;
    }
}, { passive: false });