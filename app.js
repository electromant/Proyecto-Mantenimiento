// CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE
const SUPABASE_URL = "https://jseocskipyhkmzatdplx.supabase.co";
const SUPABASE_KEY = "sb_publishable_DbyAT_qBKj3hDVuBk0zUoQ_sWVAxMx2";

window.supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
var supabase = window.supabaseClient;

// DATOS INICIALES Y UBICACIONES GEOGRÁFICAS

// Variable global para controlar la instancia del mapa Leaflet
let mapInstance = null;

// Variable global para almacenar el rol activo ("Supervisor" o "Técnico")
let rolUsuarioActual = localStorage.getItem('user_role') || "Supervisor";

const estacionesUbicaciones = [
    {
        nombre: "Campo La Cira Infantas - Estación Cira 1",
        lat: 6.9531,
        lng: -73.7485,
        descripcion: "Estación principal de recolección e inyección."
    },
    {
        nombre: "Estación Barrancabermeja Principal",
        lat: 7.0653,
        lng: -73.8547,
        descripcion: "Centro logístico y de bombeo electromecánico."
    },
    {
        nombre: "Refinería de Barrancabermeja - Unidad 2",
        lat: 7.0602,
        lng: -73.8491,
        descripcion: "Unidad de procesamiento térmico y refinación."
    },
    {
        nombre: "Estación de Bombeo Lisama",
        lat: 7.0425,
        lng: -73.5931,
        descripcion: "Punto de recolección y bombeo del sector Lisama."
    },
    {
        nombre: "Campo Cantagallo - Estación Recolectora",
        lat: 7.3781,
        lng: -73.9182,
        descripcion: "Planta de tratamiento de crudo en área Cantagallo."
    },
    {
        nombre: "Campo Casabe - Estación Central",
        lat: 7.0518,
        lng: -73.8825,
        descripcion: "Supervisión electromecánica e inyección del sector Casabe."
    },
    {
        nombre: "Planta de Gas Tibú",
        lat: 8.6385,
        lng: -72.7358,
        descripcion: "Compresión y tratamiento de gas natural."
    },
    {
        nombre: "Estación Orito - Putumayo",
        lat: 0.6681,
        lng: -76.8722,
        descripcion: "Centro operativo de distribución electromecánica del sur."
    }
];

let listaTecnicos = JSON.parse(localStorage.getItem('tecnicos_data')) || [
    {
        id: 1,
        nombre: "Ing. Fabio Blanco",
        especialidad: "Especialista Electromecánico",
        correo: "maffiold94@gmail.com",
        telefono: "+57 312 456 7890",
        empresa: "ECOPETROL S.A.",
        foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    {
        id: 2,
        nombre: "Ing. Harold Abaunzaque",
        especialidad: "Supervisor de Mantenimiento",
        correo: "harold.abaunzaque@unipaz.edu.co",
        telefono: "+57 310 987 6543",
        empresa: "UNIPAZ",
        foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    }
];

let listaOrdenes = JSON.parse(localStorage.getItem('ordenes_data')) || [
    {
        id: "ORD-101",
        estacion: "Campo La Cira Infantas - Estación Cira 1",
        tipo: "Correctivo",
        jornada: "Diurna (07:00 AM - 04:00 PM)",
        fecha: "2026-10-14",
        hora: "09:10",
        tecnico: "Ing. Fabio Blanco",
        correo: "maffiold94@gmail.com"
    }
];

// Función para controlar vistas y permisos según el rol activo
function aplicarPermisosPorRol() {
    // 1. Obtener el rol guardado en localStorage o la variable global
    const rolActual = localStorage.getItem("rolUsuario") || rolUsuarioActual || "Supervisor";
    const esTecnico = (rolActual === "Técnico");

    // 2. Ocultar o mostrar el botón de "Guardar y Notificar Orden"
    const btnGuardarOrden = document.querySelector("#formOrden button[type='submit']");
    if (btnGuardarOrden) {
        btnGuardarOrden.style.display = esTecnico ? "none" : "inline-block";
    }

    // 3. Ocultar o mostrar el botón de "Agregar Técnico"
    const btnAgregarTecnico = document.getElementById("btnAbrirModalTecnico") || document.querySelector("button[onclick*='modalTecnico']");
    if (btnAgregarTecnico) {
        btnAgregarTecnico.style.display = esTecnico ? "none" : "inline-block";
    }

    // 4. Bloquear/desbloquear los inputs del formulario para el Técnico
    const formOrden = document.getElementById("formOrden");
    if (formOrden) {
        const elementos = formOrden.querySelectorAll("input, select, textarea");
        elementos.forEach(elem => {
            if (esTecnico) {
                elem.setAttribute("disabled", "true");
            } else {
                elem.removeAttribute("disabled");
            }
        });
    }

    // 5. Ocultar botones de acción (eliminar/editar) en la tabla si es Técnico
    const btnesEliminar = document.querySelectorAll(".btn-action-icon, .btn-eliminar");
    btnesEliminar.forEach(btn => {
        btn.style.display = esTecnico ? "none" : "inline-block";
    });
}
document.addEventListener("DOMContentLoaded", () => {
    cargarSelectTecnicos();
    renderizarTecnicos(listaTecnicos);
    renderizarOrdenes();
    aplicarPermisosPorRol();
});

// ==========================================
// 1. INICIALIZACIÓN DEL MAPA LEAFLET
// ==========================================

window.inicializarMapa = function() {
    const mapDiv = document.getElementById('mapaLeaflet') || document.getElementById('map');
    if (!mapDiv) return;

    // Si ya existe la instancia, solo forzamos que recalcule el tamaño del contenedor
    if (mapInstance !== null) {
        setTimeout(() => { mapInstance.invalidateSize(); }, 200);
        return;
    }

    // Crear mapa centrado en las coordenadas principales
    mapInstance = L.map(mapDiv.id).setView([7.0653, -73.8547], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Dibujar marcadores
    if (typeof estacionesUbicaciones !== 'undefined' && Array.isArray(estacionesUbicaciones)) {
        estacionesUbicaciones.forEach(est => {
            if (est.lat && est.lng) {
                L.marker([est.lat, est.lng])
                    .addTo(mapInstance)
                    .bindPopup(`<b>${est.nombre}</b><br>${est.descripcion || ''}`);
            }
        });
    }

    setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
    }, 300);
};


// ==========================================
// 2. GESTIÓN Y CRUD DE TÉCNICOS (LOCALSTORAGE)
// ==========================================

// Obtener lista o inicializar con el técnico por defecto (Harold)
function obtenerTecnicos() {
    let tecnicos = JSON.parse(localStorage.getItem('tecnicos'));
    if (!tecnicos || tecnicos.length === 0) {
        tecnicos = [
            {
                id: 1,
                nombre: "Ing. Harold Abaunzaque",
                cargo: "Supervisor de Mantenimiento",
                correo: "harold.abaunzaque@unipaz.edu.co",
                telefono: "+57 310 987 6543",
                empresa: "UNIPAZ"
            }
        ];
        localStorage.setItem('tecnicos', JSON.stringify(tecnicos));
    }
    return tecnicos;
}

// Renderizar tarjetas de técnicos en el directorio
window.renderizarTecnicos = function() {
    const contenedor = document.getElementById('contenedor-tecnicos') || 
                       document.getElementById('directorioTecnicos') || 
                       document.getElementById('sec-tecnicos');
    
    if (!contenedor) return;

    const tecnicos = obtenerTecnicos();

    // Si existe una cuadrícula/contenedor específico de tarjetas dentro de la sección
    const grid = contenedor.querySelector('.tecnicos-grid') || contenedor;

    grid.innerHTML = tecnicos.map(tec => `
        <div class="tecnico-card" style="border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; margin: 15px 0; background: #fff; position: relative;">
            <div style="position: absolute; top: 15px; right: 15px; display: flex; gap: 8px;">
                <button onclick="editarTecnico('${tec.id}')" title="Editar" style="background: none; border: none; cursor: pointer; color: #444;">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="eliminarTecnico('${tec.id}')" title="Eliminar" style="background: none; border: none; cursor: pointer; color: #d9534f;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div style="text-align: center;">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(tec.nombre)}&background=0D47A1&color=fff" 
                     alt="${tec.nombre}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">
                <h3 style="margin: 5px 0;">${tec.nombre}</h3>
                <p style="color: #666; font-size: 14px; margin: 2px 0;">${tec.cargo || 'Técnico'}</p>
                <p style="color: #888; font-size: 13px; margin: 2px 0;"><i class="fa-solid fa-envelope"></i> ${tec.correo}</p>
                <p style="color: #888; font-size: 13px; margin: 2px 0;"><i class="fa-solid fa-phone"></i> ${tec.telefono || 'Sin teléfono'}</p>
                <span style="display: inline-block; background: #e8f5e9; color: #2e7d32; font-size: 12px; padding: 3px 8px; border-radius: 4px; margin-top: 8px;">
                    ${tec.empresa || 'UNIPAZ'}
                </span>
            </div>
        </div>
    `).join('');
};

// Crear nuevo técnico
window.abrirModalAgregarTecnico = window.agregarTecnico = function() {
    const nombre = prompt("Nombre completo del técnico:");
    if (!nombre) return;

    const cargo = prompt("Cargo o especialidad:", "Técnico de Mantenimiento");
    const correo = prompt("Correo electrónico:");
    const telefono = prompt("Teléfono de contacto:");
    const empresa = prompt("Empresa / Institución:", "UNIPAZ");

    const tecnicos = obtenerTecnicos();
    const nuevoTecnico = {
        id: Date.now(), // ID único numérico
        nombre: nombre,
        cargo: cargo || "Técnico",
        correo: correo || "",
        telefono: telefono || "",
        empresa: empresa || "UNIPAZ"
    };

    tecnicos.push(nuevoTecnico);
    localStorage.setItem('tecnicos', JSON.stringify(tecnicos));
    alert("¡Técnico creado con éxito!");

    renderizarTecnicos();
    if (typeof cargarSelectTecnicos === 'function') cargarSelectTecnicos();
};

// Editar técnico (soporta ID numérico y tipo String)
window.editarTecnico = function(id) {
    const tecnicos = obtenerTecnicos();
    // Comparación flexible (==) para ignorar diferencias entre número y string
    const index = tecnicos.findIndex(t => t.id == id);

    if (index === -1) {
        alert("Técnico no encontrado.");
        return;
    }

    const tec = tecnicos[index];
    const nuevoNombre = prompt("Editar Nombre:", tec.nombre);
    if (nuevoNombre === null) return;

    const nuevoCargo = prompt("Editar Cargo/Especialidad:", tec.cargo || "");
    if (nuevoCargo === null) return;

    const nuevoCorreo = prompt("Editar Correo:", tec.correo || "");
    if (nuevoCorreo === null) return;

    const nuevoTelefono = prompt("Editar Teléfono:", tec.telefono || "");
    if (nuevoTelefono === null) return;

    // Actualizar campos
    tecnicos[index].nombre = nuevoNombre;
    tecnicos[index].cargo = nuevoCargo;
    tecnicos[index].correo = nuevoCorreo;
    tecnicos[index].telefono = nuevoTelefono;

    localStorage.setItem('tecnicos', JSON.stringify(tecnicos));
    alert("¡Datos del técnico actualizados correctamente!");

    renderizarTecnicos();
    if (typeof cargarSelectTecnicos === 'function') cargarSelectTecnicos();
};

// Eliminar técnico
window.eliminarTecnico = function(id) {
    if (!confirm("¿Deseas eliminar este técnico del directorio?")) return;

    let tecnicos = obtenerTecnicos();
    tecnicos = tecnicos.filter(t => t.id != id);

    localStorage.setItem('tecnicos', JSON.stringify(tecnicos));
    renderizarTecnicos();
    if (typeof cargarSelectTecnicos === 'function') cargarSelectTecnicos();
};


// ==========================================
// 3. CAMBIO DE PESTAÑA Y ACTIVACIÓN VISTA
// ==========================================
window.cambiarPestana = window.cambiarTab = function(tabName, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(`sec-${tabName}`) || document.getElementById(tabName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    if (element) {
        element.classList.add('active');
    } else if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    // Acciones específicas según la pestaña
    if (tabName === 'mapa') {
        setTimeout(() => {
            inicializarMapa();
        }, 200);
    } else if (tabName === 'tecnicos' || tabName === 'directorio') {
        renderizarTecnicos();
    }
};

// Cargar la vista de técnicos e inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    renderizarTecnicos();
});

// INGRESO, SALIDA Y ROLES
   

window.ejecutarIngresoDirecto = function() {
    const email = document.getElementById("loginEmail").value || "harold.abaunzaque@unipaz.edu.co";
    const role = document.getElementById("loginRole").value || "Supervisor";

    rolUsuarioActual = role;
    localStorage.setItem('user_role', role);

    const badge = document.getElementById("userBadgeRole");
    if (badge) {
        badge.textContent = `Rol: ${role} (${email})`;
    }

    const overlay = document.getElementById("loginOverlay");
    if (overlay) {
        overlay.style.display = "none";
    }

    document.body.classList.remove("not-logged-in");

    aplicarPermisosPorRol();
};

    // Aplicar restricciones de lectura/escritura según el rol seleccionado
    aplicarPermisosPorRol();

    if (window.Swal) {
        Swal.fire({
            title: '¡Bienvenido!',
            text: `Sesión iniciada como ${role}`,
            icon: 'success',
            timer: 1200,
            showConfirmButton: false
        });
    }
}

function aplicarPermisosPorRol() {
    // 1. Ocultar o mostrar formulario de creación de órdenes
    const formCard = document.querySelector("#tab-ordenes .card:first-child");
    if (formCard) {
        formCard.style.display = (rolUsuarioActual === "Técnico") ? "none" : "block";
    }

    // 2. Ocultar o mostrar botón de registrar nuevo técnico
    const btnRegistrarTec = document.querySelector("button[onclick='abrirModalTecnico()']");
    if (btnRegistrarTec) {
        btnRegistrarTec.style.display = (rolUsuarioActual === "Técnico") ? "none" : "inline-block";
    }

    // 3. Volver a renderizar tablas y tarjetas para actualizar visibilidad de botones
    renderizarTecnicos(listaTecnicos);
    renderizarOrdenes();
}

function cerrarSesion() {
    if (window.Swal) {
        Swal.fire({
            title: '¿Cerrar Sesión?',
            text: "Saldrás del sistema de gestión.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#004d40',
            cancelButtonColor: '#d32f2f',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const overlay = document.getElementById("loginOverlay");
                if (overlay) overlay.style.display = "flex";
                document.body.classList.add("not-logged-in");
            }
        });
    } else {
        const overlay = document.getElementById("loginOverlay");
        if (overlay) overlay.style.display = "flex";
        document.body.classList.add("not-logged-in");
    }
}

// NAVEGACIÓN TAB Y CARGA DE MAPA
   
window.cambiarPestana = window.cambiarTab = function(tabName, element) {
    // 1. Ocultar todos los contenidos de pestaña
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // 2. Desactivar todos los botones
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // 3. Mapear posibles nombres de ID según lo que venga en tabName
    let targetId = tabName;
    if (tabName === 'tecnicos') targetId = 'directorio';

    // Intentar buscar el elemento por distintas variantes de ID habituales
    let activeTab = document.getElementById(`tab-${targetId}`) || 
                    document.getElementById(`tab-${tabName}`) || 
                    document.getElementById(targetId) || 
                    document.getElementById(tabName) ||
                    document.getElementById('tab-agendamiento'); // Respaldo para agendamiento

    // Si no encontró nada, tomamos la pestaña por índice para evitar pantalla blanca
    if (!activeTab && tabs.length > 0) {
        if (tabName === 'agendamiento') activeTab = tabs[0];
        else if (tabName === 'mapa') activeTab = tabs[1];
        else if (tabName === 'tecnicos' || tabName === 'directorio') activeTab = tabs[2];
    }

    if (activeTab) {
        activeTab.classList.add('active');
    }

    // 4. Marcar el botón activo
    if (element) {
        element.classList.add('active');
    } else if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    // 5. Si la pestaña es el mapa, forzar inicialización / redimensionamiento
    if (tabName === 'mapa') {
        setTimeout(() => {
            if (typeof inicializarMapa === 'function' && mapInstance === null) {
                inicializarMapa();
            } else if (mapInstance) {
                mapInstance.invalidateSize();
            }
        }, 200);
    }
};

// GESTIÓN Y ENVÍO DE ÓRDENES (EMAILJS)
// ==========================================
// POBLAR DESPLEGABLES (AGENDAMIENTO)
// ==========================================
window.cargarSelectEstaciones = function() {
    // Buscar específicamente el selector dentro del formulario de agendamiento
    const select = document.getElementById("ordenEstacion") || 
                   document.querySelector("#sec-agendamiento select") ||
                   document.querySelector("select[name='estacion']");

    if (!select) return;

    const estaciones = (typeof estacionesUbicaciones !== 'undefined' && estacionesUbicaciones.length > 0) 
        ? estacionesUbicaciones 
        : [
            { nombre: "Campo La Cira Infantas - Estación Cira 1" },
            { nombre: "Estación Barrancabermeja Principal" },
            { nombre: "Campus UNIPAZ" }
        ];

    select.innerHTML = '<option value="">-- Seleccione Ubicación --</option>';
    estaciones.forEach(e => {
        const option = document.createElement("option");
        option.value = e.nombre;
        option.textContent = e.nombre;
        select.appendChild(option);
    });
};

window.cargarSelectTecnicos = function() {
    const select = document.getElementById("tecnicoSelect");
    if (!select) return;

    const tecnicos = JSON.parse(localStorage.getItem('tecnicos')) || [];

    select.innerHTML = '<option value="">-- Seleccione Técnico --</option>';
    tecnicos.forEach(t => {
        const option = document.createElement("option");
        option.value = t.nombre;
        // Se guarda el correo como atributo dataset.correo
        option.setAttribute("data-correo", t.correo || "");
        option.textContent = `${t.nombre} (${t.empresa || 'UNIPAZ - ECOPETROL'})`;
        select.appendChild(option);
    });
};

window.autocompletarCorreoTecnico = function() {
    const select = document.getElementById("tecnicoSelect");
    const inputCorreo = document.getElementById("correoNotificacion");

    if (select && inputCorreo) {
        const selectedOption = select.options[select.selectedIndex];
        const correo = selectedOption ? selectedOption.getAttribute("data-correo") : "";
        inputCorreo.value = correo || "";
    }
};

window.cargarArchivoFotoModal = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            document.getElementById('modalTecnicoFoto').value = base64Image;
            document.getElementById('modalVistaPreviaFoto').src = base64Image;
        };
        reader.readAsDataURL(file);
    }
};

function guardarOrden(e) {
    if (e) e.preventDefault();

    if (rolUsuarioActual === "Técnico") {
        Swal.fire('Acceso denegado', 'El rol Técnico solo tiene permisos de lectura', 'error');
        return;
    }

    const selectTec = document.getElementById("tecnicoSelect");
    const optionSel = selectTec && selectTec.selectedIndex !== -1 ? selectTec.options[selectTec.selectedIndex] : null;
    const correoTecnico = optionSel ? (optionSel.dataset.correo || optionSel.getAttribute("data-correo") || "") : "";

    const nuevaOrden = {
        id: "ORD-" + Math.floor(100 + Math.random() * 900),
        estacion: document.getElementById("ordenEstacion") ? document.getElementById("ordenEstacion").value : "",
        tipo: document.getElementById("ordenTipo") ? document.getElementById("ordenTipo").value : "",
        jornada: document.getElementById("jornadaSelect") ? document.getElementById("jornadaSelect").value : "",
        fecha: document.getElementById("fechaOrden") ? document.getElementById("fechaOrden").value : "",
        hora: document.getElementById("horaOrden") ? document.getElementById("horaOrden").value : "",
        tecnico: selectTec ? selectTec.value : "",
        correo: document.getElementById("correoNotificacion") ? document.getElementById("correoNotificacion").value : correoTecnico
    };

    listaOrdenes.unshift(nuevaOrden);
    localStorage.setItem('ordenes_data', JSON.stringify(listaOrdenes));

    renderizarOrdenes();
    const formOrden = document.getElementById("formOrden");
    if (formOrden) formOrden.reset();

    enviarNotificacionEmail(nuevaOrden);
}

function renderizarOrdenes() {
    const tbody = document.getElementById("tablaOrdenesBody");
    if (!tbody) return;

    const filtro = document.getElementById("filtroTipo") ? document.getElementById("filtroTipo").value : "Todos";
    tbody.innerHTML = "";

    const ordenesFiltradas = filtro === "Todos" 
        ? listaOrdenes 
        : listaOrdenes.filter(o => o.tipo === filtro);

    if (ordenesFiltradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: #888;">No hay órdenes registradas.</td></tr>`;
        return;
    }

    const esTecnico = (rolUsuarioActual === "Técnico");

    ordenesFiltradas.forEach(orden => {
        const tr = document.createElement("tr");
        
        // Si el usuario es Técnico, no se muestran botones de acción
        const botonesAccion = esTecnico 
            ? `<span style="font-size: 12px; color: #888;">Lectura</span>`
            : `<button class="btn-action-icon" onclick="reenviarNotificacion('${orden.id}')" title="Reenviar Notificación por Correo">
                    <i class="fa-solid fa-paper-plane" style="color: #0288d1;"></i>
               </button>
               <button class="btn-action-icon delete" onclick="eliminarOrden('${orden.id}')" title="Eliminar Orden">
                    <i class="fa-solid fa-trash-can"></i>
               </button>`;

        tr.innerHTML = `
            <td><strong>${orden.estacion}</strong></td>
            <td><span class="badge-tipo ${orden.tipo.toLowerCase()}">${orden.tipo}</span></td>
            <td>${orden.jornada}</td>
            <td>${orden.fecha}</td>
            <td>${orden.hora}</td>
            <td>${orden.tecnico}</td>
            <td>${orden.correo}</td>
            <td>${botonesAccion}</td>
        `;
        tbody.appendChild(tr);
    });
}

function reenviarNotificacion(idOrden) {
    if (rolUsuarioActual === "Técnico") return;
    const orden = listaOrdenes.find(o => o.id === idOrden);
    if (orden) {
        enviarNotificacionEmail(orden);
    }
}

function eliminarOrden(idOrden) {
    if (rolUsuarioActual === "Técnico") return;

    Swal.fire({
        title: '¿Eliminar orden?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d32f2f',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            listaOrdenes = listaOrdenes.filter(o => o.id !== idOrden);
            localStorage.setItem('ordenes_data', JSON.stringify(listaOrdenes));
            renderizarOrdenes();
            Swal.fire('Eliminado', 'La orden ha sido removida.', 'success');
        }
    });
}

function enviarNotificacionEmail(orden) {
    // 1. Mostrar estado de envío
    Swal.fire({
        title: 'Enviando correo...',
        text: 'Por favor espera mientras se notifica al técnico.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // 2. Tu Public Key de EmailJS
    const publicKey = 'JE11549ZTfvlO5Ozg'; 
    const serviceID = 'service_nzn02hp'; 
    const templateID = 'template_uadyeyr'; 

    if (typeof emailjs !== 'undefined') {
        emailjs.init(publicKey);

        // Nombres de variables coincidentes con tu plantilla de la imagen
        const templateParams = {
            to_email: orden.correo,
            tecnico_nombre: orden.tecnico,
            equipo_estacion: orden.estacion,
            tipo_mantenimiento: orden.tipo,
            jornada_trabajo: orden.jornada,
            fecha_mantenimiento: orden.fecha,
            hora_mantenimiento: orden.hora
        };

        emailjs.send(serviceID, templateID, templateParams)
            .then((response) => {
                console.log('Correo enviado con éxito:', response.status, response.text);
                Swal.fire({
                    icon: 'success',
                    title: '¡Orden Guardada y Notificada!',
                    text: `Se ha enviado el correo automáticamente a ${orden.correo}`
                });
            })
            .catch((error) => {
                console.error('Error enviando con EmailJS:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar correo',
                    text: `Revisa tu Service ID en EmailJS: ${error.text || JSON.stringify(error)}`
                });
            });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Librería no cargada',
            text: 'No se encontró el SDK de EmailJS en index.html'
        });
    }
}

function abrirCorreoRespaldo(orden) {
    if (orden.correo) {
        const asunto = encodeURIComponent(`Nueva Orden Asignada: ${orden.id} - ${orden.estacion}`);
        const cuerpo = encodeURIComponent(
            `Hola ${orden.tecnico},\n\n` +
            `Se te ha asignado la siguiente orden de mantenimiento:\n` +
            `- Estación/Equipo: ${orden.estacion}\n` +
            `- Tipo: ${orden.tipo}\n` +
            `- Fecha: ${orden.fecha} - ${orden.hora}\n` +
            `- Jornada: ${orden.jornada}\n\n` +
            `Atentamente,\nGestión de Mantenimientos UNIPAZ - ECOPETROL`
        );
        window.open(`mailto:${orden.correo}?subject=${asunto}&body=${cuerpo}`, '_self');
    }
    Swal.fire('Orden Agendada', 'La orden se guardó correctamente.', 'success');
}

// DIRECTORIO DE TÉCNICOS
   
function renderizarTecnicos(lista) {
    const grid = document.getElementById("gridTecnicos");
    if (!grid) return;
    grid.innerHTML = "";

    const esTecnico = (rolUsuarioActual === "Técnico");

    lista.forEach(tec => {
        const card = document.createElement("div");
        card.className = "card-tecnico";

        // Muestra los botones de edición solo si es Supervisor
        const accionesHtml = esTecnico ? '' : `
            <div class="card-tecnico-actions">
                <button class="btn-action-icon" onclick="editarTecnico('${tec.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-action-icon delete" onclick="eliminarTecnico('${tec.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;

        card.innerHTML = `
            ${accionesHtml}
            <img src="${tec.foto}" alt="${tec.nombre}" class="tecnico-img" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${tec.nombre}</h3>
            <p class="especialidad">${tec.especialidad}</p>
            <p class="info-item"><i class="fa-solid fa-envelope"></i> ${tec.correo}</p>
            <p class="info-item"><i class="fa-solid fa-phone"></i> ${tec.telefono}</p>
            <span class="badge-empresa">${tec.empresa}</span>
        `;
        grid.appendChild(card);
    });
}

function filtrarTecnicos() {
    const texto = document.getElementById("buscarTecnico").value.toLowerCase();
    const filtrados = listaTecnicos.filter(t => 
        t.nombre.toLowerCase().includes(texto) || 
        t.especialidad.toLowerCase().includes(texto)
    );
    renderizarTecnicos(filtrados);
}

function abrirModalTecnico() {
    if (rolUsuarioActual === "Técnico") return;
    document.getElementById("formTecnico").reset();
    document.getElementById("tecnicoId").value = "";
    document.getElementById("modalTecnicoTitulo").innerHTML = '<i class="fa-solid fa-user-plus"></i> Registrar Nuevo Técnico';
    document.getElementById("imgPreview").src = "https://via.placeholder.com/150";
    document.getElementById("modalTecnico").style.display = "flex";
}

function cerrarModalTecnico() {
    document.getElementById("modalTecnico").style.display = "none";
}

function guardarTecnico(e) {
    e.preventDefault();
    if (rolUsuarioActual === "Técnico") return;

    const id = document.getElementById("tecnicoId").value;
    const nombre = document.getElementById("tecNombre").value;
    const especialidad = document.getElementById("tecEspecialidad").value;
    const correo = document.getElementById("tecCorreo").value;
    const telefono = document.getElementById("tecTelefono").value;
    const empresa = document.getElementById("tecEmpresa").value;
    let foto = document.getElementById("tecFotoUrl").value || document.getElementById("imgPreview").src;

    if (!foto || foto.includes("placeholder.com")) {
        foto = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
    }

    if (id) {
        const index = listaTecnicos.findIndex(t => t.id == id);
        if (index !== -1) {
            listaTecnicos[index] = { id: listaTecnicos[index].id, nombre, especialidad, correo, telefono, empresa, foto };
        }
    } else {
        const nuevoTec = {
            id: Date.now(),
            nombre,
            especialidad,
            correo,
            telefono,
            empresa,
            foto
        };
        listaTecnicos.push(nuevoTec);
    }

    localStorage.setItem('tecnicos_data', JSON.stringify(listaTecnicos));
    renderizarTecnicos(listaTecnicos);
    cargarSelectTecnicos();
    cerrarModalTecnico();

    Swal.fire('Guardado', 'Técnico procesado exitosamente', 'success');
}

function editarTecnico(id) {
    if (rolUsuarioActual === "Técnico") return;

    const tec = listaTecnicos.find(t => t.id == id);
    if (!tec) return;

    document.getElementById("tecnicoId").value = tec.id;
    document.getElementById("tecNombre").value = tec.nombre;
    document.getElementById("tecEspecialidad").value = tec.especialidad;
    document.getElementById("tecCorreo").value = tec.correo;
    document.getElementById("tecTelefono").value = tec.telefono;
    document.getElementById("tecEmpresa").value = tec.empresa;
    document.getElementById("tecFotoUrl").value = tec.foto;
    document.getElementById("imgPreview").src = tec.foto;

    document.getElementById("modalTecnicoTitulo").innerHTML = '<i class="fa-solid fa-user-pen"></i> Editar Técnico';
    document.getElementById("modalTecnico").style.display = "flex";
}

function eliminarTecnico(id) {
    if (rolUsuarioActual === "Técnico") return;

    Swal.fire({
        title: '¿Eliminar técnico?',
        text: "Esta persona ya no aparecerá disponible para asignar en nuevas órdenes.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d32f2f',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            listaTecnicos = listaTecnicos.filter(t => t.id != id);
            
            localStorage.setItem('tecnicos_data', JSON.stringify(listaTecnicos));
            
            renderizarTecnicos(listaTecnicos);
            cargarSelectTecnicos();

            Swal.fire('Eliminado', 'El técnico ha sido removido exitosamente.', 'success');
        }
    });
}

function actualizarPreviewFoto() {
    const url = document.getElementById("tecFotoUrl").value;
    if (url) {
        document.getElementById("imgPreview").src = url;
    }
}

function cargarFotoLocal(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("imgPreview").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Función para editar un técnico registrado
window.editarTecnico = function(id) {
    let tecnicos = JSON.parse(localStorage.getItem('tecnicos')) || [];
    const index = tecnicos.findIndex(t => t.id === id);

    if (index === -1) {
        alert("Técnico no encontrado.");
        return;
    }

    const tec = tecnicos[index];
    const nuevoNombre = prompt("Nombre del Técnico:", tec.nombre);
    if (nuevoNombre === null) return;

    const nuevaEspecialidad = prompt("Especialidad:", tec.especialidad || "");
    if (nuevaEspecialidad === null) return;

    const nuevoTelefono = prompt("Teléfono:", tec.telefono || "");
    if (nuevoTelefono === null) return;

    // Actualizar datos
    tecnicos[index].nombre = nuevoNombre;
    tecnicos[index].especialidad = nuevaEspecialidad;
    tecnicos[index].telefono = nuevoTelefono;

    localStorage.setItem('tecnicos', JSON.stringify(tecnicos));
    alert("¡Datos del técnico actualizados correctamente!");

    // Recargar vistas
    if (typeof renderizarTecnicos === 'function') renderizarTecnicos();
    if (typeof cargarSelectTecnicos === 'function') cargarSelectTecnicos();
};

document.addEventListener('DOMContentLoaded', () => {
    cargarSelectEstaciones();
    cargarSelectTecnicos();
    if (typeof renderizarTecnicos === 'function') renderizarTecnicos();
});

// ==========================================
// CRUD Y DIRECTORIO DE TÉCNICOS (MODAL)
// ==========================================
function obtenerListaTecnicos() {
    let tecnicos = JSON.parse(localStorage.getItem('tecnicos'));
    if (!tecnicos || tecnicos.length === 0) {
        tecnicos = [
            {
                id: "1",
                nombre: "Tecnólogo Harold Santiago Quecho",
                especialidad: "Especialista en Mantenimiento Electromecánico",
                edad: "28",
                correo: "harold.abaunzaque@unipaz.edu.co",
                telefono: "3124569874",
                empresa: "UNIPAZ - ECOPETROL",
                jornada: "Diurna (07:00 AM - 04:00 PM)",
                foto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            }
        ];
        localStorage.setItem('tecnicos', JSON.stringify(tecnicos));
    }
    return tecnicos;
}

window.renderizarTecnicos = function() {
    const contenedor = document.getElementById('contenedor-tecnicos') || 
                       document.getElementById('directorioTecnicos') || 
                       document.getElementById('sec-tecnicos');

    if (!contenedor) return;

    const tecnicos = obtenerListaTecnicos();

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>Personal Técnico Registrado</h2>
            <button onclick="abrirModalTecnico()" style="padding: 10px 18px; background: #006837; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                👤 + Agregar Técnico
            </button>
        </div>
        <div class="tecnicos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 20px;">
    `;

    html += tecnicos.map(tec => `
        <div class="tecnico-card" style="border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; background: #fff; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="position: absolute; top: 15px; right: 15px; display: flex; gap: 10px;">
                <button onclick="editarTecnicoModal('${tec.id}')" title="Editar" style="background: none; border: none; cursor: pointer; font-size: 16px;">✏️</button>
                <button onclick="eliminarTecnico('${tec.id}')" title="Eliminar" style="background: none; border: none; cursor: pointer; font-size: 16px;">🗑️</button>
            </div>
            <div style="text-align: center;">
                <img src="${tec.foto || 'https://via.placeholder.com/80'}" alt="${tec.nombre}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 2px solid #004d40;">
                <h3 style="margin: 5px 0; color: #222; font-size: 16px;">${tec.nombre}</h3>
                <p style="color: #555; font-size: 13px; margin: 2px 0;">${tec.especialidad || 'Técnico'}</p>
                <p style="color: #777; font-size: 12px; margin: 2px 0;">🎂 ${tec.edad ? tec.edad + ' años' : 'N/A'}</p>
                <p style="color: #777; font-size: 12px; margin: 2px 0;">📞 ${tec.telefono || 'Sin teléfono'}</p>
                <p style="color: #777; font-size: 12px; margin: 2px 0;">✉️ ${tec.correo}</p>
                <span style="display: inline-block; background: #e8f5e9; color: #2e7d32; font-size: 11px; padding: 4px 8px; border-radius: 4px; margin-top: 8px; font-weight: bold;">
                    ${tec.empresa || 'UNIPAZ - ECOPETROL'}
                </span>
            </div>
        </div>
    `).join('');

    html += `</div>`;
    contenedor.innerHTML = html;
};

// Controladores de la ventana modal
window.abrirModalTecnico = function() {
    document.getElementById('formTecnicoModal').reset();
    document.getElementById('modalTecnicoId').value = "";
    document.getElementById('textoTituloModal').textContent = "Agregar Nuevo Técnico";
    document.getElementById('modalVistaPreviaFoto').src = "https://via.placeholder.com/60";
    document.getElementById('modalTecnico').style.display = 'flex';
};

window.cerrarModalTecnico = function() {
    document.getElementById('modalTecnico').style.display = 'none';
};

window.actualizarVistaPreviaFotoModal = function() {
    const url = document.getElementById('modalTecnicoFoto').value;
    document.getElementById('modalVistaPreviaFoto').src = url || "https://via.placeholder.com/60";
};

window.editarTecnicoModal = function(id) {
    const tecnicos = obtenerListaTecnicos();
    const tec = tecnicos.find(t => String(t.id) === String(id));
    if (!tec) return;

    document.getElementById('modalTecnicoId').value = tec.id;
    document.getElementById('modalTecnicoNombre').value = tec.nombre || "";
    document.getElementById('modalTecnicoTelefono').value = tec.telefono || "";
    document.getElementById('modalTecnicoEdad').value = tec.edad || "";
    document.getElementById('modalTecnicoCorreo').value = tec.correo || "";
    document.getElementById('modalTecnicoEspecialidad').value = tec.especialidad || "";
    document.getElementById('modalTecnicoEmpresa').value = tec.empresa || "UNIPAZ - ECOPETROL";
    document.getElementById('modalTecnicoJornada').value = tec.jornada || "Diurna (07:00 AM - 04:00 PM)";
    document.getElementById('modalTecnicoFoto').value = tec.foto || "";
    document.getElementById('modalVistaPreviaFoto').src = tec.foto || "https://via.placeholder.com/60";

    document.getElementById('textoTituloModal').textContent = "Editar Perfil de Técnico";
    document.getElementById('modalTecnico').style.display = 'flex';
};

window.guardarTecnicoModal = function(event) {
    event.preventDefault();
    const id = document.getElementById('modalTecnicoId').value;
    let tecnicos = obtenerListaTecnicos();

    const nuevoDatos = {
        id: id ? id : String(Date.now()),
        nombre: document.getElementById('modalTecnicoNombre').value,
        telefono: document.getElementById('modalTecnicoTelefono').value,
        edad: document.getElementById('modalTecnicoEdad').value,
        correo: document.getElementById('modalTecnicoCorreo').value,
        especialidad: document.getElementById('modalTecnicoEspecialidad').value,
        empresa: document.getElementById('modalTecnicoEmpresa').value,
        jornada: document.getElementById('modalTecnicoJornada').value,
        foto: document.getElementById('modalTecnicoFoto').value
    };

    if (id) {
        const index = tecnicos.findIndex(t => String(t.id) === String(id));
        if (index !== -1) tecnicos[index] = nuevoDatos;
    } else {
        tecnicos.push(nuevoDatos);
    }

    localStorage.setItem('tecnicos', JSON.stringify(tecnicos));
    cerrarModalTecnico();
    renderizarTecnicos();
    if (typeof cargarSelectTecnicos === 'function') cargarSelectTecnicos();
};

window.eliminarTecnico = function(id) {
    if (!confirm("¿Está seguro de eliminar este técnico?")) return;
    let tecnicos = obtenerListaTecnicos();
    tecnicos = tecnicos.filter(t => String(t.id) !== String(id));
    localStorage.setItem('tecnicos', JSON.stringify(tecnicos));
    renderizarTecnicos();
    if (typeof cargarSelectTecnicos === 'function') cargarSelectTecnicos();
};

window.cargarArchivoFotoModal = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            document.getElementById('modalTecnicoFoto').value = base64Image;
            document.getElementById('modalVistaPreviaFoto').src = base64Image;
        };
        reader.readAsDataURL(file);
    }
};