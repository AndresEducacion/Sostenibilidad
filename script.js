let scale = 1;
let panX = 0;
let panY = 0;

const ZOOM_SPEED = 0.1;
const MIN_SCALE = 0.3;
const MAX_SCALE = 4;

let isPanning = false;
let panStartX = 0;
let panStartY = 0;

async function init() {
  const viewport = document.getElementById("viewport");
  const data = await fetch("data.json").then(r => r.json());

  data.forEach(item => {
    const node = document.createElement("div");
    node.classList.add("node");

    node.style.left = item.x + "px";
    node.style.top  = item.y + "px";
    node.style.background = item.color;
    node.style.setProperty('--glow-color', item.color);  // color del glow
    node.style.color = "#ffffff"; // ✔ texto siempre visible

    node.innerHTML = `
      <img src="${item.thumb}" alt="miniatura">
      <h2>${item.titulo}</h2>
      <p>${item.alumna}</p>
    `;

    node.addEventListener("dblclick", () => openModal(item.file));

    makeNodeDraggable(node);
    viewport.appendChild(node);
  });

  enablePanZoom();
}

/* ------------------------------------------------------------- */
/* PAN + ZOOM EXACTO COMO UNITY, BLENDER, GODOT, UNREAL          */
/* ------------------------------------------------------------- */
function enablePanZoom() {
  const workspace = document.getElementById("workspace");
  const viewport = document.getElementById("viewport");


  workspace.addEventListener("mousedown", e => {
    if (e.target.classList.contains("node")) return;  // el nodo gestionará su arrastre

    if (e.button === 0) {
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
    }
  });

  workspace.addEventListener("mousemove", e => {
    if (!isPanning) return;
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
    applyTransform();
  });

  workspace.addEventListener("mouseup", () => isPanning = false);
  workspace.addEventListener("mouseleave", () => isPanning = false);

  // ZOOM CENTRADO EN EL CURSOR
  workspace.addEventListener("wheel", e => {
    e.preventDefault();

    const oldScale = scale;

    // zoom suave
    scale += -Math.sign(e.deltaY) * ZOOM_SPEED;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

    // mantener el cursor en el mismo sitio del canvas
    const rect = workspace.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // mover pan para compensar el cambio de escala
    panX -= (cursorX / oldScale - cursorX / scale);
    panY -= (cursorY / oldScale - cursorY / scale);

    applyTransform();
  }, { passive: false });
}

function applyTransform() {
  const viewport = document.getElementById("viewport");
  viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

/* ------------------------------------------------------------- */
/* ARRASTRAR NODOS (INDEPENDIENTE DEL PAN Y ZOOM)                */
/* ------------------------------------------------------------- */
function makeNodeDraggable(node) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  node.addEventListener("mousedown", e => {
    if (e.button !== 0) return; // solo clic izquierdo

    isDragging = true;
    e.stopPropagation();

    // corregir offset respecto al zoom y pan
    offsetX = (e.clientX - panX) / scale - parseFloat(node.style.left);
    offsetY = (e.clientY - panY) / scale - parseFloat(node.style.top);
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;

    const x = (e.clientX - panX) / scale - offsetX;
    const y = (e.clientY - panY) / scale - offsetY;

    node.style.left = x + "px";
    node.style.top  = y + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

/* ------------------------------------------------------------- */
/*  MODAL PPT                                                    */
/* ------------------------------------------------------------- */
function openModal(file) {
  document.getElementById("ppt-frame").src = file;
  document.getElementById("modal").style.display = "block";
}

document.getElementById("close-modal").onclick = () => {
  document.getElementById("modal").style.display = "none";
};

init();
