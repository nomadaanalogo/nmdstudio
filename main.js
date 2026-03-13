/* ============================================================
   NMD STUDIO — main.js
   ============================================================ */

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw9gKIkscpXoRfsFqkU6rrBm-wg0lHDd739xlIqqQVdz8mD83SoCk1w8owaoWpLyqhb/exec";

document.addEventListener("DOMContentLoaded", () => {
  initCursor();
  initMobileMenu();
  initScrollReveal();
  initContactForm();
});

/* ── 1. CURSOR PERSONALIZADO ── */
function initCursor() {
  // Solo activar en dispositivos no táctiles (desktop)
  if (window.innerWidth <= 900) return;

  const cur  = document.getElementById("cur");
  const curR = document.getElementById("curR");
  if (!cur || !curR) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  let cursorVisible = false;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx - 5 + "px";
    cur.style.top  = my - 5 + "px";

    if (!cursorVisible) {
      cur.style.opacity  = "1";
      curR.style.opacity = "1";
      cursorVisible = true;
    }
  });

  // Ocultar cuando el cursor sale de la ventana
  document.addEventListener("mouseleave", () => {
    cur.style.opacity  = "0";
    curR.style.opacity = "0";
    cursorVisible = false;
  });
  document.addEventListener("mouseenter", () => {
    cur.style.opacity  = "1";
    curR.style.opacity = "1";
    cursorVisible = true;
  });

  (function loop() {
    rx += (mx - rx - 17) * 0.12;
    ry += (my - ry - 17) * 0.12;
    curR.style.left = rx + "px";
    curR.style.top  = ry + "px";
    requestAnimationFrame(loop);
  })();

  const hoverTargets = "button, a, .svc-card, .step, .phil-item, input, select, textarea";
  document.querySelectorAll(hoverTargets).forEach((el) => {
    el.addEventListener("mouseenter", () => { cur.classList.add("hov"); curR.classList.add("hov"); });
    el.addEventListener("mouseleave", () => { cur.classList.remove("hov"); curR.classList.remove("hov"); });
  });
}

/* ── 2. MENÚ MOBILE ── */
function initMobileMenu() {
  const ham = document.getElementById("hamburger");
  const mob = document.getElementById("mobileMenu");
  if (!ham || !mob) return;

  let open = false;

  function toggleMenu() {
    open = !open;
    mob.style.display = open ? "flex" : "none";
    setTimeout(() => { if (open) mob.classList.add("open"); }, 10);
    if (!open) mob.classList.remove("open");

    const spans = ham.querySelectorAll("span");
    spans[0].style.transform = open ? "translateY(6.5px) rotate(45deg)"  : "";
    spans[1].style.opacity   = open ? "0" : "1";
    spans[2].style.transform = open ? "translateY(-6.5px) rotate(-45deg)" : "";
    document.body.style.overflow = open ? "hidden" : "";
  }

  ham.addEventListener("click", toggleMenu);
  document.querySelectorAll(".mob-link, .mob-cta").forEach((el) =>
    el.addEventListener("click", () => { if (open) toggleMenu(); })
  );
}

/* ── 3. SCROLL REVEAL ── */
function initScrollReveal() {
  const obs = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("vis"); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
}

/* ── 4. FORMULARIO DE CONTACTO ── */
function initContactForm() {
  const form     = document.getElementById("contactForm");
  const btn      = document.getElementById("submitBtn");
  const feedback = document.getElementById("formFeedback");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Estado: cargando
    setLoading(true);
    hideFeedback();

    const payload = {
      name:        form.name.value.trim(),
      email:       form.email.value.trim(),
      whatsapp:    form.whatsapp.value.trim(),
      business:    form.business.value.trim(),
      projectType: form.projectType.value,
      message:     form.message.value.trim(),
    };

    try {
      // Google Apps Script requiere no-cors para evitar bloqueo CORS
      await fetch(SCRIPT_URL, {
        method:  "POST",
        mode:    "no-cors",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      // no-cors no devuelve body legible → si no lanzó error, asumimos éxito
      showFeedback("success",
        "✦ ¡Solicitud enviada! Te contactamos en menos de 24 horas por WhatsApp."
      );
      form.reset();

    } catch (err) {
      console.error("Error al enviar:", err);
      showFeedback("error-msg",
        "Hubo un error al enviar. Escribinos directamente a WhatsApp 👇"
      );
    } finally {
      setLoading(false);
    }
  });

  /* ── Validación ── */
  function validateForm() {
    let valid = true;
    clearErrors();

    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const wa      = form.whatsapp.value.trim();
    const biz     = form.business.value.trim();
    const type    = form.projectType.value;
    const message = form.message.value.trim();

    if (!name || name.length < 2)
      setError("name", "Ingresá tu nombre completo"), (valid = false);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      setError("email", "Email inválido"), (valid = false);

    if (!wa || wa.replace(/\D/g, "").length < 7)
      setError("whatsapp", "Ingresá un número válido"), (valid = false);

    if (!biz)
      setError("business", "Contanos cómo se llama tu negocio"), (valid = false);

    if (!type)
      setError("projectType", "Seleccioná una opción"), (valid = false);

    if (!message || message.length < 10)
      setError("message", "Contanos un poco más (mínimo 10 caracteres)"), (valid = false);

    return valid;
  }

  function setError(fieldName, msg) {
    const input = form[fieldName];
    const errEl = document.getElementById("err-" + fieldName);
    if (input) input.classList.add("error");
    if (errEl) { errEl.textContent = msg; errEl.classList.add("show"); }
  }

  function clearErrors() {
    form.querySelectorAll("input, select, textarea").forEach((el) =>
      el.classList.remove("error")
    );
    form.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = ""; el.classList.remove("show");
    });
  }

  function setLoading(state) {
    btn.disabled = state;
    btn.classList.toggle("loading", state);
    btn.querySelector(".btn-text").textContent = state
      ? "Enviando..."
      : "✦ Enviar solicitud";
  }

  function showFeedback(type, msg) {
    feedback.className = "form-feedback " + type;
    feedback.textContent = msg;
  }

  function hideFeedback() {
    feedback.className = "form-feedback";
    feedback.textContent = "";
  }
}
