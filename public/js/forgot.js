const form = document.getElementById("forgotForm");
const msg  = document.getElementById("msg");
const btn  = document.getElementById("submitBtn");

const API_URL = "/api/auth";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearUI();

  const email = getValue("email");

  if (!validateEmail(email)) return showError("Enter a valid email", "email");

  setLoading(true);

  try {
    const res  = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Something went wrong", "var(--error)");
      setLoading(false);
      return;
    }

    // 🔥 ONLY CHANGE STARTS HERE
    const otp = data.otp;

    try {
      await emailjs.send(
        "service_2qmrv2n",
        "template_21nmnv6",   // ⚠️ replace
        {
          to_email: email,
          otp: otp,
        }
      );
    } catch (err) {
      console.error("EmailJS error:", err);
      showMessage("OTP generated but email failed", "var(--error)");
      setLoading(false);
      return;
    }
    // 🔥 ONLY CHANGE ENDS HERE

    localStorage.setItem("resetEmail", email);

    showMessage("OTP sent! Redirecting…", "var(--success)");
    setTimeout(() => { window.location.href = "reset-password.html"; }, 1000);

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
  document.getElementById("email").style.borderColor = "";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}