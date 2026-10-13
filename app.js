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

function aplicarPermisosPorRol() {
    const rolActual = window.rolUsuarioActual || localStorage.getItem('user_role') || "Técnico";
    const esTecnico = (rolActual === "Técnico");

    // 1. Cambiar la etiqueta del texto superior
    const roleDisplay = document.getElementById("userRoleDisplay");
    if (roleDisplay) {
        roleDisplay.textContent = rolActual;
    }

    const elementosRol = document.querySelectorAll(".navbar button, header button, .navbar span, header span");
    elementosRol.forEach(el => {
        if (el.textContent.trim() === "Supervisor" || el.textContent.trim() === "Técnico") {
            el.textContent = rolActual;
        }
    });

    // 2. Inyección de reglas CSS globales estrictas para el rol Técnico
    let styleBlock = document.getElementById("style-tecnico-exact");
    if (!styleBlock) {
        styleBlock = document.createElement("style");
        styleBlock.id = "style-tecnico-exact";
        document.head.appendChild(styleBlock);
    }

    if (esTecnico) {
        styleBlock.innerHTML = `
            /* Ocultar botón + Agregar Técnico y edición/eliminación en tarjetas */
            #btnAbrirModalTecnico,
            button[onclick*='modalTecnico'],
            button[onclick*='Modal'],
            .card-tecnico-actions,
            .btn-edit-tec,
            .btn-delete-tec,
            .fa-pencil,
            .fa-trash,
            .fa-user-pen { 
                display: none !important; 
            }

            /* Ocultar Formulario de Programar Orden de Mantenimiento */
            .card-box.supervisor-only,
            #formOrden,
            .form-programar-orden,
            button[type='submit']:has(.fa-paper-plane),
            button[onclick*='guardarOrden'] { 
                display: none !important; 
            }

            /* Ocultar columna de Acciones en la Tabla de Historial de Órdenes */
            .tabla-ordenes th:last-child,
            .tabla-ordenes td:last-child,
            .btn-editar-orden,
            .btn-eliminar-orden { 
                display: none !important; 
            }
        `;
    } else {
        styleBlock.innerHTML = "";
    }
}

// Cargar permisos guardados al recargar la página
document.addEventListener("DOMContentLoaded", function() {
    const savedRole = localStorage.getItem('user_role');
    if (savedRole) {
        window.rolUsuarioActual = savedRole;
        window.correoUsuarioActual = localStorage.getItem('user_email') || "";
    }
});

window.ejecutarIngresoDirecto = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    try {
        const emailInput = document.getElementById("loginEmail") || document.querySelector("input[type='email']");
        const passInput = document.getElementById("loginPass") || document.querySelector("input[type='password']");

        const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        const pass = passInput ? passInput.value.trim() : "";

        if (!email || !pass) {
            alert('Por favor ingresa tu correo y tu cédula como contraseña.');
            return false;
        }

        let rolDetectado = null;

        // 1. Validar Supervisor Maestro
        if (email === "harold.abaunzaque@unipaz.edu.co") {
            rolDetectado = "Supervisor";
        } 
        else {
            // Cargar datos reales de personal
            const datosGuardados = localStorage.getItem('tecnicos_data') || localStorage.getItem('lista_tecnicos');
            let listaActual = (typeof listaTecnicos !== 'undefined' && Array.isArray(listaTecnicos)) ? listaTecnicos : [];
            if (datosGuardados) {
                try { listaActual = JSON.parse(datosGuardados); } catch(err) {}
            }

            // 2. Buscar usuario y VALIDAR ESTRICTAMENTE LA CÉDULA COMO CONTRASEÑA
            const usuarioEncontrado = listaActual.find(t => t && t.correo && t.correo.toLowerCase() === email);

            if (usuarioEncontrado) {
                const cedulaGuardada = (usuarioEncontrado.cedula || "").toString().trim();
                
                // Si la cédula no coincide exactamente con la contraseña digitada, bloquea el acceso
                if (cedulaGuardada && cedulaGuardada !== pass) {
                    if (window.Swal) {
                        Swal.fire('Contraseña Incorrecta', 'La cédula digitada no coincide con el usuario.', 'error');
                    } else {
                        alert('Contraseña incorrecta.');
                    }
                    return false;
                }
                rolDetectado = usuarioEncontrado.rol || "Técnico";
            }
        }

        // Si el usuario no está registrado en la lista
        if (!rolDetectado) {
            if (window.Swal) {
                Swal.fire('Usuario No Encontrado', 'El correo ingresado no está registrado en el sistema.', 'warning');
            } else {
                alert('Usuario no registrado.');
            }
            return false;
        }

        // Guardar estado de sesión
        window.rolUsuarioActual = rolDetectado;
        window.correoUsuarioActual = email;
        localStorage.setItem('user_role', rolDetectado);
        localStorage.setItem('user_email', email);

        // Ocultar modal de login
        const overlay = document.getElementById("loginOverlay");
        if (overlay) overlay.style.setProperty("display", "none", "important");
        document.body.classList.remove("not-logged-in");

        // Aplicar bloqueos de interfaz inmediatamente
        aplicarPermisosPorRol();

        if (window.Swal) {
            Swal.fire({
                title: '¡Bienvenido!',
                text: `Sesión iniciada como ${rolDetectado}`,
                icon: 'success',
                timer: 1300,
                showConfirmButton: false
            });
        }

    } catch (err) {
        console.error("Error en login:", err);
    }

    return false;
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
    // 1. Verificar permisos de Supervisor
    if (window.rolUsuarioActual === "Técnico") {
        if (window.Swal) Swal.fire('Acceso denegado', 'No tienes permisos para editar técnicos.', 'error');
        return;
    }

    // 2. Obtener lista actualizada desde localStorage
    const datosGuardados = localStorage.getItem('tecnicos_data') || localStorage.getItem('lista_tecnicos');
    let listaActual = (typeof listaTecnicos !== 'undefined' && Array.isArray(listaTecnicos)) ? listaTecnicos : [];
    if (datosGuardados) {
        try { listaActual = JSON.parse(datosGuardados); } catch(e) {}
    }

    // 3. Buscar el técnico por ID
    const tec = listaActual.find(t => t.id == id || t.correo == id);
    if (!tec) {
        console.error("No se encontró el técnico con ID:", id);
        return;
    }

    // 4. Llenar los campos del modal (Soporta IDs estándar y modalTecnico...)
    const setFieldValue = (id1, id2, valor) => {
        const el = document.getElementById(id1) || document.getElementById(id2);
        if (el) el.value = valor || "";
    };

    setFieldValue("tecnicoId", "modalTecnicoId", tec.id || "");
    setFieldValue("tecCedula", "modalTecnicoCedula", tec.cedula || "");
    setFieldValue("tecNombre", "modalTecnicoNombre", tec.nombre || "");
    setFieldValue("tecCorreo", "modalTecnicoCorreo", tec.correo || "");
    setFieldValue("tecTelefono", "modalTecnicoTelefono", tec.telefono || "");
    setFieldValue("tecEspecialidad", "modalTecnicoEspecialidad", tec.especialidad || "");
    setFieldValue("tecFotoUrl", "modalTecnicoFotoUrl", tec.foto || "");

    // 5. Asignar el Rol seleccionado en el <select>
    const rolSelect = document.getElementById("tecRol") || document.getElementById("modalTecnicoRol");
    if (rolSelect) {
        rolSelect.value = (tec.rol && tec.rol.includes("Supervisor")) ? "Supervisor (Control Total)" : "Técnico (Solo Lectura)";
    }

    // 6. Vista previa de la foto
    const imgPrev = document.getElementById("imgPreview") || document.getElementById("modalTecnicoFotoPreview");
    if (imgPrev) {
        imgPrev.src = tec.foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
    }

    // 7. Cambiar título y MOSTRAR MODAL
    const tituloModal = document.getElementById("modalTecnicoTitulo") || document.getElementById("modalTecnicoTitle");
    if (tituloModal) tituloModal.innerHTML = '<i class="fa-solid fa-user-pen"></i> Editar Técnico';

    const modal = document.getElementById("modalTecnico");
    if (modal) {
        modal.style.setProperty("display", "flex", "important");
    }
};

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
            if (typeof inicializarMapa === 'function') inicializarMapa();
        }, 200);
    } else if (tabName === 'tecnicos' || tabName === 'directorio') {
        if (typeof renderizarTecnicos === 'function') renderizarTecnicos();
    }

    // REAPLICAR PERMISOS SIEMPRE AL NAVEGAR ENTRE PESTAÑAS
    if (typeof aplicarPermisosPorRol === 'function') {
        aplicarPermisosPorRol();
    }
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
            <div class="card-tecnico-actions" style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px;">
        <button class="btn-edit-tec" onclick="editarTecnico('${t.id}')" title="Editar Técnico" style="background: transparent; border: none; color: #0d6efd; cursor: pointer;">
            <i class="fa-solid fa-pencil"></i>
        </button>
        <button class="btn-delete-tec" onclick="eliminarTecnico('${t.id}')" title="Eliminar Técnico" style="background: transparent; border: none; color: #dc3545; cursor: pointer;">
            <i class="fa-solid fa-trash"></i>
        </button>
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
    
function cerrarModalTecnico() {
    document.getElementById("modalTecnico").style.display = "none";
}

window.guardarTecnico = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    try {
        const getVal = (id1, id2) => {
            const el = document.getElementById(id1) || document.getElementById(id2);
            return el ? el.value.trim() : "";
        };

        const id = getVal("tecnicoId", "modalTecnicoId");
        const cedula = getVal("tecCedula", "modalTecnicoCedula");
        const correo = getVal("tecCorreo", "modalTecnicoCorreo").toLowerCase();
        const nombre = getVal("tecNombre", "modalTecnicoNombre");
        const especialidad = getVal("tecEspecialidad", "modalTecnicoEspecialidad");
        const telefono = getVal("tecTelefono", "modalTecnicoTelefono");
        let fotoInput = getVal("tecFotoUrl", "modalTecnicoFotoUrl");

        if (!nombre || !correo) {
            alert('Por favor ingresa al menos Nombre y Correo.');
            return false;
        }

        // Función para compilar el guardado en localStorage
        const procesarYGuardarFinal = (fotoOptimizada) => {
            let lista = [];
            try {
                lista = JSON.parse(localStorage.getItem('lista_tecnicos') || localStorage.getItem('tecnicos_data') || "[]");
            } catch (err) {
                lista = [];
            }

            const fotoFinal = fotoOptimizada || (fotoInput.startsWith("data:image") ? fotoInput : null) || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

            const datosTecnico = {
                id: id ? id : Date.now(),
                nombre,
                correo,
                cedula,
                especialidad,
                telefono,
                foto: fotoFinal,
                rol: "Técnico"
            };

            if (id) {
                const idx = lista.findIndex(t => t && (t.id == id || t.cedula == cedula || t.correo == correo));
                if (idx !== -1) {
                    lista[idx] = { ...lista[idx], ...datosTecnico };
                } else {
                    lista.push(datosTecnico);
                }
            } else {
                lista.push(datosTecnico);
            }

            // Intentar guardar de forma segura
            try {
                localStorage.setItem('lista_tecnicos', JSON.stringify(lista));
                localStorage.setItem('tecnicos_data', JSON.stringify(lista));
            } catch (quotaError) {
                console.warn("LocalStorage lleno, guardando sin imagen pesada...");
                datosTecnico.foto = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                localStorage.setItem('lista_tecnicos', JSON.stringify(lista));
                localStorage.setItem('tecnicos_data', JSON.stringify(lista));
            }

            if (typeof renderizarTecnicos === 'function') renderizarTecnicos();

            const modal = document.getElementById("modalTecnico");
            if (modal) modal.style.display = "none";

            if (window.Swal) {
                Swal.fire('¡Éxito!', 'Técnico guardado correctamente.', 'success');
            } else {
                alert('Técnico guardado correctamente.');
            }
        };

        // Redimensionar imagen para reducir peso antes de guardar
        const inputFoto = document.getElementById("tecFoto") || document.getElementById("modalTecnicoFoto") || document.querySelector("#modalTecnico input[type='file']");

        if (inputFoto && inputFoto.files && inputFoto.files[0]) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    canvas.width = 150;
                    canvas.height = 150;
                    ctx.drawImage(img, 0, 0, 150, 150);
                    const fotoComprimida = canvas.toDataURL("image/jpeg", 0.7);
                    procesarYGuardarFinal(fotoComprimida);
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(inputFoto.files[0]);
        } else {
            procesarYGuardarFinal(null);
        }

    } catch (error) {
        console.error("Error al guardar técnico:", error);
        alert("Error al guardar: " + error.message);
    }

    return false;
};

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
    if (window.rolUsuarioActual === "Técnico") {
        if (window.Swal) Swal.fire('Acceso denegado', 'No tienes permisos para editar técnicos.', 'error');
        return;
    }

    const datosGuardados = localStorage.getItem('tecnicos_data') || localStorage.getItem('lista_tecnicos');
    let listaActual = (typeof listaTecnicos !== 'undefined' && Array.isArray(listaTecnicos)) ? listaTecnicos : [];
    if (datosGuardados) {
        try { listaActual = JSON.parse(datosGuardados); } catch(e) {}
    }

    const tec = listaActual.find(t => t.id == id || t.correo == id);
    if (!tec) return;

    const setVal = (id1, id2, val) => {
        const el = document.getElementById(id1) || document.getElementById(id2);
        if (el) el.value = val || "";
    };

    setVal("tecnicoId", "modalTecnicoId", tec.id || "");
    setVal("tecCedula", "modalTecnicoCedula", tec.cedula || "");
    setVal("tecNombre", "modalTecnicoNombre", tec.nombre || "");
    setVal("tecCorreo", "modalTecnicoCorreo", tec.correo || "");
    setVal("tecTelefono", "modalTecnicoTelefono", tec.telefono || "");
    setVal("tecEspecialidad", "modalTecnicoEspecialidad", tec.especialidad || "");
    setVal("tecFotoUrl", "modalTecnicoFotoUrl", tec.foto || "");

    const rolSelect = document.getElementById("tecRol") || document.getElementById("modalTecnicoRol");
    if (rolSelect) {
        rolSelect.value = (tec.rol && tec.rol.includes("Supervisor")) ? "Supervisor (Control Total)" : "Técnico (Solo Lectura)";
    }

    const modal = document.getElementById("modalTecnico");
    if (modal) {
        modal.style.setProperty("display", "flex", "important");
    }
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