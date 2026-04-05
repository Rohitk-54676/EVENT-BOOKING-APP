const form        = document.getElementById("loginForm");
const msg         = document.getElementById("msg");
const btn         = document.getElementById("submitBtn");
const forgotLink  = document.getElementById("forgotLink");
const registerLink= document.getElementById("registerLink");

const API_URL = "http://localhost:5000/api/auth";

/* ── Toggle password visibility ── */
function togglePass(inputId, toggleBtn) {
  const input = document.getElementById(inputId);
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  toggleBtn.innerHTML = show ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

/* ── Submit ── */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearUI();

  const email    = getValue("email");
  const password = getValue("password");

  if (!validateEmail(email))  return showError("Enter a valid email", "email");
  if (!password)              return showError("Password is required", "password");

  setLoading(true);

  try {
    const res  = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      handleError(data);
      setLoading(false);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role",  data.role);

    showMessage("Login successful! Redirecting…", "var(--success)");
    setTimeout(() => { window.location.href = "index.html"; }, 1000);

  } catch (err) {
    console.error(err);
    showMessage("Server error. Try again.", "var(--error)");
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

function handleError(data) {
  const message = data.message?.toLowerCase() || "";

  if (message.includes("not found") || message.includes("user")) {
    showMessage("User not found", "var(--error)");
    registerLink.style.display = "block";
    forgotLink.style.display   = "none";
  } else if (message.includes("password")) {
    showMessage("Incorrect password", "var(--error)");
    forgotLink.style.display   = "block";
    registerLink.style.display = "none";
  } else {
    showMessage(data.message || "Login failed", "var(--error)");
    registerLink.style.display = "none";
    forgotLink.style.display   = "none";
  }
}

function showMessage(text, color) {
  msg.textContent = text;
  msg.style.color = color;
}

function setLoading(state) {
  btn.disabled = state;
  btn.classList.toggle("loading", state);
}

function clearUI() {
  msg.textContent           = "";
  forgotLink.style.display  = "none";
  registerLink.style.display= "block";
  ["email", "password"].forEach(id => {
    document.getElementById(id).style.borderColor = "";
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}