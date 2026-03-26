const form = document.getElementById("eventForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    msg.innerText = "Not authorized";
    msg.style.color = "red";
    return;
  }

  const eventData = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    date: document.getElementById("date").value,
    location: document.getElementById("location").value,
    price: document.getElementById("price").value,
    maxParticipants: document.getElementById("maxParticipants").value,
    image_url: document.getElementById("image").value
  };

  try {
    const res = await fetch("http://localhost:5000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });

    const data = await res.json();

    if (!res.ok) {
      msg.innerText = data.message;
      msg.style.color = "red";
      return;
    }

    msg.innerText = "Event created successfully";
    msg.style.color = "green";

    form.reset();

  } catch (err) {
    msg.innerText = "Server error";
    msg.style.color = "red";
  }
});