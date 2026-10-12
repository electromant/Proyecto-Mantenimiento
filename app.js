let rolUsuarioActual = localStorage.getItem('user_role') || "Supervisor";
// CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE
const SUPABASE_URL = "https://jseocskipyhkmzatdplx.supabase.co";
const SUPABASE_KEY = "sb_publishable_DbyAT_qBKj3hDVuBk0zUoQ_sWVAxMx2";

window.supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
var supabase = window.supabaseClient;

// DATOS INICIALES Y UBICACIONES GEOGRÁFICAS

// Variable global para controlar la instancia del mapa Leaflet
let mapInstance = null;

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

// ==========================================
// 2. FUNCIÓN DE INGRESO AL INICIAR SESIÓN
// ==========================================
window.ejecutarIngresoDirecto = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Obtener entradas
    const emailInput = document.getElementById("loginEmail") || document.querySelector("input[type='email']");
    const passInput = document.getElementById("loginPass") || document.querySelector("input[type='password']");

    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const pass = passInput ? passInput.value.trim() : "";

    if (!email) {
        if (window.Swal) Swal.fire('Atención', 'Por favor ingresa tu correo electrónico.', 'warning');
        else alert('Por favor ingresa tu correo electrónico.');
        return false;
    }

    let rolDetectado = null;

    // A. Verificar si el correo pertenece a la lista de Supervisores
    const esSupervisor = typeof SUPERVISORES !== 'undefined' && SUPERVISORES.some(sup => sup.email.toLowerCase() === email);

    if (esSupervisor) {
        rolDetectado = "Supervisor";
    } else {
        // B. Verificar si el correo o la cédula coinciden con la lista de Técnicos
        const tecnicos = typeof listaTecnicos !== 'undefined' ? listaTecnicos : [];
        const tecnicoEncontrado = tecnicos.find(t => 
            (t.correo && t.correo.toLowerCase() === email) || 
            (t.cedula && t.cedula.toString() === pass)
        );

        if (tecnicoEncontrado) {
            rolDetectado = "Técnico";
        }
    }

    // C. Si no está en ninguna lista, se le asigna rol "Técnico" por defecto (Acceso Restringido)
    // O si prefieres denegar acceso si no existe, puedes cambiarlo.
    if (!rolDetectado) {
        // Si el correo contiene palabras clave de administración o supervisor
        if (email.includes("admin") || email.includes("super")) {
            rolDetectado = "Supervisor";
        } else {
            rolDetectado = "Técnico"; // Por seguridad, todo usuario no registrado entra como Técnico
        }
    }

    // 2. Guardar estado global y en localStorage
    window.rolUsuarioActual = rolDetectado;
    window.correoUsuarioActual = email;
    localStorage.setItem('user_role', rolDetectado);
    localStorage.setItem('user_email', email);

    // 3. Aplicar permisos restringidos / completos inmediatamente
    if (typeof aplicarPermisosPorRol === 'function') {
        aplicarPermisosPorRol();
    }

    // 4. Ocultar pantalla de login
    const overlay = document.getElementById("loginOverlay");
    if (overlay) overlay.style.display = "none";
    document.body.classList.remove("not-logged-in");

    // 5. Notificación personalizada de bienvenida
    if (window.Swal) {
        Swal.fire({
            title: '¡Bienvenido!',
            text: `Sesión iniciada como ${rolDetectado}`,
            icon: 'success',
            timer: 1300,
            showConfirmButton: false
        });
    }

    return false;
};

    // Guardar estado global y en almacenamiento local
    window.rolUsuarioActual = role;
    window.correoUsuarioActual = email;
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_email', email);

    // Ocultar modal de login
    const overlay = document.getElementById("loginOverlay");
    if (overlay) overlay.style.display = "none";
    document.body.classList.remove("not-logged-in");

    // Notificación SweetAlert2
    if (window.Swal) {
        Swal.fire({
            title: '¡Bienvenido!',
            text: `Sesión iniciada como ${role}`,
            icon: 'success',
            timer: 1300,
            showConfirmButton: false
        });
    }
};

// Cargar permisos guardados al recargar la página
document.addEventListener("DOMContentLoaded", function() {
    const savedRole = localStorage.getItem('user_role');
    if (savedRole) {
        window.rolUsuarioActual = savedRole;
        window.correoUsuarioActual = localStorage.getItem('user_email') || "";
    }
});

// 1. Función de ingreso al iniciar sesión
window.ejecutarIngresoDirecto = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const emailInput = document.getElementById("loginEmail") || document.querySelector("input[type='email']");
    const roleSelect = document.getElementById("loginRole") || document.querySelector("select");

    const email = emailInput ? emailInput.value.trim() : "";
    const role = roleSelect ? roleSelect.value : "";

    if (!email || !role || role.includes("--")) {
        if (window.Swal) Swal.fire('Atención', 'Por favor ingresa tu correo y selecciona un rol.', 'warning');
        else alert('Por favor ingresa tu correo y selecciona un rol.');
        return;
    }

    // Guardar credenciales
    window.rolUsuarioActual = role;
    window.correoUsuarioActual = email;
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_email', email);

    // Ocultar Modal
    const overlay = document.getElementById("loginOverlay");
    if (overlay) overlay.style.display = "none";
    document.body.classList.remove("not-logged-in");

    if (window.Swal) {
        Swal.fire({
            title: '¡Bienvenido!',
            text: `Sesión iniciada como ${role}`,
            icon: 'success',
            timer: 1300,
            showConfirmButton: false
        });
    }
};

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

window.ejecutarIngresoDirecto = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const emailInput = document.getElementById("loginEmail") || document.querySelector("input[type='email']");
    const roleSelect = document.getElementById("loginRole") || document.querySelector("select");

    const email = emailInput ? emailInput.value.trim() : "";
    let role = roleSelect ? roleSelect.value : "";

    // Si no hay select en el HTML o vino vacío, fallback por defecto a Supervisor
    if (!role || role.includes("--")) {
        role = "Supervisor";
    }

    if (!email) {
        if (window.Swal) {
            Swal.fire('Atención', 'Por favor ingresa un correo válido.', 'warning');
        } else {
            alert('Por favor ingresa un correo válido.');
        }
        return false;
    }

    // Normalizar rol
    const esTec = role.toLowerCase().includes("tec") || role.toLowerCase().includes("téc");
    const rolFinal = esTec ? "Técnico" : "Supervisor";

    // Guardar credenciales
    window.rolUsuarioActual = rolFinal;
    window.correoUsuarioActual = email;
    localStorage.setItem('user_role', rolFinal);
    localStorage.setItem('user_email', email);

    // Aplicar restricciones
    if (typeof aplicarPermisosPorRol === 'function') {
        aplicarPermisosPorRol();
    }

    // Ocultar pantalla de login
    const overlay = document.getElementById("loginOverlay");
    if (overlay) overlay.style.display = "none";
    document.body.classList.remove("not-logged-in");

    // Alerta de bienvenida
    if (window.Swal) {
        Swal.fire({
            title: '¡Bienvenido!',
            text: `Sesión iniciada como ${rolFinal}`,
            icon: 'success',
            timer: 1300,
            showConfirmButton: false
        });
    }

    return false;
};

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
function cargarEstacionesEnSelect() {
    const selectEstacion = document.getElementById("ordenEstacion") || document.querySelector("select[name='estacion']");
    if (!selectEstacion) return;

    // Obtener las estaciones (del arreglo global o localStorage)
    const estaciones = window.listaEstaciones || JSON.parse(localStorage.getItem('lista_estaciones')) || [
        { nombre: "Campo La Cira Infantas - Estación Cira 1" },
        { nombre: "Estación Barrancabermeja Principal" },
        { nombre: "Estación Cantagallo" },
        { nombre: "Estación Yondó" }
    ];

    selectEstacion.innerHTML = '<option value="">-- Seleccione Estación / Equipo --</option>';
    
    estaciones.forEach(est => {
        const option = document.createElement("option");
        option.value = est.nombre;
        option.textContent = est.nombre;
        selectEstacion.appendChild(option);
    });
}

// FUNCIÓN UNIFICADA PARA CÁRGAR OPCIONES EN EL SELECT DE TÉCNICOS
window.cargarSelectTecnicos = function() {
    // 1. Detectar el select usando los IDs más comunes del proyecto
    const select = document.getElementById("tecnicoSelect") || 
                   document.getElementById("ordenTecnico") || 
                   document.querySelector("select[name='tecnico']");
                   
    if (!select) return;

    // 2. Leer unificando todas las claves de localStorage
    const tecnicos = JSON.parse(localStorage.getItem('lista_tecnicos')) || 
                      JSON.parse(localStorage.getItem('tecnicos')) || 
                      JSON.parse(localStorage.getItem('tecnicos_data')) || [];

    // 3. Resetear opciones
    select.innerHTML = '<option value="">-- Seleccione Técnico --</option>';

    tecnicos.forEach(t => {
        const option = document.createElement("option");
        option.value = t.nombre;
        option.textContent = `${t.nombre} (${t.especialidad || t.empresa || 'UNIPAZ - ECOPETROL'})`;
        option.setAttribute("data-correo", t.correo || "");
        select.appendChild(option);
    });
};

// AUTOCOMPLETADO DEL CORREO AL SELECCIONAR
window.autocompletarCorreoTecnico = function() {
    const select = document.getElementById("tecnicoSelect") || document.getElementById("ordenTecnico");
    const inputCorreo = document.getElementById("correoNotificacion") || document.getElementById("ordenCorreo");

    if (select && inputCorreo) {
        const optionSeleccionada = select.options[select.selectedIndex];
        inputCorreo.value = optionSeleccionada ? (optionSeleccionada.getAttribute("data-correo") || "") : "";
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
   
// ÚNICA Y EXCLUSIVA FUNCIÓN PARA RENDERIZAR TÉCNICOS
function renderizarTecnicos(lista = null) {
    const contenedor = document.getElementById("contenedorTecnicos") || 
                       document.getElementById("contenedor-tecnicos") || 
                       document.getElementById("directorioTecnicos") || 
                       document.getElementById("sec-tecnicos");
                       
    if (!contenedor) return;

    // 1. Cargar lista desde parámetro o de localStorage (Sincronizando todas las claves posibles)
    let tecnicos = lista;
    if (!tecnicos || !Array.isArray(tecnicos) || tecnicos.length === 0) {
        tecnicos = JSON.parse(localStorage.getItem('lista_tecnicos')) || 
                   JSON.parse(localStorage.getItem('tecnicos')) || 
                   JSON.parse(localStorage.getItem('tecnicos_data')) || 
                   window.listaTecnicos || [];
    }

    // Unificar claves en localStorage para que todo el código lea lo mismo
    window.listaTecnicos = tecnicos;
    localStorage.setItem('lista_tecnicos', JSON.stringify(tecnicos));
    localStorage.setItem('tecnicos', JSON.stringify(tecnicos));
    localStorage.setItem('tecnicos_data', JSON.stringify(tecnicos));

    // 2. Ubicar la cuadrícula donde se inyectan las tarjetas
    const grid = contenedor.querySelector('.tecnicos-grid') || contenedor.querySelector('.directorio-grid') || contenedor;

    if (tecnicos.length === 0) {
        grid.innerHTML = `<p style="text-align: center; color: #666; grid-column: 1/-1; padding: 20px;">No hay técnicos registrados.</p>`;
        return;
    }

    // 3. Renderizar las tarjetas
    const rolActual = window.rolUsuarioActual || localStorage.getItem('user_role') || "Supervisor";
    const esTecnico = rolActual.toLowerCase().includes("tec") || rolActual.toLowerCase().includes("téc");

    let html = "";
    tecnicos.forEach(tec => {
        const id = tec.id || tec.cedula;
        const foto = tec.foto || tec.imagen || "https://via.placeholder.com/150";
        const nombre = tec.nombre || "Sin Nombre";
        const especialidad = tec.especialidad || tec.cargo || "Técnico";
        const telefono = tec.telefono || tec.celular || "Sin Teléfono";
        const correo = tec.correo || tec.email || "";

        const botonesAccion = esTecnico ? "" : `
            <div style="position: absolute; top: 12px; right: 12px;" class="card-tecnico-actions">
                <button onclick="editarTecnicoModal('${id}')" style="background:none; border:none; cursor:pointer;" title="Editar">✏️</button>
                <button onclick="eliminarTecnico('${id}')" style="background:none; border:none; cursor:pointer;" title="Eliminar">🗑️</button>
            </div>
        `;

        html += `
        <div class="card-tecnico" style="background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-align: center; position: relative;">
            ${botonesAccion}
            <img src="${foto}" alt="${nombre}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #005a36; margin-bottom: 10px;">
            <h4 style="margin: 5px 0; color: #2c3e50; font-size: 15px;">${nombre}</h4>
            <p style="margin: 2px 0; font-size: 13px; color: #7f8c8d;">${especialidad}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #95a5a6;">📞 ${telefono}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #95a5a6;">✉️ ${correo}</p>
        </div>
        `;
    });

    grid.innerHTML = html;
}

// Asignar al objeto global para llamarla desde cualquier evento
window.renderizarTecnicos = renderizarTecnicos;

// 2. Control total de permisos y actualización de la barra superior
// Base de datos de cuentas maestras / Supervisor
const SUPERVISORES = [
    { email: "admin@unipaz.edu.co", pass: "123456" },
    { email: "harold.santiagoque@unipaz.edu.co", pass: "123456" },
    { email: "supervisor@unipaz.edu.co", pass: "123456" }
];

// Lista por defecto de técnicos (si no hay guardados en localStorage)
let listaTecnicos = JSON.parse(localStorage.getItem('lista_tecnicos')) || [
    {
        id: "1098765432", // La cédula actúa como ID y contraseña
        cedula: "1098765432",
        nombre: "Ing. Fabio Blanco",
        especialidad: "Electromecánico",
        correo: "maffiold94@gmail.com"
    },
    {
        id: "1012345678",
        cedula: "1012345678",
        nombre: "Maria Elvira Vargas",
        especialidad: "Especialista eléctrica",
        correo: "maria.elvira@ecopetrol.com"
    }
];

// CONTROL ABSOLUTO DE ROLES Y PERMISOS
function aplicarPermisosPorRol() {
    // 1. Obtener el rol actual de localStorage de forma limpia
    const rolGuardado = localStorage.getItem('user_role') || window.rolUsuarioActual || "Supervisor";
    
    // Normalizar texto para comparación estricta
    const esTecnico = rolGuardado.toLowerCase().trim() === "técnico" || 
                      rolGuardado.toLowerCase().trim() === "tecnico" || 
                      (rolGuardado.toLowerCase().includes("tec") && !rolGuardado.toLowerCase().includes("super"));

    const rolFinalTexto = esTecnico ? "Técnico" : "Supervisor";

    // 2. Forzar el cambio de texto en el botón del Header (Supervisor / Técnico)
    const btnBadge = document.querySelector(".btn-supervisor") || 
                     document.getElementById("userRoleDisplay") || 
                     document.querySelector("header .btn-secondary") ||
                     document.querySelector(".header button");
                     
    if (btnBadge && !btnBadge.textContent.includes("Salir")) {
        btnBadge.textContent = rolFinalTexto;
    }

    // 3. PERMISOS DE AGENDAMIENTO: Ocultar formulario de programar órdenes si es Técnico
    const formOrden = document.getElementById("formOrden") || document.querySelector("form");
    if (formOrden) {
        const contenedorFormulario = formOrden.closest(".card") || formOrden.parentElement;
        if (contenedorFormulario) {
            contenedorFormulario.style.display = esTecnico ? "none" : "block";
        }
    }

    // 4. PERMISOS DE DIRECTORIO: Ocultar botón + Agregar Técnico
    const btnAgregar = document.getElementById("btnAbrirModalTecnico") || 
                       document.getElementById("btnAgregarTecnico") || 
                       document.querySelector("button[onclick*='Modal']");
    if (btnAgregar) {
        btnAgregar.style.display = esTecnico ? "none" : "inline-block";
    }

    // 5. PERMISOS DE TABLAS Y TARJETAS: Ocultar acciones de editar y eliminar
    const accionesAcceso = document.querySelectorAll(".card-tecnico-actions, .card-actions, .btn-action-icon, .col-acciones, .btn-eliminar-orden");
    accionesAcceso.forEach(el => {
        el.style.display = esTecnico ? "none" : "";
    });
}

window.aplicarPermisosPorRol = aplicarPermisosPorRol;

window.ejecutarIngresoDirecto = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Detectar inputs del login
    const emailInput = document.getElementById("loginEmail") || 
                       document.querySelector("#loginOverlay input[type='email']") || 
                       document.querySelector("input[type='email']");
                       
    const roleSelect = document.getElementById("loginRole") || 
                       document.getElementById("rol") || 
                       document.querySelector("#loginOverlay select") || 
                       document.querySelector("select");

    // 2. Capturar valores reales seleccionados por el usuario
    const email = emailInput ? emailInput.value.trim() : "";
    const role = roleSelect ? roleSelect.value : "";

    // 3. Validación
    if (!email || !role || role.includes("--")) {
        alert("Por favor ingresa un correo válido y selecciona un rol.");
        return false;
    }

    // 4. Guardar en localStorage inmediatamente
    window.rolUsuarioActual = role;
    window.correoUsuarioActual = email;
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_email', email);

    // 5. Aplicar visibilidad de permisos inmediatamente según el ROL SELECCIONADO
    if (typeof aplicarPermisosPorRol === 'function') {
        aplicarPermisosPorRol();
    }

    // 6. Ocultar pantalla de login
    const overlay = document.getElementById("loginOverlay");
    if (overlay) overlay.style.display = "none";
    document.body.classList.remove("not-logged-in");

    // 7. Notificación
    if (window.Swal) {
        Swal.fire({
            title: '¡Bienvenido!',
            text: `Sesión iniciada como ${role}`,
            icon: 'success',
            timer: 1300,
            showConfirmButton: false
        }).then(() => {
            if (typeof aplicarPermisosPorRol === 'function') {
                aplicarPermisosPorRol();
            }
        });
    }

    return false;
};
    
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

// ÚNICA FUNCIÓN PARA ELIMINAR TÉCNICO
window.eliminarTecnico = function(id) {
    if (!id) return;

    // Verificar permisos
    const rolActual = window.rolUsuarioActual || localStorage.getItem('user_role') || "Supervisor";
    if (rolActual.toLowerCase().includes("tec") || rolActual.toLowerCase().includes("téc")) {
        alert("No tienes permisos para eliminar técnicos.");
        return;
    }

    const ejecutarEliminacion = () => {
        // Cargar desde cualquiera de las claves existentes
        let lista = JSON.parse(localStorage.getItem('lista_tecnicos')) || 
                    JSON.parse(localStorage.getItem('tecnicos')) || 
                    JSON.parse(localStorage.getItem('tecnicos_data')) || 
                    window.listaTecnicos || [];

        // Filtrar convirtiendo a String para evitar fallos por tipo (número vs texto)
        const listaNueva = lista.filter(t => String(t.id || t.cedula) !== String(id));

        // Actualizar variable global y sincronizar todas las claves de localStorage
        window.listaTecnicos = listaNueva;
        localStorage.setItem('lista_tecnicos', JSON.stringify(listaNueva));
        localStorage.setItem('tecnicos', JSON.stringify(listaNueva));
        localStorage.setItem('tecnicos_data', JSON.stringify(listaNueva));

        // Re-renderizar la interfaz inmediatamente
        if (typeof window.renderizarTecnicos === 'function') {
            window.renderizarTecnicos(listaNueva);
        }

        // Actualizar selects de agendamiento si existen
        if (typeof window.cargarTecnicosEnSelects === 'function') {
            window.cargarTecnicosEnSelects();
        }

        // Notificación
        if (window.Swal) {
            Swal.fire('¡Eliminado!', 'El técnico ha sido removido con éxito.', 'success');
        } else {
            alert('Técnico eliminado con éxito.');
        }
    };

    // Modal de confirmación
    if (window.Swal) {
        Swal.fire({
            title: '¿Eliminar técnico?',
            text: 'Esta persona ya no aparecerá disponible para asignar en nuevas órdenes.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                ejecutarEliminacion();
            }
        });
    } else {
        if (confirm("¿Deseas eliminar este técnico del directorio?")) {
            ejecutarEliminacion();
        }
    }
};

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

// Controladores de la ventana modal
window.abrirModalTecnico = function() {
    const form = document.getElementById('formTecnicoModal') || document.getElementById('formTecnico');
    if (form) form.reset();

    const idInput = document.getElementById('modalTecnicoId') || document.getElementById('tecnicoId');
    if (idInput) idInput.value = "";

    const titulo = document.getElementById('textoTituloModal') || document.getElementById('modalTecnicoTitulo');
    if (titulo) titulo.textContent = "Agregar Nuevo Técnico";

    const preview = document.getElementById('modalVistaPreviaFoto') || document.getElementById('imgPreview');
    if (preview) preview.src = "https://via.placeholder.com/150";

    const modal = document.getElementById('modalTecnico');
    if (modal) modal.style.display = 'flex';
};

// Vinculación de nombres alternativos
window.abrirModalAgregarTecnico = window.abrirModalTecnico;
window.abrirModal = window.abrirModalTecnico;

// Alias para que funcione con cualquier nombre en el HTML
window.abrirModalAgregarTecnico = window.abrirModalTecnico;
window.abrirModal = window.abrirModalTecnico;
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

// Variable global auxiliar para almacenar la foto procesada
window.fotoTecnicoTemporal = "";

// Función para procesar la subida del archivo de imagen
function cargarArchivoFotoModal(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            window.fotoTecnicoTemporal = e.target.result;
            const preview = document.getElementById("modalVistaPreviaFoto");
            if (preview) preview.src = e.target.result;
            
            const inputUrl = document.getElementById("modalTecnicoFoto");
            if (inputUrl) inputUrl.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Función principal de Guardar Técnico
function guardarTecnicoModal(event) {
    // 1. Detener la recarga por defecto del formulario
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    try {
        // 2. Obtener valores con fallback para evitar errores si un ID falta
        const idInput = document.getElementById("modalTecnicoId")?.value || "";
        const cedula = document.getElementById("modalTecnicoCedula")?.value.trim() || "";
        const correo = document.getElementById("modalTecnicoCorreo")?.value.trim().toLowerCase() || "";
        const rol = document.getElementById("modalTecnicoRol")?.value || "Técnico";
        const nombre = document.getElementById("modalTecnicoNombre")?.value.trim() || "";
        const telefono = document.getElementById("modalTecnicoTelefono")?.value.trim() || "";
        const especialidad = document.getElementById("modalTecnicoEspecialidad")?.value.trim() || "";
        
        // Obtener foto desde la URL/Base64 o la vista previa
        const fotoInput = document.getElementById("modalTecnicoFoto")?.value.trim();
        const foto = fotoInput || window.fotoTecnicoTemporal || "https://via.placeholder.com/150";

        if (!nombre || !correo) {
            alert("Por favor complete los campos obligatorios (Nombre y Correo).");
            return false;
        }

        // 3. Obtener lista actual de técnicos de localStorage
        let listaTecnicos = JSON.parse(localStorage.getItem('lista_tecnicos')) || window.listaTecnicos || [];

        if (idInput) {
            // Actualizar existente
            const index = listaTecnicos.findIndex(t => String(t.id) === String(idInput) || String(t.cedula) === String(idInput));
            if (index !== -1) {
                listaTecnicos[index] = { ...listaTecnicos[index], cedula, correo, rol, nombre, telefono, especialidad, foto };
            }
        } else {
            // Crear nuevo
            const nuevoTecnico = {
                id: cedula || Date.now().toString(),
                cedula: cedula,
                correo: correo,
                rol: rol,
                nombre: nombre,
                telefono: telefono,
                especialidad: especialidad,
                foto: foto
            };
            listaTecnicos.push(nuevoTecnico);
        }

        // 4. Guardar en localStorage y variable global
        localStorage.setItem('lista_tecnicos', JSON.stringify(listaTecnicos));
        window.listaTecnicos = listaTecnicos;

        // 5. Renderizar vista de directorio si la función existe
        if (typeof renderizarTecnicos === 'function') {
            renderizarTecnicos(listaTecnicos);
        } else if (typeof renderizarDirectorio === 'function') {
            renderizarDirectorio();
        }

        // 6. Actualizar desplegables de selección
        if (typeof cargarTecnicosEnSelects === 'function') {
            cargarTecnicosEnSelects();
        }

        // 7. Cerrar modal y limpiar
        cerrarModalTecnico();

        // 8. Notificación
        if (window.Swal) {
            Swal.fire('¡Éxito!', `El usuario ${nombre} fue guardado correctamente.`, 'success');
        } else {
            alert(`Técnico ${nombre} guardado con éxito.`);
        }

    } catch (error) {
        console.error("Error al guardar el técnico:", error);
        alert("Ocurrió un error al guardar. Revisa la consola (F12).");
    }

    return false;
}

// ==========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar las listas en los desplegables de selección
    if (typeof cargarSelectTecnicos === 'function') cargarSelectTecnicos();
    if (typeof cargarEstacionesEnSelect === 'function') cargarEstacionesEnSelect();

    // 2. Dibujar las tarjetas de técnicos y órdenes guardadas
    if (typeof renderizarTecnicos === 'function') renderizarTecnicos();
    if (typeof renderizarOrdenes === 'function') renderizarOrdenes();

});