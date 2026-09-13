const rooms = await fetch("./rooms.json").then((response) => response.json());

const links = document.querySelector("#room-links");

for (const [index, room] of rooms.entries()) {
  const link = document.createElement("a");
  link.className = "room-link";
  link.href = `room.html?room=${encodeURIComponent(room.slug)}`;
  link.textContent = `#${index + 1}`;
  links.append(link);
}
