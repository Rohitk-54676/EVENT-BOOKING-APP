const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

// 🔒 Protect page
if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}

if (role !== "admin") {
  alert("Access denied");
  window.location.href = "index.html";
}

// 🔓 Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "index.html";
});