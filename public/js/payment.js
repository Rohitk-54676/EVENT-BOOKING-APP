

let teamSize = 1;
let ticketPrice = 0;   // 🔑 tracks whether ticket is free

const token = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");
const ticketId = Number(params.get("ticket")); // 🔥 IMPORTANT

document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  window.addEventListener("scroll", () =>
    navbar.classList.toggle("scrolled", window.scrollY > 20)
  );

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    mobileMenu.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
      hamburger.classList.remove("open");
      mobileMenu.classList.remove("open");
    }
  });

  const area = document.getElementById("userArea");
  const mobileAuth = document.getElementById("mobileAuth");

  if (!token) {
    area.innerHTML = `
      <a href="/pages/login.html"    class="btn-nav">Login</a>
      <a href="/pages/register.html" class="btn-nav filled">Register</a>`;
    if (mobileAuth) mobileAuth.innerHTML = `
      <a href="/pages/login.html"    class="btn-nav" style="flex:1;text-align:center">Login</a>
      <a href="/pages/register.html" class="btn-nav filled" style="flex:1;text-align:center">Register</a>`;
  } else {
    let user = null;
    try { user = JSON.parse(atob(token.split(".")[1])); } catch { }
    area.innerHTML = `
      <span style="font-size:.84rem;color:var(--muted-lt)">Hi, ${user?.name?.split(" ")[0] || "there"} 👋</span>
      <button class="btn-nav" onclick="logout()">Logout</button>`;
    if (mobileAuth) mobileAuth.innerHTML = `
      <button class="btn-nav" onclick="logout()" style="flex:1;text-align:center">Logout</button>`;
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/pages/login.html";
}


async function loadTicketDetails() {
  try {
    const res = await fetch(`/api/events/${eventId}`);
    const event = await res.json();

    const ticket = event.tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    teamSize = ticket.team_size;
    ticketPrice = parseFloat(ticket.price) || 0;  

    const isFree = ticketPrice === 0;

    
    updatePayButton(isFree);

    
    const container = document.getElementById("membersContainer");
    const loading = document.getElementById("membersLoading");
    if (loading) loading.style.display = "none";
    container.innerHTML = "";

    const sub = document.getElementById("memberSubtitle");
    if (sub) sub.textContent = teamSize === 1
      ? "Fill in your details below"
      : `Fill in details for all ${teamSize} team members`;

    for (let i = 0; i < teamSize; i++) {
      const card = document.createElement("div");
      card.className = "member-card";
      card.style.animationDelay = `${i * 0.08}s`;

      card.innerHTML = `
        <div class="member-card-header">
          <div class="member-num">${i + 1}</div>
          <h4>${teamSize === 1 ? "Your Details" : `Member ${i + 1}`}</h4>
        </div>
        <div class="field-grid">
          <div class="field-group">
            <label>Full Name <span style="color:var(--pink)">*</span></label>
            <div class="field-wrap">
              <svg class="field-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input type="text" placeholder="Enter name" class="member-name" />
            </div>
          </div>
          <div class="field-group">
            <label>Registration No. <span style="color:var(--pink)">*</span></label>
            <div class="field-wrap">
              <svg class="field-icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <input type="text" placeholder="e.g. 22CS001" class="member-reg" />
            </div>
          </div>
          <div class="field-group">
            <label>Phone Number <span style="color:var(--pink)">*</span></label>
            <div class="field-wrap">
              <svg class="field-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 13 19.5 19.5 0 0 1 1.82 4.18 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.94-.94a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <input type="tel" placeholder="10-digit number" class="member-phone" maxlength="10" />
            </div>
          </div>
          <div class="field-group">
            <label>Email Address <span style="color:var(--pink)">*</span></label>
            <div class="field-wrap">
              <svg class="field-icon" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <input type="email" placeholder="you@example.com" class="member-email" />
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    }

    /* ── Populate order summary ── */
    populateSummary(event, ticket, isFree);

  } catch (err) {
    console.error("loadTicketDetails error:", err);
    const loading = document.getElementById("membersLoading");
    if (loading) loading.innerHTML = `<p style="color:var(--red);font-size:.85rem;padding:10px 0">Failed to load event details.</p>`;
  }
}


function updatePayButton(isFree) {
  const btn = document.getElementById("payBtn");
  if (!btn) return;

  if (isFree) {
    btn.innerHTML = `
      <span class="btn-text">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
        Book Now — It's Free!
      </span>
      <span class="btn-spinner"></span>
    `;
    btn.style.background = "linear-gradient(135deg, #4ade80, #22d3ee)";
    btn.style.color = "#0d0d1a";
    btn.style.boxShadow = "0 6px 24px rgba(74,222,128,0.4)";
    btn.onclick = bookFree;
  } else {
    btn.innerHTML = `
      <span class="btn-text">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        Pay Now
      </span>
      <span class="btn-spinner"></span>
    `;
    btn.style.background = "";
    btn.style.color = "";
    btn.style.boxShadow = "";
    btn.onclick = pay;
  }
}


function populateSummary(event, ticket, isFree) {
  const loadingEl = document.getElementById("summaryLoading");
  const contentEl = document.getElementById("summaryContent");
  if (loadingEl) loadingEl.style.display = "none";
  if (contentEl) contentEl.style.display = "block";

  const img = document.getElementById("summaryImg");
  if (img) {
    img.src = event.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80";
    img.alt = event.title;
    img.onerror = () => { img.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80"; };
  }

  setText("summaryTitle", event.title);
  setText("summaryTicketName", ticket.name);
  setText("summaryTeamSize", `${ticket.team_size} ${ticket.team_size > 1 ? "members" : "person"}`);
  setText("summaryPrice", isFree ? "Free" : `₹${ticket.price.toLocaleString("en-IN")}`);

  const totalEl = document.getElementById("summaryTotal");
  if (totalEl) {
    if (isFree) {
      totalEl.textContent = "Free";
      totalEl.style.background = "linear-gradient(90deg,#4ade80,#22d3ee)";
      totalEl.style.webkitBackgroundClip = "text";
      totalEl.style.webkitTextFillColor = "transparent";
    } else {
      totalEl.textContent = `₹${ticket.price.toLocaleString("en-IN")}`;
    }
  }

  const dateEl = document.querySelector("#summaryDate span");
  if (dateEl && event.date) {
    dateEl.textContent = new Date(event.date).toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short", year: "numeric"
    });
  }

  const locEl = document.querySelector("#summaryLocation span");
  if (locEl) locEl.textContent = event.location || "Venue TBA";

  document.title = `${isFree ? "Register for" : "Pay for"} ${event.title} — EventPulse`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || "";
}


function collectMembers() {
  const names = document.querySelectorAll(".member-name");
  const regs = document.querySelectorAll(".member-reg");
  const phones = document.querySelectorAll(".member-phone");
  const emails = document.querySelectorAll(".member-email");

  // Clear all previous invalid states
  document.querySelectorAll(".member-name,.member-reg,.member-phone,.member-email")
    .forEach(el => el.classList.remove("invalid"));

  const members = [];
  let firstError = null;

  for (let i = 0; i < teamSize; i++) {
    const name = names[i].value.trim();
    const reg = regs[i].value.trim();
    const phone = phones[i].value.trim();
    const email = emails[i].value.trim();

    let memberHasError = false;

    if (!name) { names[i].classList.add("invalid"); memberHasError = true; }
    if (!reg) { regs[i].classList.add("invalid"); memberHasError = true; }
    if (!phone) { phones[i].classList.add("invalid"); memberHasError = true; }
    if (!email) { emails[i].classList.add("invalid"); memberHasError = true; }

    if (memberHasError && !firstError) {
      firstError = `Fill all details for Member ${i + 1}`;
    }

    if (!memberHasError) {
      members.push({ name, reg_no: reg, phone, email });
    }
  }

  if (firstError) {
    showMsg(firstError, "error");
    return null;
  }

  return members;
}


async function bookFree() {
  if (!token) {
    showMsg("Please login to book", "error");
    return;
  }

  if (!ticketId) {
    showMsg("No ticket selected", "error");
    return;
  }

  const members = collectMembers();
  if (!members) return;  

  setLoading(true);
  clearMsg();

  let registrationId = null;

  try {
    
    const regRes = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ticketId, members }),
    });

    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(regData.message);

    registrationId = regData.registrationId;

    
    const confirmRes = await fetch(`/api/payment/free-booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ registrationId }),
    });

    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) throw new Error(confirmData.message);

    try {
      const ticket = confirmData.ticket;

      await emailjs.send(
        "service_2qmrv2n",
        "template_gxm4bjk",   
        {
          to_email: ticket.email,
          eventName: ticket.eventName,
          date: ticket.date,
          location: ticket.location,
          ticketName: ticket.ticketName,
          ticketCode: ticket.ticketCode,
          qrImage: ticket.qrImage
        }
      );
    } catch (err) {
      console.error("Free ticket email failed:", err);
    }
    // ✅ SUCCESS
    showMsg("🎉 You're registered! Redirecting to your tickets…", "success");
    const btn = document.getElementById("payBtn");
    if (btn) { btn.disabled = true; btn.style.opacity = "0.6"; }

    setTimeout(() => {
      window.location.href = "/pages/my-bookings.html";
    }, 2000);

  } catch (err) {
    console.error("FREE BOOKING ERROR:", err);

   
    if (registrationId) {
      try {
        await fetch("/api/payment/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ registrationId }),
        });
      } catch (cleanupErr) {
        console.error("Cleanup failed:", cleanupErr);
      }
    }

    showMsg(err.message || "Booking failed. Please try again.", "error");
    setLoading(false);
  }
}


async function pay() {
  if (!token) {
    showMsg("Login required", "error");
    return;
  }

  if (!ticketId) {
    showMsg("No ticket selected", "error");
    return;
  }

  const members = collectMembers();
  if (!members) return; 

  setLoading(true);
  clearMsg();

  let registrationId = null;

  try {
    
    const regRes = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ticketId, members }),
    });

    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(regData.message);

    registrationId = regData.registrationId;

   
    const orderRes = await fetch(`/api/payment/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ registrationId }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
     
      if (registrationId) {
        try {
          await fetch("/api/payment/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ registrationId }),
          });
        } catch (cleanupErr) {
          console.error("Cleanup after order failure:", cleanupErr);
        }
      }
      throw new Error(orderData.message);
    }

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,

      handler: async function (response) {
        try {
          const verifyRes = await fetch(`/api/payment/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              registrationId,
            }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.message);

          try {
            const ticket = verifyData.ticket;

            await emailjs.send(
              "service_2qmrv2n",
              "template_gxm4bjk",  
              {
                to_email: ticket.email,
                eventName: ticket.eventName,
                date: ticket.date,
                location: ticket.location,
                ticketName: ticket.ticketName,
                ticketCode: ticket.ticketCode,
                qrImage: ticket.qrImage
              }
            );
          } catch (err) {
            console.error("Ticket email failed:", err);
          }

          showMsg("Payment successful! Ticket sent to email 🎟️", "success");

          setTimeout(() => {
            window.location.href = "/pages/my-bookings.html";
          }, 1500);

        } catch (err) {
          console.error("VERIFY ERROR:", err);
          showMsg("Payment done but verification failed. Contact support.", "error");
          setLoading(false);
        }
      },

      // 🔴 DELETE ON CANCEL — YOUR ORIGINAL
      modal: {
        ondismiss: async function () {
          try {
            if (registrationId) {
              await fetch("/api/payment/delete", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ registrationId }),
              });
            }
          } catch (err) {
            console.error("Delete failed:", err);
          }

          showMsg("Payment cancelled", "warning");
          setLoading(false);
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error("ERROR:", err);
    showMsg(err.message || "Something went wrong", "error");
    setLoading(false);
  }
}


function setLoading(state) {
  const btn = document.getElementById("payBtn");
  if (!btn) return;
  btn.disabled = state;
  btn.classList.toggle("loading", state);
}

function showMsg(text, type = "error") {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = text;
  el.className = `pay-msg ${type}`;
}

function clearMsg() {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = "";
  el.className = "pay-msg";
}


loadTicketDetails();