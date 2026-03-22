const form = document.getElementById("forgotForm");
const msg = document.getElementById("msg");
const button = form.querySelector("button");

const API_URL = "http://localhost:5000/api/auth";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearUI();

  const email = getValue("email");

  // 🔥 VALIDATION
  if (!validateEmail(email)) {
    return showError("Enter a valid email", "email");
  }

  button.disabled = true;
  button.innerText = "Sending...";

  try {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Something went wrong", "#f87171");
      resetButton();
      return;
    }

    // store email for next step
    localStorage.setItem("resetEmail", email);

    showMessage("OTP sent! Redirecting...", "#34d399");

    setTimeout(() => {
      window.location.href = "reset-password.html";
    }, 1000);

  } catch (err) {
    console.error(err);
    showMessage("Server error. Try again.", "#f87171");
    resetButton();
  }
});

/* ---------- HELPERS ---------- */

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function showError(message, fieldId) {
  showMessage(message, "#f87171");

  const input = document.getElementById(fieldId);
  input.style.border = "1px solid #f87171";

  setTimeout(() => {
    input.style.border = "";
  }, 2000);

  resetButton();
}

function showMessage(text, color) {
  msg.innerText = text;
  msg.style.color = color;
}

function resetButton() {
  button.disabled = false;
  button.innerText = "Send OTP";
}

function clearUI() {
  msg.innerText = "";
  document.getElementById("email").style.border = "";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}