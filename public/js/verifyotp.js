const form = document.getElementById("otpForm");
const msg = document.getElementById("msg");
const button = form.querySelector("button");
const resendBtn = document.getElementById("resendOtp");

const API_URL = "http://localhost:5000/api/auth";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearUI();

  const otp = getValue("otp");
  const userData = JSON.parse(localStorage.getItem("userData"));

  // 🔥 VALIDATION
  if (!/^[0-9]{6}$/.test(otp)) {
    return showError("Enter a valid 6-digit OTP", "otp");
  }

  if (!userData) {
    return showMessage("Session expired. Please register again.", "#f87171");
  }

  // Disable button
  button.disabled = true;
  button.innerText = "Verifying...";

  try {
    const res = await fetch(`${API_URL}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...userData, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      handleError(data);
      resetButton();
      return;
    }

    showMessage("Signup successful!", "#34d399");

    localStorage.removeItem("userData");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);

  } catch (err) {
    console.error(err);
    showMessage("Server error. Try again.", "#f87171");
    resetButton();
  }
});

/* 🔥 RESEND OTP */
resendBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const userData = JSON.parse(localStorage.getItem("userData"));

  if (!userData) {
    return showMessage("Session expired. Please register again.", "#f87171");
  }

  showMessage("Resending OTP...", "white");

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: userData.email }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Please wait before requesting again", "#f87171");
      return;
    }

    showMessage("OTP resent successfully!", "#34d399");

  } catch (err) {
    console.error(err);
    showMessage("Server error", "#f87171");
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
    showMessage("OTP expired. Please resend.", "#f87171");
  } else if (message.includes("invalid")) {
    showMessage("Incorrect OTP", "#f87171");
  } else {
    showMessage(data.message || "Verification failed", "#f87171");
  }
}

function showMessage(text, color) {
  msg.innerText = text;
  msg.style.color = color;
}

function resetButton() {
  button.disabled = false;
  button.innerText = "Verify";
}

function clearUI() {
  msg.innerText = "";
  document.getElementById("otp").style.border = "";
}