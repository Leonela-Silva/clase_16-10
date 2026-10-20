```javascript
// ==================================================
// MEDIDATA PRO - APLICACIÓN PRINCIPAL
// ==================================================

document.addEventListener('DOMContentLoaded', async () => {
    const btnGuardar = document.getElementById('btnGuardar');
    const buscarInput = document.getElementById('buscarInput');
    const pacienteHistoria = document.getElementById('pacienteHistoria');
    const turnoEspecialista = document.getElementById('turnoEspecialista');
    const formTurno = document.getElementById('formTurno');
    const turnoFecha = document.getElementById('turnoFecha');

    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarPaciente);
    }

    if (buscarInput) {
        buscarInput.addEventListener('input', buscarPaciente);
    }

    if (pacienteHistoria) {
        pacienteHistoria.addEventListener('change', () => {
            cargarHistoriasClinicas(pacienteHistoria.value);
        });
    }

    if (turnoEspecialista) {
        turnoEspecialista.addEventListener('change', mostrarInfoEspecialista);
    }

    if (formTurno) {
        formTurno.addEventListener('submit', solicitarTurno);
    }

    if (turnoFecha) {
        turnoFecha.min = obtenerFechaLocal();
    }

    // Cargar primero pacientes y especialistas.
    // Después, cargar las solicitudes de turnos.
    await cargarPacientes();
    await cargarEspecialistas();
    await cargarTurnos();
});


// ==================================================
// VARIABLES GENERALES
// ==================================================

let pacientesDisponibles = [];
let especialistasDisponibles = [];


// ==================================================
// CONEXIÓN CON SUPABASE
// ==================================================

function obtenerCliente() {
    if (!window.supabaseClient) {
        throw new Error(
            'No se pudo conectar con Supabase. Revisá conexion.js.'
        );
    }

    return window.supabaseClient;
}


// ==================================================
// MENSAJES DE ESTADO
// ==================================================

function mostrarEstado(mensaje, correcto = true) {
    const elemento = document.getElementById('statusMsg');

    if (!elemento) return;

    elemento.textContent = mensaje;
    elemento.style.color = correcto ? 'green' : 'red';
}

function mostrarEstadoTurno(mensaje, correcto = true) {
    const elemento = document.getElementById('turnoStatus');

    if (!elemento) return;

    elemento.textContent = mensaje;
    elemento.style.color = correcto ? 'green' : 'red';
}


// ==================================================
// PACIENTES: CARGAR Y MOSTRAR
// ==================================================

async function cargarPacientes() {
    try {
        const { data, error } = await obtenerCliente()
            .from('pacientes')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        pacientesDisponibles = data || [];

        renderizarLista(pacientesDisponibles);
        actualizarSelectoresPacientes(pacientesDisponibles);

    } catch (err) {
        console.error('Error al cargar pacientes:', err);

        mostrarEstado(
            'No se pudieron cargar los pacientes: ' +
            (err.message || 'Error desconocido'),
            false
        );
    }
}


// ==================================================
// ACTUALIZAR SELECTORES DE PACIENTES
// ==================================================

function actualizarSelectoresPacientes(pacientes) {
    const selectorHistoria = document.getElementById('pacienteHistoria');
    const selectorTurno = document.getElementById('turnoPaciente');

    const actualizarSelector = (selector, textoInicial, seleccionado) => {
        if (!selector) return;

        selector.replaceChildren();

        const opcionInicial = document.createElement('option');
        opcionInicial.value = '';
        opcionInicial.textContent = textoInicial;
        selector.appendChild(opcionInicial);

        pacientes.forEach(paciente => {
            const opcion = document.createElement('option');

            opcion.value = String(paciente.id);
            opcion.textContent =
                paciente.nombre + ' — DNI: ' + paciente.dni;

            selector.appendChild(opcion);
        });

        const existe = pacientes.some(
            paciente => String(paciente.id) === seleccionado
        );

        selector.value = existe ? seleccionado : '';
    };

    const historiaSeleccionada = selectorHistoria
        ? selectorHistoria.value
        : '';

    const turnoSeleccionado = selectorTurno
        ? selectorTurno.value
        : '';

    actualizarSelector(
        selectorHistoria,
        'Seleccioná un paciente',
        historiaSeleccionada
    );

    actualizarSelector(
        selectorTurno,
        'Seleccioná un paciente',
        turnoSeleccionado
    );

    if (selectorHistoria && !selectorHistoria.value) {
        const datos = document.getElementById('datosPacienteHistoria');
        const lista = document.getElementById('listaHistorias');

        if (datos) datos.replaceChildren();

        if (lista) {
            lista.textContent =
                'Seleccioná un paciente para ver sus historias clínicas.';
        }
    }
}


// ==================================================
// PACIENTES: GUARDAR
// ==================================================

async function guardarPaciente() {
    const nombre = document.getElementById('nombre').value.trim();
    const dni = document.getElementById('dni').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!nombre || !dni || !telefono || !email) {
        mostrarEstado('Completá todos los campos.', false);
        return;
    }

    try {
        const { error } = await obtenerCliente()
            .from('pacientes')
            .insert([{
                nombre,
                dni,
                telefono,
                email
            }]);

        if (error) throw error;

        mostrarEstado('Paciente registrado correctamente.', true);

        const formulario = document.getElementById('pacienteForm');

        if (formulario) {
            formulario.reset();
        } else {
            document.getElementById('nombre').value = '';
            document.getElementById('dni').value = '';
            document.getElementById('telefono').value = '';
            document.getElementById('email').value = '';
        }

        await cargarPacientes();

    } catch (err) {
        console.error('Error al guardar paciente:', err);

        mostrarEstado(
            'No se pudo guardar el paciente: ' +
            (err.message || 'Error desconocido'),
            false
        );
    }
}


// ==================================================
// PACIENTES: MOSTRAR LISTADO
// ==================================================

function renderizarLista(pacientes) {
    const lista = document.getElementById('listaPacientes');

    if (!lista) return;

    lista.replaceChildren();

    if (!pacientes || pacientes.length === 0) {
        lista.textContent = 'No hay pacientes registrados.';
        return;
    }

    pacientes.forEach(paciente => {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'patient-card';

        const titulo = document.createElement('h3');
        titulo.textContent = paciente.nombre;

        const dni = document.createElement('p');
        dni.textContent = 'DNI: ' + paciente.dni;

        const telefono = document.createElement('p');
        telefono.textContent = 'Teléfono: ' + paciente.telefono;

        const email = document.createElement('p');
        email.textContent = 'Email: ' + paciente.email;

        const botonEliminar = document.createElement('button');
        botonEliminar.type = 'button';
        botonEliminar.textContent = 'Eliminar paciente';

        botonEliminar.addEventListener('click', () => {
            borrarPaciente(paciente.id);
        });

        tarjeta.append(
            titulo,
            dni,
            telefono,
            email,
            botonEliminar
        );

        lista.appendChild(tarjeta);
    });
}


// ==================================================
// PACIENTES: BUSCAR
// ==================================================

async function buscarPaciente() {
    const campo = document.getElementById('buscarInput');
    const busqueda = campo.value.trim();

    if (!busqueda) {
        await cargarPacientes();
        return;
    }

    try {
        const { data, error } = await obtenerCliente()
            .from('pac
