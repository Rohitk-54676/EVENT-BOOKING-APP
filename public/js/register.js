const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");
const button = form.querySelector("button");

const API_URL = "http://localhost:5000/api/auth";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearErrors();

  const userData = {
    name: getValue("name"),
    email: getValue("email"),
    phone: getValue("phone"),
    password: getValue("password"),
  };

  // 🔥 FIELD-BY-FIELD VALIDATION (not lazy combined check)

  if (!userData.name) {
    return showError("Name is required", "name");
  }

  if (!validateEmail(userData.email)) {
    return showError("Enter a valid email", "email");
  }

  if (!/^[0-9]{10}$/.test(userData.phone)) {
    return showError("Phone must be 10 digits", "phone");
  }

  if (userData.password.length < 6) {
    return showError("Password must be at least 6 characters", "password");
  }

  // 🚫 Prevent spam clicks
  button.disabled = true;
  button.innerText = "Sending...";

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData)
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Something went wrong", "red");

      if (data.redirect === "login") {
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      }

      resetButton();
      return;
    }

    // ⚠️ still temporary storage (acceptable for OTP flow)
    localStorage.setItem("verifyEmail",userData.email);

    showMessage("OTP sent! Redirecting...", "green");

    setTimeout(() => {
      window.location.href = "verify-otp.html";
    }, 1200);

  } catch (err) {
    console.error(err);
    showMessage("Server error. Try again later.", "red");
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

function clearErrors() {
  msg.innerText = "";

  ["name", "email", "phone", "password"].forEach(id => {
    document.getElementById(id).style.border = "";
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}