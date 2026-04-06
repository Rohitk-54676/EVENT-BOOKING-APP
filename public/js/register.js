const form    = document.getElementById("registerForm");
const msg     = document.getElementById("msg");
const btn     = document.getElementById("submitBtn");

const API_URL = "/api/auth";

/* ── Password strength meter ── */
document.getElementById("password").addEventListener("input", function () {
  updateStrength(this.value);
});

function updateStrength(val) {
  const segs = ["s1","s2","s3","s4"].map(id => document.getElementById(id));
  segs.forEach(s => s.className = "strength-segment");

  if (!val) return;

  let score = 0;
  if (val.length >= 6)                         score++;
  if (val.length >= 10)                        score++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val))               score++;

  const labels = ["weak","fair","good","strong"];
  for (let i = 0; i < score; i++) {
    segs[i].classList.add(labels[Math.min(score - 1, 3)]);
  }
}

/* ── Toggle password visibility ── */
function togglePass(inputId, toggleBtn) {
  const input = document.getElementById(inputId);
  const show  = input.type === "password";
  input.type  = show ? "text" : "password";
  toggleBtn.innerHTML = show
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

/* ── Submit ── */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const userData = {
    name:     getValue("name"),
    email:    getValue("email"),
    phone:    getValue("phone"),
    password: getValue("password"),
  };

  if (!userData.name)                              return showError("Name is required",              "name");
  if (!validateEmail(userData.email))              return showError("Enter a valid email",            "email");
  if (!/^[0-9]{10}$/.test(userData.phone))         return showError("Phone must be 10 digits",       "phone");
  if (userData.password.length < 6)               return showError("Password must be at least 6 characters", "password");

  setLoading(true);

  try {
    const res  = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Something went wrong", "var(--error)");
      if (data.redirect === "login") {
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
      }
      setLoading(false);
      return;
    }

    localStorage.setItem("verifyEmail", userData.email);
    showMessage("OTP sent! Redirecting…", "var(--success)");
    setTimeout(() => { window.location.href = "verify-otp.html"; }, 1200);

  } catch (err) {
    console.error(err);
    showMessage("Server error. Try again later.", "var(--error)");
    setLoading(false);
  }
});

/* ── Helpers ── */
function getValue(id) { return document.getElementById(id).value.trim(); }

function showError(message, fieldId) {
  showMessage(message, "var(--error)");
  const grp = document.getElementById(fieldId).closest(".input-group");
  grp.classList.add("shake");
  document.getElementById(fieldId).style.borderColor = "var(--error)";
  setTimeout(() => {
    grp.classList.remove("shake");
    document.getElementById(fieldId).style.borderColor = "";
  }, 2000);
  setLoading(false);
}

function showMessage(text, color) {
  msg.textContent  = text;
  msg.style.color  = color;
}

function setLoading(state) {
  btn.disabled = state;
  btn.classList.toggle("loading", state);
}

function clearErrors() {
  msg.textContent = "";
  ["name","email","phone","password"].forEach(id => {
    document.getElementById(id).style.borderColor = "";
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}