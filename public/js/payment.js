let teamSize = 1;
let members = [];
const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");
const ticketId = Number(params.get("ticket")); // 🔥 IMPORTANT

async function pay() {
    const msg = document.getElementById("msg");
    const btn = document.getElementById("payBtn"); // 🔥 NEW

    if (!token) {
        msg.innerText = "Login required";
        msg.style.color = "red";
        return;
    }

    if (!ticketId) {
        msg.innerText = "No ticket selected";
        msg.style.color = "red";
        return;
    }

    // 🔥 collect members
    const members = [];

    const names = document.querySelectorAll(".member-name");
    const regs = document.querySelectorAll(".member-reg");
    const phones = document.querySelectorAll(".member-phone");
    const emails = document.querySelectorAll(".member-email");

    for (let i = 0; i < teamSize; i++) {
        const name = names[i].value.trim();
        const reg = regs[i].value.trim();
        const phone = phones[i].value.trim();
        const email = emails[i].value.trim();

        if (!name || !reg || !phone || !email) {
            msg.innerText = `Please fill all details for Member ${i + 1}`;
            msg.style.color = "red";
            return;
        }

        members.push({
            name,
            reg_no: reg,
            phone,
            email
        });
    }

    // 🔥 PREVENT DOUBLE CLICK
    btn.disabled = true;
    btn.innerText = "Processing...";

    try {
        const res = await fetch(`http://localhost:5000/api/events/${eventId}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                ticketId,
                members
            })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.innerText = data.message;
            msg.style.color = "red";

            // 🔥 re-enable button
            btn.disabled = false;
            btn.innerText = "Pay Now";
            return;
        }

        // ✅ BETTER SUCCESS MESSAGE
        msg.innerText = "Booking confirmed! Check your email 🎫";
        msg.style.color = "green";

        setTimeout(() => {
            window.location.href = "/public/pages/index.html";
        }, 2500);

    } catch (err) {
        msg.innerText = "Error during payment";
        msg.style.color = "red";

        btn.disabled = false;
        btn.innerText = "Pay Now";
    }
}


async function loadTicketDetails() {
    const res = await fetch(`http://localhost:5000/api/events/${eventId}`);
    const event = await res.json();

    const ticket = event.tickets.find(t => t.id === ticketId);

    if (!ticket) return;

    teamSize = ticket.team_size;

    const container = document.getElementById("membersContainer");
    container.innerHTML = "";

    // 🔹 generate inputs
    for (let i = 0; i < teamSize; i++) {
        const wrapper = document.createElement("div");

        wrapper.innerHTML = `
    <h4>Enter details of Member ${i + 1}</h4>

    <input type="text" placeholder="Name" class="member-name" /><br>
    <input type="text" placeholder="Registration Number" class="member-reg" /><br>
    <input type="text" placeholder="Phone Number" class="member-phone" /><br>
    <input type="email" placeholder="Email" class="member-email" /><br><br>
  `;

        container.appendChild(wrapper);
    }
}
loadTicketDetails();