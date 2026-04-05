const token = localStorage.getItem("token");
let scanner = null;

// Verify ticket
async function verify(codeInput = null) {
  const input = document.getElementById("code");
  const msg = document.getElementById("msg");
  const code = codeInput || input.value.trim();

  if (!code) {
    showMsg(msg, "Enter ticket code", "error");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/events/verify-ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ticketCode: code })
    });

    const data = await res.json();
    const type = res.ok ? "success" : "error";
    showMsg(msg, `${data.message} | ${data.event} (${data.ticket})`, type);

    input.value = "";
    setTimeout(() => clearMsg(msg), 3000);
  } catch (err) {
    showMsg(msg, "Something went wrong", "error");
  }
}

// Show styled message
function showMsg(el, text, type) {
  el.textContent = text;
  el.className = "msg-box";
  el.classList.add(type === "success" ? "msg-success" : type === "warning" ? "msg-warning" : "msg-error");
}

function clearMsg(el) {
  el.textContent = "";
  el.className = "";
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
