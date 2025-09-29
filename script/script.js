// URLs y keys
const SUPABASE_TABLE_URL = "https://pxilyukiwidglubmnpay.supabase.co/rest/v1/imagenperiodico";
const SUPABASE_GET_URL = SUPABASE_TABLE_URL + "?select=*";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aWx5dWtpd2lkZ2x1Ym1ucGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzkyNzAsImV4cCI6MjA3NDYxNTI3MH0.fvKGB-R8HJ2Xfr6X3-GRgOrUL0TDxwEa33wTFFhcsOU";
const REMOVE_BG_KEY = "HSCwkFLtC3t2zUHTve7XzXRE"; // Tu key de Remove.bg

// Convertir blob a Base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Remove.bg API
async function removeBackground(file) {
  const formData = new FormData();
  formData.append("image_file", file);

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": REMOVE_BG_KEY },
    body: formData
  });

  if (!res.ok) throw new Error("Error al remover fondo");
  return res.blob();
}

// Guardar en Supabase
async function guardarImagen(nombre, apellido, curso, base64Imagen, concepto) {
  try {
    const body = [{ nombre, apellido, curso, imagen: base64Imagen, concepto }];
    const res = await fetch(SUPABASE_TABLE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const data = await res.json();
      return mostrarModal("Error al subir publicación: " + JSON.stringify(data));
    }
    mostrarModal("¡Publicación subida!");
    mostrarDatos();
  } catch (err) {
    mostrarModal("Error al subir publicación: " + err.message);
  }
}

// Eliminar publicación
async function eliminarImagen(id) {
  if (!confirm("¿Seguro que quieres eliminar esta publicación?")) return;
  try {
    const res = await fetch(`${SUPABASE_TABLE_URL}?id=eq.${id}`, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });

    if (!res.ok) {
      const data = await res.json();
      return mostrarModal("Error al eliminar publicación: " + JSON.stringify(data));
    }
    mostrarModal("¡Publicación eliminada!");
    mostrarDatos();
  } catch (err) {
    mostrarModal("Error al eliminar publicación: " + err.message);
  }
}

// Modal
function mostrarModal(mensaje, titulo = "Notificación") {
  const modal = document.getElementById("modal");
  const modalText = document.getElementById("modal-text");
  const modalTitle = document.getElementById("modal-title");

  modalTitle.textContent = titulo;
  modalText.textContent = mensaje;
  modal.style.display = "flex";

  document.getElementById("modal-close").onclick = () => modal.style.display = "none";
  document.getElementById("modal-ok").onclick = () => modal.style.display = "none";

  window.onclick = event => { if (event.target === modal) modal.style.display = "none"; }
}

// Mostrar publicaciones y formulario
async function mostrarDatos() {
  const contenedor = document.getElementById("contenedor");
  contenedor.innerHTML = "";

  try {
    const res = await fetch(SUPABASE_GET_URL, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();
    if (!res.ok) return mostrarModal("Error al cargar publicaciones");

    // Mostrar publicaciones existentes
    data.forEach(pub => {
      const celda = document.createElement("div");
      celda.className = "celda";

      const img = document.createElement("img");
      if (pub.imagen) img.src = "data:image/png;base64," + pub.imagen;

      const info = document.createElement("div");
      info.innerHTML = `<h3>${pub.nombre} ${pub.apellido} - ${pub.curso}</h3><p>${pub.concepto}</p>`;

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.style.background = "#e74c3c";
      btnEliminar.style.color = "#fff";
      btnEliminar.style.marginTop = "5px";
      btnEliminar.onclick = () => eliminarImagen(pub.id);

      celda.appendChild(img);
      celda.appendChild(info);
      celda.appendChild(btnEliminar);
      contenedor.appendChild(celda);
    });

    // Formulario para nueva publicación
    const celdaForm = document.createElement("div");
    celdaForm.className = "celda";

    const nombreInput = document.createElement("input"); nombreInput.placeholder = "Nombre"; celdaForm.appendChild(nombreInput);
    const apellidoInput = document.createElement("input"); apellidoInput.placeholder = "Apellido"; celdaForm.appendChild(apellidoInput);
    const cursoInput = document.createElement("input"); cursoInput.placeholder = "Curso"; celdaForm.appendChild(cursoInput);
    const inputFile = document.createElement("input"); inputFile.type = "file"; inputFile.accept = "image/*"; celdaForm.appendChild(inputFile);
    const conceptoInput = document.createElement("textarea"); conceptoInput.placeholder = "Concepto / descripción"; celdaForm.appendChild(conceptoInput);

    const btn = document.createElement("button"); btn.textContent = "Subir publicación";
    btn.onclick = async () => {
      if (!inputFile.files[0]) return mostrarModal("Selecciona una imagen");
      try {
        const blob = await removeBackground(inputFile.files[0]);
        const base64 = await blobToBase64(blob);
        await guardarImagen(nombreInput.value, apellidoInput.value, cursoInput.value, base64, conceptoInput.value);
      } catch (err) {
        mostrarModal("Error al remover fondo: " + err.message);
      }
    };

    celdaForm.appendChild(btn);
    contenedor.appendChild(celdaForm);

  } catch (err) {
    mostrarModal("Error al mostrar publicaciones: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", mostrarDatos);
