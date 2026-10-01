// LISTA COMPLETA DE ESTACIONES DE RECOLECCIÓN Y INFRAESTRUCTURA BARRANCABERMEJA
const estacionesBarrancabermeja = [
  { id: 1, nombre: "Refinería de Barrancabermeja (GRB)", lat: 7.0653, lng: -73.8547, sector: "Urbano / Industrial", estado: "Operativo", desc: "Complejo Industrial Principal de Refinación" },
  { id: 2, nombre: "Estación Galán", lat: 7.0425, lng: -73.8511, sector: "Galán / Rio Magdalena", estado: "Operativo", desc: "Terminal de Transporte y Almacenamiento de Crudos" },
  { id: 3, nombre: "Estación Campo El Centro - Batería 1", lat: 6.8722, lng: -73.7481, sector: "Corregimiento El Centro", estado: "Operativo", desc: "Estación Central de Recolección Cira Infantas" },
  { id: 4, nombre: "Estación Batería 2 (La Cira)", lat: 6.8911, lng: -73.7315, sector: "El Centro", estado: "Operativo", desc: "Separación y Deshidratación de Crudo" },
  { id: 5, nombre: "Estación Batería 3 (Infantas)", lat: 6.8488, lng: -73.7592, sector: "El Centro / Infantas", estado: "Mantenimiento", desc: "Estación de Inyección de Agua y Recolección" },
  { id: 6, nombre: "Estación El Llanito", lat: 7.1523, lng: -73.8011, sector: "Corregimiento El Llanito", estado: "Operativo", desc: "Recolección de hidrocarburos Norte" },
  { id: 7, nombre: "Estación Lisama", lat: 6.9458, lng: -73.6521, sector: "Ruta del Cacao / Lisama", estado: "Operativo", desc: "Estación de Bombeo y Compresión de Gas" },
  { id: 8, nombre: "Estación Casabe", lat: 7.0811, lng: -73.8825, sector: "Margen Izquierda Río Magd.", estado: "Operativo", desc: "Campo Histórico Casabe - Recolección" },
  { id: 9, nombre: "Estación Cantagallo", lat: 7.3751, lng: -73.9189, sector: "Cantagallo (Sur de Bolívar)", estado: "Operativo", desc: "Planta Deshidratadora de Crudo" },
  { id: 10, nombre: "Estación Yariguíes / San Vicente", lat: 6.9812, lng: -73.7845, sector: "Sabaneta", estado: "Inspección", desc: "Línea de Transferencia de Gas Petroquímico" },
  { id: 11, nombre: "Estación Termoyariguíes", lat: 7.0511, lng: -73.8210, sector: "Comuna 6", estado: "Operativo", desc: "Generación Eléctrica para el Complejo" },
  { id: 12, nombre: "Estación San Silvestre", lat: 7.0911, lng: -73.8155, sector: "Ciénaga San Silvestre", estado: "Operativo", desc: "Captación de Agua Industrial" }
];

// Avatares base vectoriales por defecto en SVG
const avatarMujer = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23004d40'/><circle cx='50' cy='35' r='18' fill='%23ffffff'/><path d='M20 85 C20 60, 80 60, 80 85 Z' fill='%23ffffff'/></svg>";
const avatarHombre = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23002b49'/><circle cx='50' cy='35' r='18' fill='%23ffffff'/><path d='M20 85 C20 60, 80 60, 80 85 Z' fill='%23ffffff'/></svg>";

// ESTADO GLOBAL CON LOS 4 TÉCNICOS PREDEFINIDOS
let tecnicos = JSON.parse(localStorage.getItem('tecnicos_data')) || [
  {
    nombre: "Ing. Carlos Mendoza",
    especialidad: "Mantenimiento de Transformadores y Motores AC",
    edad: 38,
    empresa: "Ecopetrol - Planta Central",
    jornada: "Diurna (07:00 - 16:00)",
    foto: avatarHombre
  },
  {
    nombre: "Ingrid Johana Gómez",
    especialidad: "Mantenimiento de Bombas Electrosumergibles",
    edad: 34,
    empresa: "Ecopetrol - Operaciones",
    jornada: "Mañana (06:00 AM - 02:00 PM)",
    foto: avatarMujer
  },
  {
    nombre: "Ing. Fabio Yordith Blanco Maffiold",
    especialidad: "Operador de Planta",
    edad: 32,
    empresa: "Ecopetrol",
    jornada: "Mañana (06:00 AM - 02:00 PM)",
    foto: avatarHombre
  },
  {
    nombre: "Ing. Harold Santiago Abaunza Quecho",
    especialidad: "Programador de PLC's",
    edad: 28,
    empresa: "Ecopetrol",
    jornada: "Diurna (07:00 - 16:00)",
    foto: avatarHombre
  }
];

let mantenimientos = JSON.parse(localStorage.getItem('mantenimientos_data')) || [];
let mapa = null;
let marcadorUsuario = null;

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  inicializarMapa();
  cargarSelectEstaciones();
  renderizarTecnicos();
  cargarSelectTecnicos();
  renderizarMantenimientos();
});

function guardarEstadoLocal() {
  localStorage.setItem('tecnicos_data', JSON.stringify(tecnicos));
  localStorage.setItem('mantenimientos_data', JSON.stringify(mantenimientos));
}

// Navegación de pestañas con ajuste de mapa
function cambiarPestana(pestanaNombre) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }
  
  const targetTab = document.getElementById(`tab-${pestanaNombre}`);
  if (targetTab) targetTab.classList.add('active');

  if (pestanaNombre === 'mapa') {
    if (!mapa) {
      inicializarMapa();
    } else {
      setTimeout(() => mapa.invalidateSize(), 250);
    }
  }
}

// Inicializar Mapa con todas las estaciones de Barrancabermeja
function inicializarMapa() {
  if (mapa) return;

  // Centrado en Barrancabermeja
  mapa = L.map('mapaEstaciones').setView([7.0350, -73.8100], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap | Ecopetrol - UNIPAZ'
  }).addTo(mapa);

  // Agregar marcador por cada estación
  estacionesBarrancabermeja.forEach(e => {
    const popupContent = `
      <div style="font-family: sans-serif; min-width:180px;">
        <h4 style="margin:0 0 5px; color:#004d40;">${e.nombre}</h4>
        <p style="margin:2px 0; font-size:12px;"><b>Sector:</b> ${e.sector}</p>
        <p style="margin:2px 0; font-size:12px;"><b>Estado:</b> <span style="color:${e.estado === 'Operativo' ? 'green' : 'orange'}; font-weight:bold;">${e.estado}</span></p>
        <p style="margin:5px 0; font-size:11px; color:#555;">${e.desc}</p>
        <button onclick="agendarEstacionDirecto('${e.nombre}')" style="margin-top:5px; background:#004d40; color:white; border:none; padding:5px 10px; border-radius:3px; font-size:11px; cursor:pointer; width:100%;">📅 Programar Mantenimiento</button>
      </div>
    `;

    L.marker([e.lat, e.lng])
      .addTo(mapa)
      .bindPopup(popupContent);
  });

  setTimeout(() => {
    mapa.invalidateSize();
  }, 300);
}

// Función GPS / Ubicación del celular en tiempo real
function obtenerUbicacionGPS() {
  if (!navigator.geolocation) {
    alert("Tu dispositivo o navegador no soporta la función de localización GPS.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      const lat = posicion.coords.latitude;
      const lng = posicion.coords.longitude;

      if (marcadorUsuario) {
        mapa.removeLayer(marcadorUsuario);
      }

      mapa.setView([lat, lng], 15);

      marcadorUsuario = L.circleMarker([lat, lng], {
        color: '#0288d1',
        fillColor: '#03a9f4',
        fillOpacity: 0.9,
        radius: 10
      }).addTo(mapa)
        .bindPopup("<b>📍 Tu Ubicación Actual (GPS)</b>")
        .openPopup();
    },
    (error) => {
      alert("No se pudo acceder a tu ubicación GPS. Asegúrate de activar el GPS del celular y dar permisos al navegador.");
    },
    { enableHighAccuracy: true }
  );
}

// Llenar el select del formulario con las estaciones reales
function cargarSelectEstaciones() {
  const select = document.getElementById('equipo');
  if (!select) return;
  select.innerHTML = '<option value="">-- Seleccionar Estación / Equipo --</option>';

  estacionesBarrancabermeja.forEach(e => {
    const option = document.createElement('option');
    option.value = `${e.nombre} (${e.sector})`;
    option.textContent = `${e.nombre} - ${e.sector}`;
    select.appendChild(option);
  });
}

// Acceso directo a programar desde el marcador del mapa
function agendarEstacionDirecto(nombreEstacion) {
  cambiarPestana('agendamiento');
  const selectEquipo = document.getElementById('equipo');
  
  for (let i = 0; i < selectEquipo.options.length; i++) {
    if (selectEquipo.options[i].text.includes(nombreEstacion)) {
      selectEquipo.selectedIndex = i;
      break;
    }
  }
}

// Procesar y comprimir la foto del técnico
function procesarFotoArchivo(event) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();

  lector.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;

    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxDimension = 300;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      const fotoComprimida = canvas.toDataURL('image/jpeg', 0.8);

      document.getElementById('tecFoto').value = fotoComprimida;

      const imgPreview = document.getElementById('previewFotoTecnico');
      imgPreview.src = fotoComprimida;
      imgPreview.style.display = 'block';

      document.getElementById('btnEliminarFoto').style.display = 'inline-block';
    };
  };

  lector.readAsDataURL(archivo);
}

function eliminarFotoTecnico() {
  document.getElementById('tecFoto').value = '';
  document.getElementById('archivoFoto').value = '';

  const imgPreview = document.getElementById('previewFotoTecnico');
  if (imgPreview) {
    imgPreview.src = '';
    imgPreview.style.display = 'none';
  }

  const btnEliminar = document.getElementById('btnEliminarFoto');
  if (btnEliminar) btnEliminar.style.display = 'none';
}

// Renderizado de técnicos en pantalla
function renderizarTecnicos() {
  const grid = document.getElementById('gridTecnicos');
  if (!grid) return;
  grid.innerHTML = '';

  tecnicos.forEach((t, index) => {
    const fotoUrl = t.foto || avatarHombre;
    
    const card = document.createElement('div');
    card.className = 'card-tecnico';
    card.innerHTML = `
      <div class="acciones-tecnico">
        <button class="btn-icon" onclick="editarTecnico(${index})">✏️</button>
        <button class="btn-icon" onclick="eliminarTecnico(${index})">🗑️</button>
      </div>
      <img src="${fotoUrl}" alt="${t.nombre}">
      <h3 style="margin:5px 0; font-size:16px;">${t.nombre}</h3>
      <p style="font-size:12px; color:#666; margin:3px 0;"><b>Especialidad:</b> ${t.especialidad}</p>
      <p style="font-size:12px; color:#666; margin:3px 0;"><b>Edad:</b> ${t.edad} años</p>
      <span style="display:inline-block; background:#e0f2f1; color:#004d40; font-size:11px; padding:3px 8px; border-radius:12px; font-weight:bold; margin-top:5px;">
        ${t.empresa}
      </span>
      <p style="font-size:11px; color:#888; margin-top:5px;">⏱️ ${t.jornada}</p>
      <button onclick="verCuadroHorarios(${index})" style="width:100%; margin-top:10px; background:var(--secondary-color); color:white; border:none; padding:8px; border-radius:4px; font-size:12px; cursor:pointer;">
        📅 Ver Cuadro de Horarios
      </button>
    `;
    grid.appendChild(card);
  });
}

function cargarSelectTecnicos() {
  const select = document.getElementById('tecnico');
  if (!select) return;
  select.innerHTML = '<option value="">-- Seleccionar Técnico --</option>';

  tecnicos.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.nombre;
    opt.textContent = `${t.nombre} (${t.empresa})`;
    select.appendChild(opt);
  });
}

// Modal Técnico CRUD
function abrirModalFormTecnico() {
  document.getElementById('formTecnico').reset();
  document.getElementById('tecIndex').value = '';
  document.getElementById('tituloModalTecnico').textContent = 'Agregar Nuevo Técnico';
  eliminarFotoTecnico();
  document.getElementById('modalFormTecnico').style.display = 'block';
}

function cerrarModalFormTecnico() {
  document.getElementById('modalFormTecnico').style.display = 'none';
}

function guardarTecnico(e) {
  e.preventDefault();
  const index = document.getElementById('tecIndex').value;

  const nuevoTecnico = {
    nombre: document.getElementById('tecNombre').value,
    especialidad: document.getElementById('tecEspecialidad').value,
    edad: document.getElementById('tecEdad').value,
    empresa: document.getElementById('tecEmpresa').value,
    jornada: document.getElementById('tecJornada').value,
    foto: document.getElementById('tecFoto').value || avatarHombre
  };

  if (index === '') {
    tecnicos.push(nuevoTecnico);
  } else {
    tecnicos[index] = nuevoTecnico;
  }

  guardarEstadoLocal();
  renderizarTecnicos();
  cargarSelectTecnicos();
  cerrarModalFormTecnico();
}

function editarTecnico(index) {
  const t = tecnicos[index];
  document.getElementById('tecIndex').value = index;
  document.getElementById('tecNombre').value = t.nombre;
  document.getElementById('tecEspecialidad').value = t.especialidad;
  document.getElementById('tecEdad').value = t.edad;
  document.getElementById('tecEmpresa').value = t.empresa;
  document.getElementById('tecJornada').value = t.jornada;
  
  if (t.foto) {
    document.getElementById('tecFoto').value = t.foto;
    const imgPreview = document.getElementById('previewFotoTecnico');
    imgPreview.src = t.foto;
    imgPreview.style.display = 'block';
    document.getElementById('btnEliminarFoto').style.display = 'inline-block';
  } else {
    eliminarFotoTecnico();
  }

  document.getElementById('tituloModalTecnico').textContent = 'Editar Técnico';
  document.getElementById('modalFormTecnico').style.display = 'block';
}

function eliminarTecnico(index) {
  if (confirm(`¿Estás seguro de eliminar a ${tecnicos[index].nombre}?`)) {
    tecnicos.splice(index, 1);
    guardarEstadoLocal();
    renderizarTecnicos();
    cargarSelectTecnicos();
  }
}

// Mantenimientos CRUD
function guardarMantenimiento(e) {
  e.preventDefault();
  const id = document.getElementById('mantenimientoId').value;

  const item = {
    id: id ? id : Date.now().toString(),
    equipo: document.getElementById('equipo').value,
    tipo: document.getElementById('tipo').value,
    jornada: document.getElementById('jornada').value,
    fecha: document.getElementById('fecha').value,
    hora: document.getElementById('hora').value,
    tecnico: document.getElementById('tecnico').value
  };

  if (id) {
    const idx = mantenimientos.findIndex(m => m.id === id);
    if (idx !== -1) mantenimientos[idx] = item;
  } else {
    mantenimientos.push(item);
  }

  guardarEstadoLocal();
  renderizarMantenimientos();
  cancelarEdicionMantenimiento();
}

function renderizarMantenimientos() {
  const tbody = document.getElementById('tablaMantenimientos');
  if (!tbody) return;
  const filtro = document.getElementById('filtroTipo').value;
  tbody.innerHTML = '';

  const listaFiltrada = filtro === 'TODOS' ? mantenimientos : mantenimientos.filter(m => m.tipo === filtro);

  if (listaFiltrada.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888;">No hay mantenimientos agendados en el sistema.</td></tr>';
    return;
  }

  listaFiltrada.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.equipo}</td>
      <td><b>${m.tipo}</b></td>
      <td>${m.jornada}</td>
      <td>${m.fecha}</td>
      <td>${m.hora}</td>
      <td>${m.tecnico}</td>
      <td>
        <button class="btn-icon" onclick="editarMantenimiento('${m.id}')">✏️</button>
        <button class="btn-icon" onclick="eliminarMantenimiento('${m.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editarMantenimiento(id) {
  const m = mantenimientos.find(item => item.id === id);
  if (!m) return;

  document.getElementById('mantenimientoId').value = m.id;
  document.getElementById('equipo').value = m.equipo;
  document.getElementById('tipo').value = m.tipo;
  document.getElementById('jornada').value = m.jornada;
  document.getElementById('fecha').value = m.fecha;
  document.getElementById('hora').value = m.hora;
  document.getElementById('tecnico').value = m.tecnico;

  document.getElementById('tituloFormulario').textContent = 'Editar Mantenimiento';
  document.getElementById('btnGuardar').textContent = 'Actualizar Mantenimiento';
  document.getElementById('btnCancelar').style.display = 'inline-block';
}

function cancelarEdicionMantenimiento() {
  document.getElementById('formularioMantenimiento').reset();
  document.getElementById('mantenimientoId').value = '';
  document.getElementById('tituloFormulario').textContent = 'Programar Nuevo Mantenimiento';
  document.getElementById('btnGuardar').textContent = 'Guardar Mantenimiento';
  document.getElementById('btnCancelar').style.display = 'none';
}

function eliminarMantenimiento(id) {
  if (confirm('¿Eliminar este mantenimiento programado?')) {
    mantenimientos = mantenimientos.filter(m => m.id !== id);
    guardarEstadoLocal();
    renderizarMantenimientos();
  }
}

// Modal Ver Horario Técnico
function verCuadroHorarios(index) {
  const t = tecnicos[index];
  const modalHeader = document.getElementById('modalHeader');
  const modalContent = document.getElementById('modalHorarioContent');

  modalHeader.innerHTML = `
    <img src="${t.foto || avatarHombre}" style="width:60px; height:60px; border-radius:50%; object-fit:cover;">
    <div>
      <h3 style="margin:0; color:var(--primary-color);">${t.nombre}</h3>
      <p style="margin:2px 0; font-size:12px; color:#555;">${t.especialidad} - <b>${t.empresa}</b></p>
    </div>
  `;

  const trabajosAsignados = mantenimientos.filter(m => m.tecnico === t.nombre);

  if (trabajosAsignados.length === 0) {
    modalContent.innerHTML = '<p style="text-align:center; color:#777; padding:15px;">Este técnico no tiene mantenimientos asignados actualmente.</p>';
  } else {
    let tablaHTML = `
      <table>
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Hora</th>
          </tr>
        </thead>
        <tbody>
    `;
    trabajosAsignados.forEach(trabajo => {
      tablaHTML += `
        <tr>
          <td>${trabajo.equipo}</td>
          <td>${trabajo.tipo}</td>
          <td>${trabajo.fecha}</td>
          <td>${trabajo.hora}</td>
        </tr>
      `;
    });
    tablaHTML += '</tbody></table>';
    modalContent.innerHTML = tablaHTML;
  }

  document.getElementById('modalTecnico').style.display = 'block';
}

function cerrarModalTecnico() {
  document.getElementById('modalTecnico').style.display = 'none';
}