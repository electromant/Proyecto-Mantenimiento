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

document.addEventListener("DOMContentLoaded", () => {
    cargarSelectTecnicos();
    renderizarTecnicos(listaTecnicos);
    renderizarOrdenes();
    aplicarPermisosPorRol();
});

// INICIALIZACIÓN DEL MAPA LEAFLET
   
function inicializarMapa() {
    // Buscar mapaLeaflet (el ID exacto de tu HTML) o map como respaldo
    const mapDiv = document.getElementById('mapaLeaflet') || document.getElementById('map');
    if (!mapDiv) return;

    if (mapInstance !== null) {
        mapInstance.invalidateSize();
        return;
    }

    // Inicializar mapa en el elemento encontrado
    mapInstance = L.map(mapDiv.id).setView([7.0653, -73.8547], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Dibujar marcadores usando tu arreglo estacionesUbicaciones
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
    }, 250);
}

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
   
function cargarSelectTecnicos() {
    const select = document.getElementById("ordenTecnico");
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Seleccionar Técnico --</option>';
    
    listaTecnicos.forEach(t => {
        const option = document.createElement("option");
        option.value = t.nombre;
        option.dataset.correo = t.correo;
        option.textContent = `${t.nombre} (${t.empresa})`;
        select.appendChild(option);
    });
}

function guardarOrden(e) {
    e.preventDefault();

    if (rolUsuarioActual === "Técnico") {
        Swal.fire('Acceso denegado', 'El rol Técnico solo tiene permisos de lectura.', 'error');
        return;
    }

    const selectTec = document.getElementById("ordenTecnico");
    const optionSel = selectTec.options[selectTec.selectedIndex];
    const correoTecnico = optionSel.dataset.correo || "";

    const nuevaOrden = {
        id: "ORD-" + Math.floor(100 + Math.random() * 900),
        estacion: document.getElementById("ordenEstacion").value,
        tipo: document.getElementById("ordenTipo").value,
        jornada: document.getElementById("ordenJornada").value,
        fecha: document.getElementById("ordenFecha").value,
        hora: document.getElementById("ordenHora").value,
        tecnico: selectTec.value,
        correo: correoTecnico
    };

    listaOrdenes.unshift(nuevaOrden);
    localStorage.setItem('ordenes_data', JSON.stringify(listaOrdenes));

    renderizarOrdenes();
    document.getElementById("formOrden").reset();

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
    Swal.fire({
        title: 'Enviando notificación...',
        text: 'Por favor espera un momento.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const templateParams = {
        to_email: orden.correo,
        tecnico_nombre: orden.tecnico,
        equipo_estacion: orden.estacion,
        tipo_mantenimiento: orden.tipo,
        jornada_trabajo: orden.jornada,
        fecha_mantenimiento: orden.fecha,
        hora_mantenimiento: orden.hora
    };

    emailjs.send("service_nzn02hp", "template_uadyeyr", templateParams)
        .then(function(response) {
            console.log("NOTIFICACIÓN ENVIADA ÉXITO", response.status, response.text);
            Swal.fire({
                title: '¡Notificación Enviada!',
                text: `Se ha enviado el correo a ${orden.correo} correctamente.`,
                icon: 'success',
                confirmButtonColor: '#004d40'
            });
        }, function(error) {
            console.error("ERROR EN EMAILJS:", error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo enviar la notificación. Revisa tus credenciales de EmailJS.',
                icon: 'error',
                confirmButtonColor: '#d32f2f'
            });
        });
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