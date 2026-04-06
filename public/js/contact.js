document.addEventListener("DOMContentLoaded", () => {

  const API_URL = "/api/contact";

  /* ══════════════════════════════════════════
     NAVBAR
  ══════════════════════════════════════════ */
  const navbar    = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu= document.getElementById("mobileMenu");

  window.addEventListener("scroll", () => navbar.classList.toggle("scrolled", window.scrollY > 20));

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    mobileMenu.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
      hamburger.classList.remove("open");
      mobileMenu.classList.remove("open");
    }
  });

  /* ══════════════════════════════════════════
     USER AREA
  ══════════════════════════════════════════ */
  const token      = localStorage.getItem("token");
  const area       = document.getElementById("userArea");
  const mobileAuth = document.getElementById("mobileAuth");

  if (!token) {
    area.innerHTML = `
      <a href="/pages/login.html"    class="btn-nav">Login</a>
      <a href="/pages/register.html" class="btn-nav filled">Register</a>`;
    mobileAuth.innerHTML = `
      <a href="/pages/login.html"    class="btn-nav" style="flex:1;text-align:center">Login</a>
      <a href="/pages/register.html" class="btn-nav filled" style="flex:1;text-align:center">Register</a>`;
  } else {
    let user = null;
    try { user = JSON.parse(atob(token.split(".")[1])); } catch {}
    area.innerHTML = `
      <span style="font-size:.84rem;color:var(--muted-lt)">Hi, ${user?.name?.split(" ")[0] || "there"} 👋</span>
      <button class="btn-nav" onclick="localStorage.removeItem('token');location.reload()">Logout</button>`;
    mobileAuth.innerHTML = `
      <button class="btn-nav" onclick="localStorage.removeItem('token');location.reload()" style="flex:1;text-align:center">Logout</button>`;

    // Pre-fill name + email if logged in
    if (user?.name)  document.getElementById("cf-name").value  = user.name;
    if (user?.email) document.getElementById("cf-email").value = user.email;
  }

  /* ══════════════════════════════════════════
     SCROLL REVEAL
  ══════════════════════════════════════════ */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("visible"), i * 80);
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));

  /* ══════════════════════════════════════════
     CHARACTER COUNTER
  ══════════════════════════════════════════ */
  const msgArea  = document.getElementById("cf-message");
  const charCount= document.getElementById("charCount");

  msgArea.addEventListener("input", () => {
    const len = msgArea.value.length;
    charCount.textContent = len;
    charCount.style.color = len > 900 ? "var(--red)" : len > 700 ? "var(--yellow)" : "var(--muted)";
    if (len > 1000) msgArea.value = msgArea.value.slice(0, 1000);
  });

  /* ══════════════════════════════════════════
     FAQ ACCORDION
  ══════════════════════════════════════════ */
  window.toggleFaq = (btn) => {
    const answer = btn.nextElementSibling;
    const isOpen = btn.classList.contains("open");

    // Close all
    document.querySelectorAll(".faq-q.open").forEach(q => {
      q.classList.remove("open");
      q.nextElementSibling.classList.remove("open");
    });

    // Open clicked if it was closed
    if (!isOpen) {
      btn.classList.add("open");
      answer.classList.add("open");
    }
  };

  /* ══════════════════════════════════════════
     FORM VALIDATION
  ══════════════════════════════════════════ */
  function validate() {
    let valid = true;

    const fields = [
      { id: "cf-name",    errId: "err-name",    check: v => v.trim().length >= 2,          msg: "Name must be at least 2 characters" },
      { id: "cf-email",   errId: "err-email",   check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: "Enter a valid email address" },
      { id: "cf-subject", errId: "err-subject", check: v => v.trim().length >= 3,          msg: "Subject must be at least 3 characters" },
    ];

    fields.forEach(({ id, errId, check, msg }) => {
      const el  = document.getElementById(id);
      const err = document.getElementById(errId);
      const val = el.value;

      if (!check(val)) {
        err.textContent = msg;
        el.classList.add("invalid");
        shakeField(el);
        valid = false;
      } else {
        err.textContent = "";
        el.classList.remove("invalid");
      }
    });

    // Message
    const msgVal = msgArea.value.trim();
    const msgErr = document.getElementById("err-message");
    if (msgVal.length < 10) {
      msgErr.textContent = "Message must be at least 10 characters";
      msgArea.classList.add("invalid");
      shakeField(msgArea);
      valid = false;
    } else {
      msgErr.textContent = "";
      msgArea.classList.remove("invalid");
    }

    return valid;
  }

  function shakeField(el) {
    const wrap = el.closest(".field-wrap") || el;
    wrap.classList.remove("shake");
    void wrap.offsetWidth; // reflow
    wrap.classList.add("shake");
    setTimeout(() => wrap.classList.remove("shake"), 500);
  }

  // Live clear error on input
  ["cf-name","cf-email","cf-subject"].forEach(id => {
    document.getElementById(id).addEventListener("input", function () {
      this.classList.remove("invalid");
      const errId = "err-" + id.replace("cf-", "");
      const errEl = document.getElementById(errId);
      if (errEl) errEl.textContent = "";
    });
  });

  msgArea.addEventListener("input", () => {
    msgArea.classList.remove("invalid");
    document.getElementById("err-message").textContent = "";
  });

  /* ══════════════════════════════════════════
     FORM SUBMIT
  ══════════════════════════════════════════ */
  const form   = document.getElementById("contactForm");
  const btn    = document.getElementById("submitBtn");
  const formMsg= document.getElementById("formMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formMsg.className = "form-msg";
    formMsg.style.display = "none";

    if (!validate()) return;

    setLoading(true);

    const payload = {
      name:     document.getElementById("cf-name").value.trim(),
      email:    document.getElementById("cf-email").value.trim(),
      subject:  document.getElementById("cf-subject").value.trim(),
      category: document.getElementById("cf-category").value,
      message:  msgArea.value.trim(),
    };

    try {
      const res  = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showFormMsg(data.message || "Something went wrong. Please try again.", "error");
        setLoading(false);
        return;
      }

      showFormMsg("✅ Message sent! We'll get back to you within 24 hours.", "success");
      form.reset();
      charCount.textContent = "0";
      setLoading(false);

    } catch (err) {
      console.error(err);
      showFormMsg("Server error. Please try again later.", "error");
      setLoading(false);
    }
  });

  function setLoading(state) {
    btn.disabled = state;
    btn.classList.toggle("loading", state);
  }

  function showFormMsg(text, type) {
    formMsg.textContent  = text;
    formMsg.className    = `form-msg ${type}`;
    formMsg.style.display = "block";
    formMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});