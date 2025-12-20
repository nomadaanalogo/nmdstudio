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
// Eliminamos la lógica táctil compleja anterior porque causaba conflictos con el scroll nativo.
// Al usar el body de 400vh, el scroll táctil nativo funciona mejor por sí solo.


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