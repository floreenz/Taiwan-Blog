const rooms = await fetch("./rooms.json").then((response) => response.json());

const cards = document.querySelector("#room-cards");
const pins = document.querySelector("#map-pins");

for (const room of rooms) {
  const card = document.createElement("a");
  card.className = "room-card";
  card.href = `room.html?room=${encodeURIComponent(room.slug)}`;
  card.style.setProperty("--room-color", room.color);
  card.innerHTML = `
    <div class="card-swatch" aria-hidden="true"></div>
    <div class="room-card-title">${room.title}</div>
    <div class="card-details"><p>${room.number}</p><p>${room.place}</p><p>${room.date}</p></div>
    <div class="card-arrow" aria-hidden="true">↗</div>`;
  cards.append(card);

  const pin = document.createElement("a");
  pin.className = "map-pin";
  pin.href = card.href;
  pin.style.left = `${room.pin[0]}%`;
  pin.style.top = `${room.pin[1]}%`;
  pin.innerHTML = `<span>${room.number}</span>`;
  pins.append(pin);
}
