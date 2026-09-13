const rooms = await fetch("./rooms.json").then((response) => response.json());
const slug = new URLSearchParams(location.search).get("room");
const room = rooms.find((entry) => entry.slug === slug) || rooms[0];

document.title = `${room.title} — Two Bodies / Taiwan`;

const canvas = document.querySelector("#scan-canvas");
const context = canvas.getContext("2d");
const maxRenderPoints = 60000;
let points = proceduralPoints(room);
let yaw = 0.45;
let pitch = -0.08;
let zoom = 1;
let dragging = false;
let lastPointer = null;

function proceduralPoints({ seed, shape, color }) {
  const random = seededRandom(seed);
  const base = hexToRgb(color);
  const cloud = [];
  const add = (x, y, z, brightness = 1) => {
    const scatter = 0.07;
    cloud.push({
      x: x + (random() - 0.5) * scatter,
      y: y + (random() - 0.5) * scatter,
      z: z + (random() - 0.5) * scatter,
      r: Math.min(255, base.r * brightness),
      g: Math.min(255, base.g * brightness),
      b: Math.min(255, base.b * brightness)
    });
  };
  for (let i = 0; i < 7800; i++) {
    const u = random();
    const v = random();
    const side = Math.floor(random() * 4);
    if (shape === "stairs") {
      const step = Math.floor(u * 12);
      add((v - .5) * 6, step * .32 - 2.0, step * .4 - 2.4, .65 + random() * .65);
      if (random() < .32) add((random() < .5 ? -1 : 1) * 3, u * 4 - 2, v * 5 - 2.5, .45 + random() * .7);
    } else if (shape === "roof") {
      add((u - .5) * 7, -1.8 + random() * .16, (v - .5) * 7, .55 + random() * .75);
      if (random() < .18) add((u - .5) * 6, v * 4 - 1.7, (random() - .5) * .3, .55 + random() * .6);
    } else {
      if (side < 2) add((side ? 1 : -1) * 3, u * 4 - 2, v * 6 - 3, .5 + random() * .72);
      else add(u * 6 - 3, v * 4 - 2, (side === 2 ? 1 : -1) * 3, .5 + random() * .72);
      if (random() < .18) add((u - .5) * 5, -2, (v - .5) * 5, .5 + random() * .6);
    }
  }
  return cloud;
}

function seededRandom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: value >> 16, g: (value >> 8) & 255, b: value & 255 };
}

function render() {
  const scale = devicePixelRatio || 1;
  const width = canvas.clientWidth * scale;
  const height = canvas.clientHeight * scale;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
  const focal = Math.min(width, height) * .61 * zoom;
  const visible = [];
  for (const point of points) {
    const x = point.x * cosY - point.z * sinY;
    const z = point.x * sinY + point.z * cosY;
    const y = point.y * cosP - z * sinP;
    const depth = point.y * sinP + z * cosP + 8;
    if (depth > .4) visible.push({ x, y, depth, point });
  }
  visible.sort((a, b) => b.depth - a.depth);
  for (const item of visible) {
    const screenX = width / 2 + item.x / item.depth * focal;
    const screenY = height / 2 - item.y / item.depth * focal;
    const size = Math.max(.7 * scale, Math.min(3.2 * scale, 15 / item.depth * scale));
    context.fillStyle = `rgb(${item.point.r | 0} ${item.point.g | 0} ${item.point.b | 0})`;
    context.fillRect(screenX, screenY, size, size);
  }
  requestAnimationFrame(render);
}

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastPointer = event;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  yaw += (event.clientX - lastPointer.clientX) * .006;
  pitch = Math.max(-1.1, Math.min(1.1, pitch + (event.clientY - lastPointer.clientY) * .006));
  lastPointer = event;
});
canvas.addEventListener("pointerup", () => { dragging = false; });
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoom = Math.max(.45, Math.min(2.3, zoom * (event.deltaY > 0 ? .91 : 1.1)));
}, { passive: false });

document.querySelector("#ply-upload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    points = await parsePly(await file.arrayBuffer());
    document.title = `${file.name} — Scan Room`;
  } catch (error) {
    window.alert(`Could not read ${file.name}: ${error.message}`);
  }
});

async function parsePly(buffer) {
  const bytes = new Uint8Array(buffer);
  let headerEnd = -1;
  for (let i = 0; i < bytes.length - 10; i++) {
    if (String.fromCharCode(...bytes.subarray(i, i + 10)) === "end_header") {
      headerEnd = i + 10;
      while (headerEnd < bytes.length && (bytes[headerEnd] === 10 || bytes[headerEnd] === 13)) headerEnd++;
      break;
    }
  }
  if (headerEnd < 0) throw new Error("PLY header was not found");
  const header = new TextDecoder().decode(bytes.subarray(0, headerEnd));
  const format = header.match(/^format\s+(\S+)/m)?.[1];
  const vertexCount = Number(header.match(/^element\s+vertex\s+(\d+)/m)?.[1]);
  const vertexLines = header.slice(0, header.indexOf("element face")).match(/^property\s+(\S+)\s+(\S+)/gm) || [];
  const properties = vertexLines.map((line) => {
    const [, type, name] = line.split(/\s+/);
    return { type, name };
  });
  if (!vertexCount || !properties.some((property) => property.name === "x")) {
    throw new Error("This PLY needs vertex x, y, and z properties");
  }
  if (format === "ascii") {
    const rows = new TextDecoder().decode(bytes.subarray(headerEnd)).trim().split(/\r?\n/);
    return sampleVertices(vertexCount, (row) =>
      vertexFromValues(rows[row].trim().split(/\s+/), properties)
    );
  }
  if (format !== "binary_little_endian") throw new Error(`Unsupported PLY format: ${format}`);
  const sizes = { char: 1, uchar: 1, short: 2, ushort: 2, int: 4, uint: 4, float: 4, double: 8 };
  const stride = properties.reduce((total, property) => total + sizes[property.type], 0);
  const data = new DataView(buffer, headerEnd);
  if (data.byteLength < stride * vertexCount) throw new Error("PLY data ended before all vertices");
  const read = { char: "getInt8", uchar: "getUint8", short: "getInt16", ushort: "getUint16", int: "getInt32", uint: "getUint32", float: "getFloat32", double: "getFloat64" };
  return sampleVertices(vertexCount, (row) => {
    let offset = row * stride;
    const values = properties.map((property) => {
      const value = data[read[property.type]](offset, true);
      offset += sizes[property.type];
      return value;
    });
    return vertexFromValues(values, properties);
  });
}

function sampleVertices(vertexCount, readVertex) {
  const interval = Math.ceil(vertexCount / maxRenderPoints);
  const sampled = [];
  for (let row = 0; row < vertexCount; row += interval) {
    sampled.push(readVertex(row));
  }
  return sampled;
}

function vertexFromValues(values, properties) {
  const get = (name, fallback) => {
    const index = properties.findIndex((property) => property.name === name);
    return index < 0 ? fallback : Number(values[index]);
  };
  return { x: get("x", 0), y: get("y", 0), z: get("z", 0), r: get("red", 203), g: get("green", 225), b: get("blue", 211) };
}

render();
