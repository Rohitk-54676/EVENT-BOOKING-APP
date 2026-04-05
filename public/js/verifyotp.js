const form      = document.getElementById("otpForm");
const msg       = document.getElementById("msg");
const btn       = document.getElementById("submitBtn");
const resendBtn = document.getElementById("resendOtp");
const timerEl   = document.getElementById("resendTimer");
const boxes     = Array.from(document.querySelectorAll(".otp-digit"));
const hiddenOtp = document.getElementById("otp");

const API_URL = "http://localhost:5000/api/auth";

/* ── Show masked email ── */
(function showEmailHint() {
  const email = localStorage.getItem("verifyEmail");
  if (email) {
    const [user, domain] = email.split("@");
    const masked = user.slice(0, 2) + "****@" + domain;
    document.getElementById("emailHint").textContent = `Code sent to ${masked}`;
  }
})();

/* ── OTP box keyboard navigation ── */
boxes.forEach((box, i) => {
  box.addEventListener("input", (e) => {
    // Allow only digits
    box.value = box.value.replace(/[^0-9]/g, "");
    if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    syncHidden();
  });

  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !box.value && i > 0) {
      boxes[i - 1].focus();
      boxes[i - 1].value = "";
      syncHidden();
    }
    if (e.key === "ArrowLeft" && i > 0)              boxes[i - 1].focus();
    if (e.key === "ArrowRight" && i < boxes.length - 1) boxes[i + 1].focus();
  });

  box.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    pasted.split("").forEach((ch, j) => {
      if (boxes[j]) boxes[j].value = ch;
    });
    syncHidden();
    boxes[Math.min(pasted.length, boxes.length - 1)].focus();
  });
});

function syncHidden() {
  hiddenOtp.value = boxes.map(b => b.value).join("");
}

function getOtp() {
  return hiddenOtp.value;
}

/* ── Resend countdown ── */
let countdownId = null;

function startCountdown(seconds = 60) {
  resendBtn.style.pointerEvents = "none";
  resendBtn.style.opacity       = "0.4";
  timerEl.textContent           = ` (${seconds}s)`;

  countdownId = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(countdownId);
      timerEl.textContent           = "";
      resendBtn.style.pointerEvents = "auto";
      resendBtn.style.opacity       = "1";
    } else {
      timerEl.textContent = ` (${seconds}s)`;
    }
  }, 1000);
}

// Start on load
startCountdown(60);

/* ── Submit ── */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearUI();

  const otp   = getOtp();
  const email = localStorage.getItem("verifyEmail");

  if (!/^[0-9]{6}$/.test(otp)) {
    highlightBoxesError();
    return showMessage("Enter all 6 digits", "var(--error)");
  }

  if (!email) {
    return showMessage("Session expired. Please register again.", "var(--error)");
  }

  setLoading(true);

  try {
    const res  = await fetch(`${API_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();

    if (!res.ok) {
      handleError(data);
      setLoading(false);
      return;
    }

    showMessage("Signup successful! Redirecting…", "var(--success)");
    localStorage.removeItem("verifyEmail");
    setTimeout(() => { window.location.href = "login.html"; }, 1000);

  } catch (err) {
    console.error(err);
    showMessage("Server error. Try again.", "var(--error)");
    setLoading(false);
  }
});

/* ── Resend ── */
resendBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = localStorage.getItem("verifyEmail");
  if (!email) return showMessage("Session expired. Please register again.", "var(--error)");

  showMessage("Resending OTP…", "var(--muted, #8892a4)");

  try {
    const res  = await fetch(`${API_URL}/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Please try again", "var(--error)");
      return;
    }

    showMessage("OTP resent successfully!", "var(--success)");
    boxes.forEach(b => b.value = "");
    syncHidden();
    boxes[0].focus();
    startCountdown(60);

  } catch (err) {
    console.error(err);
    showMessage("Server error", "var(--error)");
  }
});

/* ── Helpers ── */
function highlightBoxesError() {
  boxes.forEach(b => {
    b.style.borderColor = "var(--error)";
    setTimeout(() => { b.style.borderColor = ""; }, 2000);
  });
}

function handleError(data) {
  const message = data.message?.toLowerCase() || "";
  if (message.includes("expired"))      showMessage("OTP expired. Please resend.", "var(--error)");
  else if (message.includes("invalid")) showMessage("Incorrect OTP", "var(--error)");
  else                                  showMessage(data.message || "Verification failed", "var(--error)");
  highlightBoxesError();
}

function showMessage(text, color) {
  msg.textContent = text;
  msg.style.color = color;
}

function setLoading(state) {
  btn.disabled = state;
  btn.classList.toggle("loading", state);
}

function clearUI() {
  msg.textContent = "";
  boxes.forEach(b => b.style.borderColor = "");
}