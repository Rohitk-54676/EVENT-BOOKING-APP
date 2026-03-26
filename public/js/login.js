const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");
const button = form.querySelector("button");
const forgotLink = document.getElementById("forgotLink");

const API_URL = "http://localhost:5000/api/auth";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearUI();

  const email = getValue("email");
  const password = getValue("password");

  // 🔥 VALIDATION
  if (!validateEmail(email)) {
    return showError("Enter a valid email", "email");
  }

  if (!password) {
    return showError("Password is required", "password");
  }

  // Disable button
  button.disabled = true;
  button.innerText = "Logging in...";

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      handleError(data);
      resetButton();
      return;
    }

    // Store token + role
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    showMessage("Login successful!", "#34d399");

    setTimeout(() => {
      if (data.role === "admin") {
        window.location.href = "index.html";
      } else {
        window.location.href = "index.html";
      }
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

function handleError(data) {
  const message = data.message?.toLowerCase() || "";

  // 🔥 USER NOT FOUND → SHOW REGISTER
  if (message.includes("not found") || message.includes("user")) {
    showMessage("User not found", "#f87171");
    registerLink.style.display = "block";
    forgotLink.style.display = "none";
  }

  // 🔥 WRONG PASSWORD → SHOW FORGOT PASSWORD
  else if (message.includes("password")) {
    showMessage("Incorrect password", "#f87171");
    forgotLink.style.display = "block";
    registerLink.style.display = "none";
  }

  // 🔥 OTHER ERRORS
  else {
    showMessage(data.message || "Login failed", "#f87171");
    registerLink.style.display = "none";
    forgotLink.style.display = "none";
  }
}

function showMessage(text, color) {
  msg.innerText = text;
  msg.style.color = color;
}

function resetButton() {
  button.disabled = false;
  button.innerText = "Login";
}

function clearUI() {
  msg.innerText = "";
  forgotLink.style.display = "none";

  ["email", "password"].forEach(id => {
    document.getElementById(id).style.border = "";
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}