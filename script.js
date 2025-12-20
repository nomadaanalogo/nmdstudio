const canvas = document.getElementById("master-canvas");
const sections = document.querySelectorAll("section");
const stickyContainer = document.querySelector(".sticky-container"); // Get the scrolling container
const bar = document.getElementById("progress-bar"); // Keep for now, but its functionality is removed

const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbx_ksRnCz0bpcrNNt_SET0ONCMvhDoUAEh5oeDED0-NCrxLOf96gk3adlupfPPywLXQ/exec"; 

// --- 1. LÓGICA DE ANIMACIÓN (IntersectionObserver para active-section) ---
const observerOptions = {
    root: stickyContainer, // Observe intersections within the scrolling container
    rootMargin: "0px",
    threshold: 0.5 // Trigger when 50% of the section is visible
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

// --- 2. BARRA DE PROGRESO (Adaptada a scroll horizontal) ---
// This will update the progress bar based on horizontal scroll
stickyContainer.addEventListener("scroll", () => {
    const scrollLeft = stickyContainer.scrollLeft;
    const scrollWidth = stickyContainer.scrollWidth - stickyContainer.clientWidth;
    if (scrollWidth > 0) {
        const scrollProgress = (scrollLeft / scrollWidth) * 100;
        bar.style.width = `${scrollProgress}%`;
    } else {
        bar.style.width = "0%";
    }
});


// --- 3. FORMULARIO & MODAL ---
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
    // Movemos el formulario al modal
    modalContent.appendChild(form);
    
    // Aseguramos que el formulario sea visible (por si estaba oculto en mobile)
    form.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("modal");
    const form = document.getElementById("mainForm");
    const desktopContainer = document.querySelector(".cta-form");
    
    modal.style.display = "none";
    
    // Devolvemos el formulario a su lugar original
    if(desktopContainer) {
        desktopContainer.appendChild(form);
        // Restauramos el display original (flex en desktop, o block, según CSS)
        form.style.display = ""; 
    }
}
