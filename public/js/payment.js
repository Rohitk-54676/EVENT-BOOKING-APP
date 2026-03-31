let teamSize = 1;
let members = [];
const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");
const ticketId = Number(params.get("ticket")); // 🔥 IMPORTANT

async function pay() {
    const msg = document.getElementById("msg");
    const btn = document.getElementById("payBtn");

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
            msg.innerText = `Fill details for Member ${i + 1}`;
            msg.style.color = "red";
            return;
        }

        members.push({ name, reg_no: reg, phone, email });
    }

    btn.disabled = true;
    btn.innerText = "Processing...";

    let registrationId = null;

    try {
        // 🟡 STEP 1: CREATE BOOKING
        const regRes = await fetch(`http://localhost:5000/api/events/${eventId}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ ticketId, members })
        });

        const regData = await regRes.json();

        if (!regRes.ok) throw new Error(regData.message);

        registrationId = regData.registrationId;

        // 🟡 STEP 2: CREATE ORDER
        const orderRes = await fetch(`http://localhost:5000/api/payment/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ registrationId })
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) throw new Error(orderData.message);

        // 🟡 STEP 3: OPEN RAZORPAY
        const options = {
            key: orderData.key,
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.orderId,

            // ✅ SUCCESS HANDLER
            handler: async function (response) {
                try {
                    const verifyRes = await fetch(`http://localhost:5000/api/payment/verify`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            registrationId
                        })
                    });

                    const verifyData = await verifyRes.json();

                    if (!verifyRes.ok) throw new Error(verifyData.message);

                    msg.innerText = "Payment successful 🎉";
                    msg.style.color = "green";

                    setTimeout(() => {
                        window.location.href = "/public/pages/my-bookings.html";
                    }, 1500);

                } catch (err) {
                    console.error("VERIFY ERROR:", err);

                    msg.innerText = "Payment done but verification failed";
                    msg.style.color = "red";
                }
            },

            // 🔴 CRITICAL FIX: DELETE ON CANCEL
            modal: {
                ondismiss: async function () {

                    try {
                        if (registrationId) {
                            await fetch("http://localhost:5000/api/payment/delete", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({ registrationId })
                            });
                        }
                    } catch (err) {
                        console.error("Delete failed:", err);
                    }

                    msg.innerText = "Payment cancelled";
                    msg.style.color = "orange";

                    btn.disabled = false;
                    btn.innerText = "Pay Now";
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (err) {
        console.error("ERROR:", err);

        msg.innerText = err.message || "Something went wrong";
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