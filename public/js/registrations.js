const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

async function loadData() {
  const res = await fetch(`http://localhost:5000/api/events/${eventId}/registrations`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  const tbody = document.getElementById("data");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.ticket_name}</td>
      <td>${row.name}</td>
      <td>${row.reg_no}</td>
      <td>${row.phone}</td>
      <td>${row.email}</td>
    `;

    tbody.appendChild(tr);
  });
}

loadData();