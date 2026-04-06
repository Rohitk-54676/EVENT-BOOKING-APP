/* ══════════════════════════════════════════
   SCAN.JS — All original logic preserved.
   Navbar + logout added. showMsg updated
   to match new .scan-msg CSS classes.
══════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  if (navbar) {
    window.addEventListener("scroll", () =>
      navbar.classList.toggle("scrolled", window.scrollY > 20)
    );
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/public/pages/login.html";
}

/* ════════════════════════════════════════
   YOUR ORIGINAL CODE BELOW — UNCHANGED
   (only showMsg / clearMsg updated to use
    new .scan-msg CSS instead of old classes)
════════════════════════════════════════ */

const token = localStorage.getItem("token");
let scanner = null;

// Verify ticket
async function verify(codeInput = null) {
  const input = document.getElementById("code");
  const msg   = document.getElementById("msg");
  const code  = codeInput || input.value.trim();

  if (!code) {
    showMsg(msg, "Enter a ticket code", "error");
    return;
  }

  try {
    const res  = await fetch("http://localhost:5000/api/events/verify-ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ticketCode: code }),
    });

    const data = await res.json();
    const type = res.ok ? "success" : "error";

    showMsg(
      msg,
      `${data.message}${data.event ? ` — ${data.event}` : ""}${data.ticket ? ` (${data.ticket})` : ""}`,
      type
    );

    input.value = "";
    setTimeout(() => clearMsg(msg), 4000);

  } catch (err) {
    showMsg(msg, "Something went wrong", "error");
  }
}

// Show styled message — updated for .scan-msg classes
function showMsg(el, text, type) {
  el.textContent = text;
  el.className   = `scan-msg ${type}`;
}

function clearMsg(el) {
  el.textContent = "";
  el.className   = "scan-msg";
}

// Enter key support
document.getElementById("code").addEventListener("keypress", function (e) {
  if (e.key === "Enter") verify();
});

// Start QR scanner
function startScanner() {
  const reader = document.getElementById("reader");
  reader.style.display = "block";

  if (!scanner) {
    scanner = new Html5Qrcode("reader");
  }

  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      if (scanner) scanner.stop();
      verify(decodedText);
    },
    () => {}
  ).catch(err => {
    console.error("Camera error:", err);
    const msg = document.getElementById("msg");
    showMsg(msg, "Camera access denied or not available", "error");
  });
}

// Stop QR scanner
function stopScanner() {
  if (scanner) {
    scanner.stop().then(() => {
      document.getElementById("reader").style.display = "none";
    });
  }
}