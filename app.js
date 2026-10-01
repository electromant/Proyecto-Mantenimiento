/* ==========================================================================
   CONFIGURACIÓN Y DATOS INICIALES
   ========================================================================== */

// Credenciales configuradas para Supabase
const SUPABASE_URL = "https://jseocskipyhkmzatdplx.supabase.co";
const SUPABASE_KEY = "sb_publishable_DbyAT_qBKj3hDVuBk0zUoQ_sWVAxmXz";

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Estaciones de Operación por Defecto
const ESTACIONES = [
  { id: 1, nombre: "Estación Galán", lat: 7.0625, lng: -73.8521, tipo: "Recolección" },
  { id: 2, nombre: "Estación Casabe", lat: 7.0210, lng: -73.8820, tipo: "Tratamiento" },
  { id: 3, nombre: "Estación Cira Infantas", lat: 6.9430, lng: -73.7550, tipo: "Inyección" },
  { id: 4, nombre: "Estación Lisama", lat: 7.0850, lng: -73.6820, tipo: "Compresión" },
  { id: 5, nombre: "Estación San Silvestre", lat: 7.0512, lng: -73.8310, tipo: "Bombeo" },
  { id: 6, nombre: "Estación Llanito", lat: 7.1230, lng: -73.7910, tipo: "Recolección" }
];

// Datos de respaldo por defecto
const TECNICOS_DEFECTO = [
  {
    id: 1,
    nombre: "Ing. Carlos Mendoza",
    telefono: "+573001234567",
    email: "carlos.mendoza@ecopetrol.com.co",
    especialidad: "Mantenimiento de Transformadores y Motores AC",
    edad: 38,
    empresa: "Ecopetrol - Planta Central",
    jornada: "Diurna (07:00 - 16:00)",
    foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  },
  {
    id: 2,
    nombre: "Ingrid Johana Gómez",
    telefono: "+573119876543",
    email: "ingrid.gomez@ecopetrol.com.co",
    especialidad: "Mantenimiento de Bombas Electrosumergibles",
    edad: 34,
    empresa: "Ecopetrol - Operaciones",
    jornada: "Mañana (06:00 AM - 02:00 PM)",
    foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
  },
  {
    id: 3,
    nombre: "Ing. Fabio Yordith Blanco Maffiold",
    telefono: "+573155554433",
    email: "fabio.blanco@ecopetrol.com.co",
    especialidad: "Operador de Planta",
    edad: 32,
    empresa: "Ecopetrol",
    jornada: "Mañana (06:00 AM - 02:00 PM)",
    foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
  },
  {
    id: 4,
    nombre: "Ing. Harold Santiago Abaunza Quecho",
    telefono: "+573202221100",
    email: "harold.abaunza@ecopetrol.com.co",
    especialidad: "Programador de PLC's",
    edad: 28,
    empresa: "Ecopetrol",
    jornada: "Diurna (07:00 - 16:00)",
    foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
  }
];

let mapaInstance = null;
let listaTecnicos = [];
let listaMantenimientos = [];

/* ==========================================================================
   INICIALIZACIÓN AL CARGAR LA PÁGINA
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  inicializarMapa();
  cargarTecnicos();
  cargarMantenimientos();
  poblarSelectores();
  suscripcionTiempoReal();
});

/* ==========================================================================
   1. MAPA Y GEOLOCALIZACIÓN GPS (LEAFLET)
   ========================================================================== */

function inicializarMapa() {
  const contenedorMapa = document.getElementById("mapaEstaciones");
  if (!contenedorMapa) return;

  mapaInstance = L.map("mapaEstaciones").setView([7.0625, -73.8521], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap | UNIPAZ - ECOPETROL'
  }).addTo(mapaInstance);

  ESTACIONES.forEach(est => {
    L.marker([est.lat, est.lng])
      .addTo(mapaInstance)
      .bindPopup(`<b>⚡ ${est.nombre}</b><br>Tipo: ${est.tipo}`);
  });
}

function obtenerUbicacionGPS() {
  if (!navigator.geolocation) {
    Swal.fire("Error", "Tu dispositivo o navegador no soporta GPS.", "error");
    return;
  }

  Swal.fire({
    title: 'Obteniendo GPS...',
    text: 'Por favor permite el acceso a tu ubicación',
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      mapaInstance.setView([latitude, longitude], 15);
      L.marker([latitude, longitude]).addTo(mapaInstance).bindPopup("<b>🎯 Tu ubicación actual</b>").openPopup();
      Swal.close();
    },
    (error) => {
      Swal.close();
      if (error.code === error.PERMISSION_DENIED) {
        Swal.fire("Permiso denegado", "Habilita los permisos de ubicación en la configuración del navegador.", "warning");
      } else {
        Swal.fire("Error GPS", "No se pudo obtener la posición: " + error.message, "error");
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

/* ==========================================================================
   2. FUNCIONES DE NOTIFICACIÓN DUAL (EMAIL + WHATSAPP)
   ========================================================================== */

function enviarCorreoTecnico(emailTecnico, datos) {
  if (typeof emailjs === 'undefined' || !emailTecnico) return;

  const templateParams = {
    to_email: emailTecnico,
    tecnico_nombre: datos.tecnico,
    equipo: datos.equipo,
    tipo: datos.tipo,
    fecha: datos.fecha,
    hora: datos.hora,
    jornada: datos.jornada
  };

  emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
    .then(() => {
      console.log('✅ Correo electrónico enviado exitosamente');
    })
    .catch((err) => {
      console.error('❌ Error enviando correo:', err);
    });
}

function notificarTecnicoWhatsApp(telefonoTecnico, datos) {
  if (!telefonoTecnico) return;
  const numeroLimpio = telefonoTecnico.replace(/[^0-9]/g, '');

  const mensaje = `Hola! ⚡ *NUEVO MANTENIMIENTO ASIGNADO* %0A%0A` +
    `*Equipo / Estación:* ${datos.equipo}%0A` +
    `*Tipo:* ${datos.tipo}%0A` +
    `*Fecha:* ${datos.fecha}%0A` +
    `*Hora:* ${datos.hora}%0A` +
    `*Jornada:* ${datos.jornada}%0A%0A` +
    `Por favor confirma la recepción de este aviso.`;

  const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${mensaje}`;
  window.open(urlWhatsApp, '_blank');
}

/* ==========================================================================
   3. GESTIÓN Y AGENDAMIENTO DE MANTENIMIENTOS
   ========================================================================== */

async function guardarMantenimiento(e) {
  e.preventDefault();

  const nuevoMantenimiento = {
    equipo: document.getElementById("equipo").value,
    tipo: document.getElementById("tipo").value,
    jornada: document.getElementById("jornada").value,
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    tecnico: document.getElementById("tecnico").value
  };

  if (supabaseClient) {
    await supabaseClient.from("mantenimientos").insert([nuevoMantenimiento]);
  } else {
    nuevoMantenimiento.id = Date.now();
    listaMantenimientos.push(nuevoMantenimiento);
    localStorage.setItem("mantenimientos_data", JSON.stringify(listaMantenimientos));
  }

  const tecAsignado = listaTecnicos.find(t => (t.nombre || t.nombre_tecnico) === nuevoMantenimiento.tecnico);

  if (tecAsignado) {
    if (tecAsignado.email) enviarCorreoTecnico(tecAsignado.email, nuevoMantenimiento);
    if (tecAsignado.telefono) notificarTecnicoWhatsApp(tecAsignado.telefono, nuevoMantenimiento);
  }

  document.getElementById("formularioMantenimiento").reset();
  cargarMantenimientos();

  Swal.fire({
    title: '¡Mantenimiento Agendado!',
    text: 'Se han procesado las notificaciones por Correo Electrónico y WhatsApp.',
    icon: 'success',
    confirmColor: '#004d40'
  });
}

async function cargarMantenimientos() {
  if (supabaseClient) {
    const { data } = await supabaseClient.from("mantenimientos").select("*");
    listaMantenimientos = data || [];
  } else {
    const local = localStorage.getItem("mantenimientos_data");
    listaMantenimientos = local ? JSON.parse(local) : [];
  }
  renderizarMantenimientos();
}

function renderizarMantenimientos() {
  const tbody = document.getElementById("tablaMantenimientos");
  const filtro = document.getElementById("filtroTipo") ? document.getElementById("filtroTipo").value : "TODOS";
  if (!tbody) return;

  tbody.innerHTML = "";
  const filtrados = listaMantenimientos.filter(m => filtro === "TODOS" || m.tipo === filtro);

  filtrados.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${m.equipo || 'N/A'}</b></td>
      <td><span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-weight:bold;">${m.tipo || 'General'}</span></td>
      <td>${m.jornada || 'N/A'}</td>
      <td>${m.fecha || ''}</td>
      <td>${m.hora || ''}</td>
      <td>${m.tecnico || 'Sin asignar'}</td>
      <td>
        <button class="btn-icon" onclick="eliminarMantenimiento(${m.id})" title="Eliminar"><i class="fa-solid fa-trash" style="color:#ef4444;"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function eliminarMantenimiento(id) {
  if (supabaseClient) {
    await supabaseClient.from("mantenimientos").delete().eq("id", id);
  } else {
    listaMantenimientos = listaMantenimientos.filter(m => m.id != id);
    localStorage.setItem("mantenimientos_data", JSON.stringify(listaMantenimientos));
  }
  cargarMantenimientos();
}

/* ==========================================================================
   4. DIRECTORIO Y GESTIÓN DE TÉCNICOS
   ========================================================================== */

async function cargarTecnicos() {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from("tecnicos").select("*");
    if (!error && data && data.length > 0) {
      listaTecnicos = data;
    } else {
      listaTecnicos = TECNICOS_DEFECTO;
    }
  } else {
    const local = localStorage.getItem("tecnicos_data");
    listaTecnicos = local ? JSON.parse(local) : TECNICOS_DEFECTO;
  }
  renderizarTecnicos(listaTecnicos);
  poblarSelectores();
}

function renderizarTecnicos(tecnicos) {
  const grid = document.getElementById("gridTecnicos");
  if (!grid) return;
  grid.innerHTML = "";

  const fotoDefault = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

  tecnicos.forEach((tec) => {
    // Protección contra campos nulos o vacíos en Supabase
    const nombre = tec.nombre || tec.nombre_tecnico || "Técnico sin Nombre";
    const especialidad = tec.especialidad || "Electromantenimiento";
    const edad = tec.edad ? `${tec.edad} años` : "N/A";
    const empresa = tec.empresa || "Ecopetrol";
    const telefono = tec.telefono || "Sin teléfono";
    const email = tec.email || "Sin correo";
    const foto = (tec.foto && tec.foto !== 'undefined') ? tec.foto : fotoDefault;

    const card = document.createElement("div");
    card.className = "card-tecnico";
    card.innerHTML = `
      <div class="acciones-tecnico">
        <button class="btn-icon" onclick="editarTecnico(${tec.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icon" onclick="confirmarEliminarTecnico(${tec.id})" title="Eliminar"><i class="fa-solid fa-trash" style="color:#ef4444;"></i></button>
      </div>
      <div>
        <div class="card-header-img">
          <img src="${foto}" alt="${nombre}" onerror="this.src='${fotoDefault}'">
          <span class="status-badge" title="Disponible"></span>
        </div>
        <h3>${nombre}</h3>
        <p class="especialidad">${especialidad}</p>
        <p><i class="fa-solid fa-user"></i> Edad: ${edad}</p>
        <p><i class="fa-solid fa-phone"></i> ${telefono}</p>
        <p><i class="fa-solid fa-envelope"></i> ${email}</p>
        <div style="text-align:center;">
          <span class="badge-empresa">${empresa}</span>
        </div>
      </div>
      <button class="btn-horarios" onclick="verHorarioTecnico('${nombre}')">
        <i class="fa-solid fa-calendar-days"></i> Ver Cuadro de Horarios
      </button>
    `;
    grid.appendChild(card);
  });
}

function filtrarTecnicos() {
  const texto = document.getElementById("inputBuscarTecnico").value.toLowerCase();
  const tarjetas = document.querySelectorAll("#gridTecnicos .card-tecnico");

  tarjetas.forEach(card => {
    const contenido = card.innerText.toLowerCase();
    card.style.display = contenido.includes(texto) ? "flex" : "none";
  });
}

async function guardarTecnico(event) {
  event.preventDefault();
  const id = document.getElementById("tecIndex").value;
  const nuevoTecnico = {
    nombre: document.getElementById("tecNombre").value,
    telefono: document.getElementById("tecTelefono").value,
    email: document.getElementById("tecEmail").value,
    especialidad: document.getElementById("tecEspecialidad").value,
    edad: parseInt(document.getElementById("tecEdad").value) || 30,
    empresa: document.getElementById("tecEmpresa").value,
    jornada: document.getElementById("tecJornada").value,
    foto: document.getElementById("tecFoto").value || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
  };

  if (supabaseClient) {
    if (id) {
      await supabaseClient.from("tecnicos").update(nuevoTecnico).eq("id", id);
    } else {
      await supabaseClient.from("tecnicos").insert([nuevoTecnico]);
    }
  } else {
    if (id) {
      const idx = listaTecnicos.findIndex(t => t.id == id);
      if (idx !== -1) listaTecnicos[idx] = { ...listaTecnicos[idx], ...nuevoTecnico };
    } else {
      nuevoTecnico.id = Date.now();
      listaTecnicos.push(nuevoTecnico);
    }
    localStorage.setItem("tecnicos_data", JSON.stringify(listaTecnicos));
  }

  cerrarModalFormTecnico();
  cargarTecnicos();
  Swal.fire("¡Guardado!", "El técnico ha sido registrado exitosamente.", "success");
}

function confirmarEliminarTecnico(id) {
  Swal.fire({
    title: '¿Eliminar técnico?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmColor: '#004d40',
    cancelColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      if (supabaseClient) {
        await supabaseClient.from("tecnicos").delete().eq("id", id);
      } else {
        listaTecnicos = listaTecnicos.filter(t => t.id != id);
        localStorage.setItem("tecnicos_data", JSON.stringify(listaTecnicos));
      }
      cargarTecnicos();
      Swal.fire("Eliminado", "El técnico ha sido eliminado.", "success");
    }
  });
}

/* ==========================================================================
   5. NAVEGACIÓN Y AUXILIARES
   ========================================================================== */

function cambiarPestana(nombreTab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  const targetBtn = event.currentTarget;
  const targetContent = document.getElementById(`tab-${nombreTab}`);

  if (targetBtn) targetBtn.classList.add("active");
  if (targetContent) targetContent.classList.add("active");

  if (nombreTab === "mapa" && mapaInstance) {
    setTimeout(() => mapaInstance.invalidateSize(), 300);
  }
}

function poblarSelectores() {
  const selectEquipo = document.getElementById("equipo");
  const selectTecnico = document.getElementById("tecnico");

  if (selectEquipo) {
    selectEquipo.innerHTML = ESTACIONES.map(e => `<option value="${e.nombre}">${e.nombre}</option>`).join("");
  }

  if (selectTecnico) {
    selectTecnico.innerHTML = listaTecnicos.map(t => {
      const nom = t.nombre || t.nombre_tecnico || 'Técnico';
      return `<option value="${nom}">${nom}</option>`;
    }).join("");
  }
}

function abrirModalFormTecnico() {
  document.getElementById("formTecnico").reset();
  document.getElementById("tecIndex").value = "";
  document.getElementById("tituloModalTecnico").innerText = "Agregar Técnico";
  document.getElementById("modalFormTecnico").style.display = "block";
}

function cerrarModalFormTecnico() {
  document.getElementById("modalFormTecnico").style.display = "none";
}

function editarTecnico(id) {
  const tec = listaTecnicos.find(t => t.id == id);
  if (!tec) return;

  document.getElementById("tecIndex").value = tec.id;
  document.getElementById("tecNombre").value = tec.nombre || tec.nombre_tecnico || "";
  document.getElementById("tecTelefono").value = tec.telefono || "";
  document.getElementById("tecEmail").value = tec.email || "";
  document.getElementById("tecEspecialidad").value = tec.especialidad || "";
  document.getElementById("tecEdad").value = tec.edad || "";
  document.getElementById("tecEmpresa").value = tec.empresa || "";
  document.getElementById("tecJornada").value = tec.jornada || "";
  document.getElementById("tecFoto").value = tec.foto || "";

  document.getElementById("tituloModalTecnico").innerText = "Editar Técnico";
  document.getElementById("modalFormTecnico").style.display = "block";
}

function procesarFotoArchivo(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById("tecFoto").value = evt.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function verHorarioTecnico(nombre) {
  const mantenimientosTec = listaMantenimientos.filter(m => m.tecnico === nombre);
  let html = `<h4>Programación de: ${nombre}</h4>`;

  if (mantenimientosTec.length === 0) {
    html += "<p>No tiene mantenimientos asignados actualmente.</p>";
  } else {
    html += "<ul>" + mantenimientosTec.map(m => `<li><b>${m.fecha} (${m.hora}):</b> ${m.equipo} - ${m.tipo}</li>`).join("") + "</ul>";
  }

  document.getElementById("modalHeader").innerHTML = `<h3>📅 Agenda de Trabajo</h3>`;
  document.getElementById("modalHorarioContent").innerHTML = html;
  document.getElementById("modalTecnico").style.display = "block";
}

function cerrarModalTecnico() {
  document.getElementById("modalTecnico").style.display = "none";
}

function suscripcionTiempoReal() {
  if (!supabaseClient) return;

  supabaseClient
    .channel("suscripcion-global")
    .on("postgres_changes", { event: "*", schema: "public", table: "tecnicos" }, () => cargarTecnicos())
    .on("postgres_changes", { event: "*", schema: "public", table: "mantenimientos" }, () => cargarMantenimientos())
    .subscribe();
}