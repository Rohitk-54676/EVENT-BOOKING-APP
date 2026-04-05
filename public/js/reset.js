const form   = document.getElementById("resetForm");
const msg    = document.getElementById("msg");
const btn    = document.getElementById("submitBtn");
const boxes  = Array.from(document.querySelectorAll(".otp-digit"));
const hidden = document.getElementById("otp");

const API_URL = "http://localhost:5000/api/auth";

/* ── Show masked email hint ── */
(function showEmailHint() {
  const email = localStorage.getItem("resetEmail");
  if (email) {
    const [user, domain] = email.split("@");
    const masked = user.slice(0, 2) + "****@" + domain;
    document.getElementById("emailHint").textContent = `OTP sent to ${masked}`;
  }
})();

/* ── OTP box navigation ── */
boxes.forEach((box, i) => {
  box.addEventListener("input", () => {
    box.value = box.value.replace(/[^0-9]/g, "");
    if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    syncHidden();
  });

  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !box.value && i > 0) {
      boxes[i - 1].focus();
      boxes[i - 1].value = "";
      syncHidden();
    }
    if (e.key === "ArrowLeft"  && i > 0)                boxes[i - 1].focus();
    if (e.key === "ArrowRight" && i < boxes.length - 1) boxes[i + 1].focus();
  });

  box.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    pasted.split("").forEach((ch, j) => { if (boxes[j]) boxes[j].value = ch; });
    syncHidden();
    boxes[Math.min(pasted.length, boxes.length - 1)].focus();
  });
});

function syncHidden() {
  hidden.value = boxes.map(b => b.value).join("");
}

/* ── Password strength meter ── */
document.getElementById("newPassword").addEventListener("input", function () {
  updateStrength(this.value);
});

function updateStrength(val) {
  const segs = ["s1", "s2", "s3", "s4"].map(id => document.getElementById(id));
  segs.forEach(s => s.className = "strength-segment");
  if (!val) return;

  let score = 0;
  if (val.length >= 6)                         score++;
  if (val.length >= 10)                        score++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val))               score++;

  const labels = ["weak", "fair", "good", "strong"];
  for (let i = 0; i < score; i++) {
    segs[i].classList.add(labels[Math.min(score - 1, 3)]);
  }
}

/* ── Password visibility toggle ── */
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

  const otp             = hidden.value;
  const newPassword     = getValue("newPassword");
  const confirmPassword = getValue("confirmPassword");
  const email           = localStorage.getItem("resetEmail");

  // Validation — same order as original
  if (!/^[0-9]{6}$/.test(otp)) {
    highlightBoxesError();
    return showMessage("Enter valid 6-digit OTP", "var(--error)");
  }

  if (newPassword.length < 6) {
    return showError("Password must be at least 6 characters", "newPassword");
  }

  if (newPassword !== confirmPassword) {
    return showError("Passwords do not match", "confirmPassword");
  }

  if (!email) {
    return showMessage("Session expired. Start again.", "var(--error)");
  }

  setLoading(true);

  try {
    const res  = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await res.json();

    if (!res.ok) {
      handleError(data);
      setLoading(false);
      return;
    }

    showMessage("Password reset successful!", "var(--success)");
    localStorage.removeItem("resetEmail");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);

  } catch (err) {
    console.error(err);
    showMessage("Server error. Try again.", "var(--error)");
    setLoading(false);
  }
});

/* ── Helpers ── */
function getValue(id) {
  return document.getElementById(id).value.trim();
}

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

function highlightBoxesError() {
  boxes.forEach(b => {
    b.style.borderColor = "var(--error)";
    setTimeout(() => { b.style.borderColor = ""; }, 2000);
  });
}

function handleError(data) {
  const message = data.message?.toLowerCase() || "";

  if (message.includes("expired")) {
    showMessage("OTP expired. Request again.", "var(--error)");
    highlightBoxesError();
  } else if (message.includes("invalid")) {
    showMessage("Incorrect OTP", "var(--error)");
    highlightBoxesError();
  } else {
    showMessage(data.message || "Reset failed", "var(--error)");
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
  msg.textContent = "";
  boxes.forEach(b => b.style.borderColor = "");
  ["newPassword", "confirmPassword"].forEach(id => {
    document.getElementById(id).style.borderColor = "";
  });
}