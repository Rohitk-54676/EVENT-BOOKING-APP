const form = document.getElementById("resetForm");
const msg = document.getElementById("msg");
const button = form.querySelector("button");

const API_URL = "http://localhost:5000/api/auth";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearUI();

  const otp = getValue("otp");
  const newPassword = getValue("newPassword");
  const confirmPassword = getValue("confirmPassword");
  const email = localStorage.getItem("resetEmail");

  // 🔥 VALIDATION

  if (!/^[0-9]{6}$/.test(otp)) {
    return showError("Enter valid 6-digit OTP", "otp");
  }

  if (newPassword.length < 6) {
    return showError("Password must be at least 6 characters", "newPassword");
  }

  if (newPassword !== confirmPassword) {
    return showError("Passwords do not match", "confirmPassword");
  }

  if (!email) {
    return showMessage("Session expired. Start again.", "#f87171");
  }

  // Disable button
  button.disabled = true;
  button.innerText = "Resetting...";

  try {
    const res = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      handleError(data);
      resetButton();
      return;
    }

    showMessage("Password reset successful!", "#34d399");

    localStorage.removeItem("resetEmail");

    setTimeout(() => {
      window.location.href = "login.html";
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
}

function handleError(data) {
  const message = data.message?.toLowerCase() || "";

  if (message.includes("expired")) {
    showMessage("OTP expired. Request again.", "#f87171");
  } else if (message.includes("invalid")) {
    showMessage("Incorrect OTP", "#f87171");
  } else {
    showMessage(data.message || "Reset failed", "#f87171");
  }
}

function showMessage(text, color) {
  msg.innerText = text;
  msg.style.color = color;
}

function resetButton() {
  button.disabled = false;
  button.innerText = "Reset Password";
}

function clearUI() {
  msg.innerText = "";

  ["otp", "newPassword", "confirmPassword"].forEach(id => {
    document.getElementById(id).style.border = "";
  });
}