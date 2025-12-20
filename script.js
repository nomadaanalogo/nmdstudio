const canvas = document.getElementById('master-canvas');
const sections = document.querySelectorAll('section');
const bar = document.getElementById('progress-bar');
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbx_ksRnCz0bpcrNNt_SET0ONCMvhDoUAEh5oeDED0-NCrxLOf96gk3adlupfPPywLXQ/exec"; 

// --- 1. LÓGICA DE ANIMACIÓN OPTIMIZADA (requestAnimationFrame) ---
// Esto evita que el iPhone se "atragante" calculando demasiadas veces por segundo.
let lastKnownScrollPosition = 0;
let ticking = false;

function doSomething(scrollPos) {
    const maxScroll = document.body.offsetHeight - window.innerHeight;
    // Evitamos división por cero si maxScroll es 0
    if (maxScroll <= 0) return;

    const scrollFraction = scrollPos / maxScroll;
    const safeFraction = Math.min(Math.max(scrollFraction, 0), 1);
    
    // Usamos translate3d para forzar aceleración por hardware (GPU) en iPhone
    const translateX = safeFraction * (sections.length - 1) * 100;
    canvas.style.transform = `translate3d(-${translateX}vw, 0, 0)`;
    
    bar.style.width = `${safeFraction * 100}%`;

    const currentIdx = Math.round(safeFraction * (sections.length - 1));
    sections.forEach((s, i) => {
        if (i === currentIdx) {
            if (!s.classList.contains('active-section')) s.classList.add('active-section');
        } else {
            if (s.classList.contains('active-section')) s.classList.remove('active-section');
        }
    });
}

window.addEventListener('scroll', function(e) {
  lastKnownScrollPosition = window.scrollY;

  if (!ticking) {
    window.requestAnimationFrame(function() {
      doSomething(lastKnownScrollPosition);
      ticking = false;
    });

    ticking = true;
  }
});

// --- 2. DETECTOR DE SCROLL HORIZONTAL (Mouse/Touchpad) ---
window.addEventListener("wheel", (e) => {
    // Solo intervenimos si es un scroll claramente horizontal para no bloquear el vertical nativo
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        window.scrollBy(0, e.deltaX);
    }
}, { passive: false });


// --- 3. DETECTOR TÁCTIL (Mejorado para inercia) ---
// N.B. Reintroducing touch logic to handle horizontal swipes
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 50; // Minimum pixels for a swipe to be recognized

window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true }); // Use passive to avoid blocking scroll if not a swipe

window.addEventListener('touchmove', (e) => {
    const touchMoveX = e.touches[0].clientX;
    const touchMoveY = e.touches[0].clientY;
    const diffX = touchStartX - touchMoveX;
    const diffY = touchStartY - touchMoveY;

    // If it's primarily a horizontal movement
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) { // Small threshold to detect initial horizontal drag
        e.preventDefault(); // Prevent vertical scrolling for horizontal swipes
    }
}, { passive: false }); // Needs to be non-passive to call preventDefault

window.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;

    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
        const sectionHeight = window.innerHeight;
        const currentScrollPosition = window.scrollY;
        const currentSectionIndex = Math.round(currentScrollPosition / sectionHeight);

        if (diffX > 0) { // Swipe left (next section)
            // Ensure we don't go past the last section
            if (currentSectionIndex < sections.length - 1) {
                window.scrollTo({
                    top: (currentSectionIndex + 1) * sectionHeight,
                    behavior: 'smooth'
                });
            }
        } else { // Swipe right (previous section)
            // Ensure we don't go before the first section
            if (currentSectionIndex > 0) {
                window.scrollTo({
                    top: (currentSectionIndex - 1) * sectionHeight,
                    behavior: 'smooth'
                });
            }
        }
    }
});


// --- 4. SNAP EFFECT ELIMINADO ---
// IMPORTANTE: He quitado el bloque "SNAP EFFECT". 
// En iPhone, forzar el scroll mediante JS interrumpe la inercia natural (momentum scrolling)
// y hace que la página parezca trabada. Es mejor dejar que el usuario fluya libremente.


// --- 5. FORMULARIO & MODAL ---
const formHandler = async (e) => {
    e.preventDefault();
    
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Enviando...';
    btn.disabled = true;

    if(GOOGLE_URL.includes("http")) {
        try { 
            await fetch(GOOGLE_URL, { 
                method: 'POST', 
                mode: 'no-cors', 
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(data) 
            }); 
        } catch(error){
            console.error("Error envío:", error);
        }
    }

    const msg = `Hola! Vi la landing de alto impacto y quiero una igual.%0A*Nombre:* ${data.name}%0A*WhatsApp:* ${data.phone}`;
    window.open(`https://wa.me/573154483584?text=${msg}`, '_blank');
    
    btn.innerHTML = originalText;
    btn.disabled = false;
    e.target.reset(); 
    closeModal();    
};

const mainForm = document.getElementById('mainForm');
if(mainForm) {
    mainForm.addEventListener('submit', formHandler);
}

function openModal() {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const form = document.getElementById('mainForm');
    
    modal.style.display = 'flex'; 
    // Movemos el formulario al modal
    modalContent.appendChild(form);
    
    // Aseguramos que el formulario sea visible (por si estaba oculto en mobile)
    form.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('modal');
    const form = document.getElementById('mainForm');
    const desktopContainer = document.querySelector('.cta-form');
    
    modal.style.display = 'none';
    
    // Devolvemos el formulario a su lugar original
    if(desktopContainer) {
        desktopContainer.appendChild(form);
        // Restauramos el display original (flex en desktop, o block, según CSS)
        form.style.display = ''; 
    }
}
