const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const bookBtn = document.getElementById("bookBtn");
const welcomeMsg = document.getElementById("welcomeMsg");

// 🔄 Change UI based on login
if (token) {
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
  bookBtn.style.display = "inline-block";

  welcomeMsg.innerText = "Welcome back! You can now book tickets.";
} else {
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  bookBtn.style.display = "none";
}

// 🔐 Login button logic
loginBtn.addEventListener("click", () => {
  if (!token) {
    window.location.href = "login.html";
  } else if (role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "booking.html";
  }
});

// 🎟️ Book button logic
bookBtn.addEventListener("click", () => {
  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  window.location.href = "booking.html";
});

// 🔓 Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  window.location.reload();
});