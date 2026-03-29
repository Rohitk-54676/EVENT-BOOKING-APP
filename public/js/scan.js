const token = localStorage.getItem("token");

let scanner = null;

// 🔹 VERIFY FUNCTION
async function verify(codeInput = null) {
  const input = document.getElementById("code");
  const msg = document.getElementById("msg");

  const code = codeInput || input.value.trim();

  if (!code) {
    msg.innerText = "Enter ticket code";
    msg.style.color = "red";
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

    msg.innerText = `${data.message} | ${data.event} (${data.ticket})`;
    msg.style.color = res.ok ? "green" : "red";

    // 🔥 Clear input
    input.value = "";

    // 🔥 Auto clear message
    setTimeout(() => {
      msg.innerText = "";
    }, 2000);

  } catch (err) {
    msg.innerText = "Error";
    msg.style.color = "red";
  }
}

// 🔥 ENTER KEY SUPPORT
document.getElementById("code").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    verify();
  }
});

// 🔹 START SCANNER
function startScanner() {
  const reader = document.getElementById("reader");

  reader.style.display = "block";

  if (!scanner) {
    scanner = new Html5Qrcode("reader");
  }

  scanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: 250
    },
    (decodedText) => {
      // 🔥 stop scanner immediately
      if (scanner) {
        scanner.stop();
      }

      verify(decodedText);
    },
    (error) => {
      // ignore scan errors
    }
  ).catch(err => {
    console.error("Camera error:", err);
  });
}

// 🔹 STOP SCANNER
function stopScanner() {
  if (scanner) {
    scanner.stop().then(() => {
      document.getElementById("reader").style.display = "none";
    });
  }
}