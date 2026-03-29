const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

let selectedTicket = null;

// 🔹 Load Event
async function loadEvent() {
    try {
        const options = {};

        if (token) {
            options.headers = {
                Authorization: `Bearer ${token}`
            };
        }

        const res = await fetch(`http://localhost:5000/api/events/${eventId}`, options);
        const event = await res.json();

        // 🔹 Basic Info
        document.getElementById("title").innerText = event.title;
        document.getElementById("description").innerText = event.description;
        document.getElementById("date").innerText = new Date(event.date).toLocaleString();
        document.getElementById("location").innerText = event.location;

        document.getElementById("image").src =
            event.image_url || "https://via.placeholder.com/400";

        // 🔹 Tickets
        const container = document.getElementById("ticketsContainer");
        container.innerHTML = "";

        event.tickets.forEach(ticket => {
            const div = document.createElement("div");

            // 🔥 check if user already booked this ticket
            const isBooked = event.userTickets?.map(Number).includes(ticket.id);

            div.innerHTML = `
            <label>
            <input 
                type="radio" 
                name="ticket" 
                value="${ticket.id}"
                ${isBooked ? "disabled" : ""}
            >
            ${ticket.name} - ₹${ticket.price} 
            (Team Size: ${ticket.team_size})
            ${isBooked ? " - Already Booked" : ""}
            </label>
            <br>
            `;

            container.appendChild(div);
        });

        // 🔹 Handle selection
        document.querySelectorAll("input[name='ticket']").forEach(input => {
            input.addEventListener("change", (e) => {
                selectedTicket = Number(e.target.value);
            });
        });

        // 🔹 Continue button
        const btn = document.getElementById("continueBtn");

        btn.innerText = "Continue";
        btn.onclick = handleContinue;

    } catch (err) {
        console.error(err);
    }
}

loadEvent();

// 🔹 Continue → Payment
function handleContinue() {
    const msg = document.getElementById("msg");

    if (!selectedTicket) {
        msg.innerText = "Please select a ticket";
        msg.style.color = "red";
        return;
    }

    if (!token) {
        msg.innerText = "Login required";
        msg.style.color = "red";

        setTimeout(() => {
            window.location.href = "/public/pages/login.html";
        }, 1500);

        return;
    }

    // 🔥 pass ticketId to payment page
    window.location.href = `/public/pages/payment.html?id=${eventId}&ticket=${selectedTicket}`;
}