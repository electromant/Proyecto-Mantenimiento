// Configuración de Supabase
const SUPABASE_URL = 'https://jseocskipyhkmzatdplx.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_DbyAT_qBKj3hDVuBk0zUoQ_sWVAxmXz'; 

let supabaseClient = null;
try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn('Modo local activo.');
}

// Global variables
let mapa;
let marcadores = [];
let miUbicacionMarker = null;

// Icono Rojo para estaciones
const iconoRojo = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono Azul para la ubicación del Técnico en Tiempo Real
const iconoAzulTcnico = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Estaciones de recolección completas
const estacionesRecoleccion = [
  { nombre: 'Estación Refinería Central', descripcion: 'Planta principal de procesamiento e insumos', latitud: 7.0653, longitud: -73.8547 },
  { nombre: 'Estación El Centro', descripcion: 'Campo de extracción y compresión de gas (Cira-Infantas)', latitud: 6.9833, longitud: -73.7833 },
  { nombre: 'Estación Terminal Galán', descripcion: 'Punto de bombeo y almacenamiento de fluidos', latitud: 7.0811, longitud: -73.8622 },
  { nombre: 'Estación Lisama', descripcion: 'Subestación de distribución eléctrica y control', latitud: 6.9167, longitud: -73.6333 },
  { nombre: 'Estación Casabe', descripcion: 'Estación recolectora de fluidos Sector Yondó', latitud: 7.0345, longitud: -73.9123 },
  { nombre: 'Estación Yariguí - Cantagallo', descripcion: 'Estación de bombeo y transferencia fluvial', latitud: 7.1421, longitud: -73.8954 },
  { nombre: 'Estación Payoa', descripcion: 'Estación de recolección Sector Sabana de Torres', latitud: 7.3210, longitud: -73.5810 },
  { nombre: 'Estación Provincia', descripcion: 'Estación de recolección y separación Puerto Wilches', latitud: 7.3480, longitud: -73.9020 }
];

// Personal técnico completo
const listaTecnicos = [
  {
    nombre_completo: 'Ing. Carlos Mendoza',
    especialidad: 'Mantenimiento de Transformadores y Motores AC',
    edad: 38,
    empresa_aliada: 'Ecopetrol - Planta Central',
    jornada_habitual: 'Diurna (07:00 - 16:00)',
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    nombre_completo: 'Téc. Andrés Villamizar',
    especialidad: 'Sistemas de Protección Electrónica y Scada',
    edad: 31,
    empresa_aliada: 'Aliado UNIPAZ - Mantenimiento',
    jornada_habitual: 'Turno Rotativo (24/7)',
    foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    nombre_completo: 'Ing. Sofia Rodríguez',
    especialidad: 'Instrumentación Industrial y Subestaciones',
    edad: 29,
    empresa_aliada: 'Ecopetrol - Campo Cira Infantas',
    jornada_habitual: 'Diurna (07:00 - 16:00)',
    foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    nombre_completo: 'Ingrid Johana Gómez',
    especialidad: 'Mantenimiento de Bombas Electrosumergibles',
    edad: 34,
    empresa_aliada: 'Ecopetrol - Operaciones',
    jornada_habitual: 'Mañana (06:00 AM - 02:00 PM)',
    foto_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    nombre_completo: 'Téc. Jorge Martínez',
    especialidad: 'Generadores Electrógenos y Variadores de Frecuencia',
    edad: 42,
    empresa_aliada: 'Electromantenimiento Santander',
    jornada_habitual: 'Nocturna / Guardia',
    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];

function obtenerMantenimientosGuardados() {
  return JSON.parse(localStorage.getItem('mantenimientos_locales') || '[]');
}

function guardarMantenimientosLocal(lista) {
  localStorage.setItem('mantenimientos_locales', JSON.stringify(lista));
}

window.cambiarPestana = function(nombrePestana) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  const tabBtn = document.querySelector(`button[onclick="cambiarPestana('${nombrePestana}')"]`);
  const tabContent = document.getElementById(`tab-${nombrePestana}`);

  if (tabBtn && tabContent) {
    tabBtn.classList.add('active');
    tabContent.classList.add('active');
  }

  if (nombrePestana === 'mapa' && mapa) {
    setTimeout(() => {
      mapa.invalidateSize();
      if (marcadores.length > 0) {
        const group = new L.featureGroup(marcadores);
        mapa.fitBounds(group.getBounds().pad(0.1));
      }
    }, 200);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  inicializarMapa();
  cargarEstaciones();
  cargarTecnicosDirectorio();
  cargarTecnicosSelect();
  cargarMantenimientos();

  const form = document.getElementById('formularioMantenimiento');
  if (form) form.addEventListener('submit', guardarMantenimiento);

  const filtro = document.getElementById('filtroTipo');
  if (filtro) filtro.addEventListener('change', cargarMantenimientos);

  const btnCancel = document.getElementById('btnCancelar');
  if (btnCancel) btnCancel.addEventListener('click', limpiarFormulario);
});

function inicializarMapa() {
  const mapContainer = document.getElementById('mapaEstaciones');
  if (!mapContainer) return;

  mapa = L.map('mapaEstaciones', {
    zoomControl: true,
    fadeAnimation: true,
    markerZoomAnimation: true
  }).setView([7.0653, -73.8547], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    keepBuffer: 4,
    attribution: '© OpenStreetMap contributors - UNIPAZ / Ecopetrol'
  }).addTo(mapa);

  // Intentar obtener la posición del celular/dispositivo al abrir el mapa
  localizarCelularTecnico();
}

// Función para obtener la ubicación GPS en tiempo real del celular
function localizarCelularTecnico() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const lat = posicion.coords.latitude;
        const lng = posicion.coords.longitude;

        if (miUbicacionMarker) mapa.removeLayer(miUbicacionMarker);

        miUbicacionMarker = L.marker([lat, lng], { icon: iconoAzulTcnico }).addTo(mapa);
        miUbicacionMarker.bindPopup(`
          <div style="text-align:center; font-family:sans-serif;">
            <strong style="color:#0288d1;">📍 Tu Ubicación Actual</strong><br>
            <small>Personal Técnico en Campo</small>
          </div>
        `);
      },
      (error) => {
        console.warn('GPS no permitido o deshabilitado en el móvil:', error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
}

// Abrir Google Maps con la ruta hacia la estación
window.navegarAEstacionGPS = function(lat, lng, nombreEstacion) {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const miLat = posicion.coords.latitude;
        const miLng = posicion.coords.longitude;
        // URL universal para abrir la app de Mapas/Navegación del smartphone
        const urlRuta = `https://www.google.com/maps/dir/?api=1&origin=${miLat},${miLng}&destination=${lat},${lng}&travelmode=driving`;
        window.open(urlRuta, '_blank');
      },
      () => {
        // Si el usuario denegó el GPS, abre el destino directamente
        const urlRuta = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(urlRuta, '_blank');
      }
    );
  } else {
    const urlRuta = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(urlRuta, '_blank');
  }
};

function cargarEstaciones() {
  marcadores.forEach(m => mapa.removeLayer(m));
  marcadores = [];

  const bounds = L.latLngBounds();

  estacionesRecoleccion.forEach(estacion => {
    const marker = L.marker([estacion.latitud, estacion.longitud], { icon: iconoRojo }).addTo(mapa);
    
    const popupContent = `
      <div style="text-align: center; font-family: sans-serif; min-width: 190px;">
        <h3 style="margin: 0 0 5px 0; color: #004d40; font-size: 14px;">${estacion.nombre}</h3>
        <p style="margin: 0 0 10px 0; font-size: 11px; color: #555;">${estacion.descripcion}</p>
        
        <button onclick="navegarAEstacionGPS(${estacion.latitud}, ${estacion.longitud}, '${estacion.nombre}')" style="background: #0288d1; color: white; border: none; padding: 7px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%; font-weight: bold; margin-bottom: 6px;">
          🗺️ ¿Cómo llegar? (GPS Celular)
        </button>

        <button onclick="agendarDesdeMapa('${estacion.nombre}')" style="background: #004d40; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;">
          📅 Programar Mantenimiento
        </button>
      </div>
    `;

    marker.bindPopup(popupContent);
    marcadores.push(marker);
    bounds.extend([estacion.latitud, estacion.longitud]);
  });

  if (marcadores.length > 0) {
    setTimeout(() => {
      mapa.invalidateSize();
      mapa.fitBounds(bounds, { padding: [30, 30] });
    }, 200);
  }
}

window.agendarDesdeMapa = function(nombreEstacion) {
  cambiarPestana('agendamiento');
  const equipoInput = document.getElementById('equipo');
  if (equipoInput) equipoInput.value = `Estación: ${nombreEstacion}`;
};

function cargarTecnicosDirectorio() {
  const grid = document.getElementById('gridTecnicos');
  if (!grid) return;
  grid.innerHTML = '';

  window.tecnicosActuales = listaTecnicos;

  listaTecnicos.forEach((tec, idx) => {
    grid.innerHTML += `
      <div class="tecnico-card" onclick="verHorarioTecnico(${idx})" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; text-align: center; background: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <img src="${tec.foto_url}" alt="${tec.nombre_completo}" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 2px solid #004d40;">
        <h3 style="margin: 5px 0; color: #002b49; font-size: 16px;">${tec.nombre_completo}</h3>
        <p style="margin: 3px 0; font-size: 12px; color: #555;"><strong>Especialidad:</strong> ${tec.especialidad}</p>
        <p style="margin: 3px 0; font-size: 12px; color: #555;"><strong>Edad:</strong> ${tec.edad} años</p>
        <span style="display: inline-block; background: #e0f2f1; color: #004d40; font-size: 11px; padding: 3px 8px; border-radius: 12px; margin-top: 5px; font-weight: bold;">
          ${tec.empresa_aliada}
        </span>
        <div style="margin-top: 8px; font-size: 11px; color: #333; background: #f5f5f5; padding: 4px; border-radius: 4px;">
          ⏱️ Turno: ${tec.jornada_habitual}
        </div>
        <button style="margin-top: 10px; background: #004d40; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; width: 100%;">
          🔍 Ver Cuadro de Horarios
        </button>
      </div>
    `;
  });
}

// MOSTRAR VISTA CON CUADRO DE HORARIOS Y DISPONIBILIDAD DIARIA EXACTA
window.verHorarioTecnico = function(index) {
  const tec = window.tecnicosActuales[index];
  if (!tec) return;

  const modal = document.getElementById('modalTecnico');
  const modalHeader = document.getElementById('modalHeader');
  const modalContent = document.getElementById('modalHorarioContent');

  modalHeader.innerHTML = `
    <img src="${tec.foto_url}" style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover; border: 3px solid #004d40;">
    <div>
      <h3 style="margin:0; color:#002b49; font-size:18px;">${tec.nombre_completo}</h3>
      <p style="margin:2px 0; font-size:13px; color:#555;"><strong>Especialidad:</strong> ${tec.especialidad}</p>
      <small style="color:#004d40; font-weight:bold; background:#e0f2f1; padding:2px 8px; border-radius:4px;">⏱️ Jornada: ${tec.jornada_habitual}</small>
    </div>
  `;

  modal.style.display = 'block';

  const mantenimientos = obtenerMantenimientosGuardados().filter(m => m.tecnico === tec.nombre_completo);

  const horas = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const mapaDias = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };

  let html = `
    <table style="width:100%; border-collapse:collapse; font-size:11px; text-align:center;">
      <thead>
        <tr style="background:#004d40; color:white;">
          <th style="padding:10px; border:1px solid #00332c; min-width:60px;">Hora</th>
  `;

  diasSemana.forEach(dia => {
    html += `<th style="padding:10px; border:1px solid #00332c; min-width:110px;">${dia}</th>`;
  });

  html += `</tr></thead><tbody>`;

  horas.forEach(hora => {
    html += `<tr style="border-bottom:1px solid #eee;">`;
    html += `<td style="padding:8px; font-weight:bold; background:#f5f5f5; border:1px solid #ddd;">${hora}</td>`;

    diasSemana.forEach(dia => {
      const asignado = mantenimientos.find(m => {
        if (!m.fecha || !m.hora) return false;
        
        const partesFecha = m.fecha.split('-');
        const fechaObj = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
        const diaNombre = mapaDias[fechaObj.getDay()];

        const horaMant = m.hora.substring(0, 2);
        const horaFila = hora.substring(0, 2);

        return diaNombre === dia && horaMant === horaFila;
      });

      if (asignado) {
        html += `
          <td style="padding:6px; background:#ffebee; color:#c62828; border:1px solid #ffcdd2; font-weight:bold;">
            🔴 OCUPADO<br>
            <span style="font-size:10px; color:#333; font-weight:normal;">${asignado.equipo}</span>
          </td>
        `;
      } else {
        html += `
          <td style="padding:6px; background:#f1f8e9; color:#33691e; border:1px solid #dedeb8;">
            🟢 LIBRE
          </td>
        `;
      }
    });

    html += `</tr>`;
  });

  html += `</tbody></table>`;

  if (mantenimientos.length > 0) {
    html += `
      <div style="margin-top:15px; padding:10px; background:#fff8e1; border-left:4px solid #ffa000; border-radius:4px;">
        <h5 style="margin:0 0 5px 0; color:#b71c1c;">📌 Detalle de Mantenimientos Programados:</h5>
        <ul style="margin:0; padding-left:20px; font-size:11px; color:#333;">
    `;
    mantenimientos.forEach(m => {
      html += `<li><strong>Fecha:</strong> ${m.fecha} | <strong>Hora:</strong> ${m.hora || m.jornada} | <strong>Equipo:</strong> ${m.equipo} (${m.tipo})</li>`;
    });
    html += `</ul></div>`;
  } else {
    html += `
      <div style="margin-top:15px; padding:10px; background:#e8f5e9; border-left:4px solid #2e7d32; border-radius:4px;">
        <p style="margin:0; font-size:12px; color:#2e7d32; font-weight:bold;">✅ Técnico con disponibilidad completa sin agendamientos.</p>
      </div>
    `;
  }

  modalContent.innerHTML = html;
};

window.cerrarModalTecnico = function() {
  document.getElementById('modalTecnico').style.display = 'none';
};

window.onclick = function(event) {
  const modal = document.getElementById('modalTecnico');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

function cargarTecnicosSelect() {
  const select = document.getElementById('tecnico');
  if (!select) return;
  select.innerHTML = '<option value="">-- Seleccione un técnico del personal disponible --</option>';

  listaTecnicos.forEach(t => {
    select.innerHTML += `<option value="${t.nombre_completo}">${t.nombre_completo}</option>`;
  });
}

function guardarMantenimiento(e) {
  e.preventDefault();

  const id = document.getElementById('mantenimientoId').value;
  const equipo = document.getElementById('equipo').value;
  const tipo = document.getElementById('tipo').value;
  const jornada = document.getElementById('jornada').value;
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;
  const tecnico = document.getElementById('tecnico').value;

  if (!equipo || !tipo || !fecha || !tecnico) {
    alert('⚠️ Completa todos los campos del formulario.');
    return;
  }

  let mantenimientos = obtenerMantenimientosGuardados();

  const cruce = mantenimientos.find(m => m.tecnico === tecnico && m.fecha === fecha && m.jornada === jornada && m.id != id);
  if (cruce) {
    alert(`⚠️ ALERTA DE CRUCE DE HORARIOS:\nEl técnico ${tecnico} YA TIENE asignado un mantenimiento el día ${fecha} en la jornada ${jornada}.\n\nRevisa el cuadro de horarios para seleccionar otra hora.`);
    return;
  }

  const registro = {
    id: id ? id : 'MANT-' + Date.now(),
    equipo,
    tipo,
    jornada,
    fecha,
    hora,
    tecnico
  };

  if (id) {
    const idx = mantenimientos.findIndex(m => m.id == id);
    if (idx !== -1) mantenimientos[idx] = registro;
  } else {
    mantenimientos.push(registro);
  }

  guardarMantenimientosLocal(mantenimientos);

  alert('✅ ¡Mantenimiento agendado con éxito!');
  limpiarFormulario();
  cargarMantenimientos();
}

function cargarMantenimientos() {
  const filtroElem = document.getElementById('filtroTipo');
  if (!filtroElem) return;
  const filtro = filtroElem.value;
  
  let mantenimientos = obtenerMantenimientosGuardados();

  if (filtro !== 'TODOS') {
    mantenimientos = mantenimientos.filter(m => m.tipo === filtro);
  }

  const tbody = document.getElementById('tablaMantenimientos');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (mantenimientos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#666; padding:15px;">No hay mantenimientos agendados en el sistema.</td></tr>`;
    return;
  }

  mantenimientos.forEach(m => {
    tbody.innerHTML += `
      <tr>
        <td>${m.equipo}</td>
        <td><strong>${m.tipo}</strong></td>
        <td>${m.jornada}</td>
        <td>${m.fecha}</td>
        <td>${m.hora || '-'}</td>
        <td>${m.tecnico}</td>
        <td>
          <button onclick="imprimirOrdenTrabajo('${m.id}', '${m.equipo}', '${m.tipo}', '${m.jornada}', '${m.fecha}', '${m.hora}', '${m.tecnico}')" style="background:#2e7d32; color:white; border:none; border-radius:4px; padding:5px 8px; cursor:pointer; font-size:11px; margin-right:3px;">🖨️ OT</button>
          <button onclick="editarMantenimiento('${m.id}', '${m.equipo}', '${m.tipo}', '${m.jornada}', '${m.fecha}', '${m.hora}', '${m.tecnico}')" style="background:#0288d1; color:white; border:none; border-radius:4px; padding:5px 8px; cursor:pointer; font-size:11px;">Editar</button>
          <button class="btn-eliminar" onclick="eliminarMantenimiento('${m.id}')" style="background:#d32f2f; color:white; border:none; border-radius:4px; padding:5px 8px; cursor:pointer; font-size:11px;">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

window.imprimirOrdenTrabajo = function(id, equipo, tipo, jornada, fecha, hora, tecnico) {
  const numOT = `OT-2026-${String(id).replace(/\D/g,'').slice(-4)}`;
  
  const ventanaImpresion = window.open('', '_blank', 'width=800,height=900');
  ventanaImpresion.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Orden de Trabajo ${numOT}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #004d40; padding-bottom: 15px; margin-bottom: 20px; }
        .header h2 { color: #004d40; margin: 0; }
        .header-info { text-align: right; font-size: 12px; }
        .badge-ot { background: #004d40; color: white; padding: 5px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; }
        .section-title { background: #f0f4f8; color: #002b49; padding: 6px 10px; font-weight: bold; border-left: 4px solid #004d40; margin-top: 20px; font-size: 13px; }
        .grid-data { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; font-size: 13px; }
        .box { border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #fafafa; }
        .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px; font-size: 12px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div style="text-align: right; margin-bottom: 10px;">
        <button onclick="window.print()" style="background:#004d40; color:white; border:none; padding:8px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">🖨️ Imprimir / Guardar PDF</button>
      </div>

      <div class="header">
        <div>
          <h2>ORDEN DE TRABAJO DE MANTENIMIENTO</h2>
          <small>Convenio UNIPAZ - ECOPETROL | Gestión Operativa</small>
        </div>
        <div class="header-info">
          <span class="badge-ot">${numOT}</span><br>
          <small><strong>Fecha Emisión:</strong> ${new Date().toLocaleDateString()}</small>
        </div>
      </div>

      <div class="section-title">1. DATOS DE LA INTERVENCIÓN</div>
      <div class="grid-data">
        <div class="box"><strong>Equipo / Activo:</strong><br>${equipo}</div>
        <div class="box"><strong>Tipo de Mantenimiento:</strong><br>${tipo}</div>
        <div class="box"><strong>Fecha Programada:</strong><br>${fecha}</div>
        <div class="box"><strong>Hora y Jornada:</strong><br>${hora || 'No especificada'} (${jornada})</div>
      </div>

      <div class="section-title">2. PERSONAL TÉCNICO ASIGNADO</div>
      <div class="box" style="margin-top: 10px; font-size: 13px;">
        <strong>Técnico Responsable:</strong> ${tecnico}<br>
        <strong>Estado:</strong> <span style="color: #c62828; font-weight: bold;">PROGRAMADO</span>
      </div>

      <div class="section-title">3. DESCRIPCIÓN DE ACTIVIDADES</div>
      <div class="box" style="margin-top: 10px; height: 90px; font-size: 12px; color: #777;">
        [ Inspección, lubricación, ajuste electromecánico y pruebas del sistema ]
      </div>

      <div class="signatures">
        <div class="signature-box"><strong>Firma Técnico Responsable</strong><br>${tecnico}</div>
        <div class="signature-box"><strong>Firma Supervisor de Planta</strong><br>UNIPAZ / ECOPETROL</div>
      </div>
    </body>
    </html>
  `);
  ventanaImpresion.document.close();
};

window.editarMantenimiento = function(id, equipo, tipo, jornada, fecha, hora, tecnico) {
  document.getElementById('mantenimientoId').value = id;
  document.getElementById('equipo').value = equipo;
  document.getElementById('tipo').value = tipo;
  document.getElementById('jornada').value = jornada;
  document.getElementById('fecha').value = fecha;
  document.getElementById('hora').value = hora;
  document.getElementById('tecnico').value = tecnico;

  document.getElementById('tituloFormulario').innerText = 'Editar Mantenimiento';
  document.getElementById('btnGuardar').innerText = 'Actualizar Mantenimiento';
  document.getElementById('btnCancelar').style.display = 'inline-block';
};

window.eliminarMantenimiento = function(id) {
  if (confirm('¿Desea eliminar este agendamiento?')) {
    let mantenimientos = obtenerMantenimientosGuardados().filter(m => m.id != id);
    guardarMantenimientosLocal(mantenimientos);
    cargarMantenimientos();
  }
};

function limpiarFormulario() {
  const form = document.getElementById('formularioMantenimiento');
  if (form) form.reset();
  document.getElementById('mantenimientoId').value = '';
  document.getElementById('tituloFormulario').innerText = 'Programar Nuevo Mantenimiento';
  document.getElementById('btnGuardar').innerText = 'Guardar Mantenimiento';
  document.getElementById('btnCancelar').style.display = 'none';
}