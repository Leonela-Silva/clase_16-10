
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

    // Cargar primero los pacientes y especialistas.
    // Después, cargar las solicitudes para mostrar los nombres.
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

    if (
        selectorHistoria &&
        !selectorHistoria.value
    ) {
        const datos = document.getElementById('datosPacienteHistoria');
        const lista = document.getElementById('listaHistorias');

        if (datos) datos.replaceChildren();
        if (lista) lista.textContent = 'Seleccioná un paciente para ver sus historias clínicas.';
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
            .from('pacientes')
            .select('*')
            .or(
                `nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`
            )
            .order('id', { ascending: false });

        if (error) throw error;

        renderizarLista(data || []);

    } catch (err) {
        console.error('Error al buscar pacientes:', err);

        mostrarEstado(
            'No se pudo realizar la búsqueda: ' +
            (err.message || 'Error desconocido'),
            false
        );
    }
}


// ==================================================
// PACIENTES: ELIMINAR
// ==================================================

async function borrarPaciente(id) {
    const confirmar = confirm(
        '¿Estás seguro de que querés eliminar este paciente?'
    );

    if (!confirmar) return;

    try {
        const { error } = await obtenerCliente()
            .from('pacientes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        mostrarEstado('Paciente eliminado correctamente.', true);

        await cargarPacientes();

    } catch (err) {
        console.error('Error al eliminar paciente:', err);

        mostrarEstado(
            'No se pudo eliminar el paciente. Es posible que tenga historias clínicas o turnos asociados. ' +
            (err.message || ''),
            false
        );
    }
}


// ==================================================
// HISTORIAS CLÍNICAS: CONSULTAR
// ==================================================

async function cargarHistoriasClinicas(pacienteId) {
    const datosPaciente = document.getElementById('datosPacienteHistoria');
    const listaHistorias = document.getElementById('listaHistorias');

    if (!datosPaciente || !listaHistorias) return;

    datosPaciente.replaceChildren();

    if (!pacienteId) {
        listaHistorias.textContent =
            'Seleccioná un paciente para ver sus historias clínicas.';
        return;
    }

    listaHistorias.textContent = 'Cargando historias clínicas...';

    try {
        const cliente = obtenerCliente();

        const { data: paciente, error: errorPaciente } = await cliente
            .from('pacientes')
            .select('*')
            .eq('id', pacienteId)
            .single();

        if (errorPaciente) throw errorPaciente;

        const tituloPaciente = document.createElement('h3');
        tituloPaciente.textContent = paciente.nombre;

        const dni = document.createElement('p');
        dni.textContent = 'DNI: ' + paciente.dni;

        const telefono = document.createElement('p');
        telefono.textContent = 'Teléfono: ' + paciente.telefono;

        const email = document.createElement('p');
        email.textContent = 'Email: ' + paciente.email;

        datosPaciente.append(
            tituloPaciente,
            dni,
            telefono,
            email
        );

        const { data: historias, error } = await cliente
            .from('historias_clinicas')
            .select('*')
            .eq('paciente_id', pacienteId)
            .order('fecha', { ascending: false });

        if (error) throw error;

        listaHistorias.replaceChildren();

        if (!historias || historias.length === 0) {
            listaHistorias.textContent =
                'Este paciente no tiene historias clínicas registradas.';
            return;
        }

        historias.forEach(historia => {
            const tarjeta = document.createElement('article');
            tarjeta.className = 'patient-card';

            const fecha = document.createElement('h3');
            fecha.textContent = 'Fecha: ' + formatearFecha(historia.fecha);

            const diagnostico = document.createElement('p');
            diagnostico.textContent =
                'Diagnóstico: ' + historia.diagnostico;

            const tratamiento = document.createElement('p');
            tratamiento.textContent =
                'Tratamiento: ' + historia.tratamiento;

            const medico = document.createElement('p');
            medico.textContent =
                'Médico responsable: ' + historia.medico_responsable;

            tarjeta.append(
                fecha,
                diagnostico,
                tratamiento,
                medico
            );

            listaHistorias.appendChild(tarjeta);
        });

    } catch (err) {
        console.error('Error al cargar historias clínicas:', err);

        listaHistorias.textContent =
            'No se pudieron cargar las historias clínicas: ' +
            (err.message || 'Error desconocido');
    }
}


// ==================================================
// ESPECIALISTAS: CARGAR
// ==================================================

async function cargarEspecialistas() {
    const selector = document.getElementById('turnoEspecialista');

    if (selector) {
        selector.replaceChildren();

        const opcionInicial = document.createElement('option');
        opcionInicial.value = '';
        opcionInicial.textContent = 'Cargando especialistas...';

        selector.appendChild(opcionInicial);
        selector.disabled = true;
    }

    try {
        const { data, error } = await obtenerCliente()
            .from('especialistas')
            .select('id, nombre, especialidad, horario')
            .order('id', { ascending: true });

        if (error) throw error;

        especialistasDisponibles = data || [];

        if (selector) {
            selector.replaceChildren();

            const opcionInicial = document.createElement('option');
            opcionInicial.value = '';
            opcionInicial.textContent = especialistasDisponibles.length
                ? 'Seleccioná un especialista'
                : 'No hay especialistas registrados';

            selector.appendChild(opcionInicial);

            especialistasDisponibles.forEach(especialista => {
                const opcion = document.createElement('option');

                opcion.value = String(especialista.id);
                opcion.textContent =
                    especialista.nombre + ' — ' +
                    especialista.especialidad;

                selector.appendChild(opcion);
            });

            selector.disabled = false;
        }

        mostrarInfoEspecialista();

    } catch (err) {
        console.error('Error al cargar especialistas:', err);

        especialistasDisponibles = [];

        if (selector) {
            selector.replaceChildren();

            const opcion = document.createElement('option');
            opcion.value = '';
            opcion.textContent = 'No se pudieron cargar los especialistas';

            selector.appendChild(opcion);
            selector.disabled = true;
        }

        const info = document.getElementById('infoEspecialista');

        if (info) {
            info.textContent =
                'Error al consultar especialistas: ' +
                (err.message || 'Error desconocido');
        }
    }
}


// ==================================================
// ESPECIALISTAS: MOSTRAR INFORMACIÓN
// ==================================================

function mostrarInfoEspecialista() {
    const selector = document.getElementById('turnoEspecialista');
    const info = document.getElementById('infoEspecialista');

    if (!selector || !info) return;

    const especialista = especialistasDisponibles.find(
        item => String(item.id) === selector.value
    );

    if (!especialista) {
        info.textContent = '';
        return;
    }

    info.textContent =
        'Especialidad: ' + especialista.especialidad +
        ' | Horario de atención: ' + especialista.horario;
}


// ==================================================
// TURNOS: SOLICITAR
// ==================================================

async function solicitarTurno(event) {
    event.preventDefault();

    const form = document.getElementById('formTurno');
    const boton = document.getElementById('btnSolicitarTurno');

    const pacienteId = document.getElementById('turnoPaciente').value;
    const especialistaId = document.getElementById('turnoEspecialista').value;
    const fecha = document.getElementById('turnoFecha').value;
    const hora = document.getElementById('turnoHora').value;
    const motivo = document.getElementById('turnoMotivo').value.trim();

    if (!pacienteId || !especialistaId || !fecha || !hora || !motivo) {
        mostrarEstadoTurno('Completá todos los campos.', false);
        return;
    }

    const paciente = pacientesDisponibles.find(
        item => String(item.id) === pacienteId
    );

    const especialista = especialistasDisponibles.find(
        item => String(item.id) === especialistaId
    );

    if (!paciente || !especialista) {
        mostrarEstadoTurno(
            'No se encontró el paciente o el especialista seleccionado. Actualizá la página e intentá nuevamente.',
            false
        );
        return;
    }

    const fechaSolicitada = new Date(`${fecha}T${hora}:00`);
    const ahora = new Date();

    if (Number.isNaN(fechaSolicitada.getTime())) {
        mostrarEstadoTurno('La fecha o la hora no son válidas.', false);
        return;
    }

    if (fechaSolicitada < ahora) {
        mostrarEstadoTurno('Elegí una fecha y hora futuras.', false);
        return;
    }

    mostrarEstadoTurno('Guardando solicitud...', true);

    if (boton) boton.disabled = true;

    try {
        const nuevaSolicitud = {
            paciente_id: Number(pacienteId),
            especialista_id: Number(especialistaId),
            fecha,
            hora,
            especialidad: especialista.especialidad || '',
            motivo,
            estado: 'pendiente'
        };

        const { error } = await obtenerCliente()
            .from('turnos')
            .insert([nuevaSolicitud]);

        if (error) throw error;

        mostrarEstadoTurno(
            'Solicitud registrada correctamente. Estado: pendiente. El turno todavía no está confirmado.',
            true
        );

        form.reset();

        const campoFecha = document.getElementById('turnoFecha');

        if (campoFecha) {
            campoFecha.min = obtenerFechaLocal();
        }

        mostrarInfoEspecialista();

        await cargarTurnos();

    } catch (err) {
        console.error('Error al solicitar turno:', err);

        mostrarEstadoTurno(
            'No se pudo registrar la solicitud: ' +
            (err.message || 'Error desconocido'),
            false
        );

    } finally {
        if (boton) boton.disabled = false;
    }
}


// ==================================================
// TURNOS: CARGAR Y MOSTRAR
// ==================================================

async function cargarTurnos() {
    const lista = document.getElementById('listaTurnos');

    if (!lista) return;

    lista.textContent = 'Cargando solicitudes...';

    try {
        const cliente = obtenerCliente();

        // Asegurar que los nombres de pacientes estén disponibles.
        if (pacientesDisponibles.length === 0) {
            const { data, error } = await cliente
                .from('pacientes')
                .select('id, nombre, dni')
                .order('id', { ascending: true });

            if (error) throw error;

            pacientesDisponibles = data || [];
        }

        // Asegurar que los nombres de especialistas estén disponibles.
        if (especialistasDisponibles.length === 0) {
            const { data, error } = await cliente
                .from('especialistas')
                .select('id, nombre, especialidad, horario')
                .order('id', { ascending: true });

            if (error) throw error;

            especialistasDisponibles = data || [];
        }

        const { data: turnos, error } = await cliente
            .from('turnos')
            .select(`
                id,
                paciente_id,
                especialista_id,
                fecha,
                hora,
                especialidad,
                motivo,
                estado
            `)
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

        if (error) throw error;

        lista.replaceChildren();

        if (!turnos || turnos.length === 0) {
            lista.textContent = 'Todavía no hay solicitudes de turnos.';
            return;
        }

        const pacientesPorId = new Map(
            pacientesDisponibles.map(paciente => [
                String(paciente.id),
                paciente
            ])
        );

        const especialistasPorId = new Map(
            especialistasDisponibles.map(especialista => [
                String(especialista.id),
                especialista
            ])
        );

        turnos.forEach(turno => {
            const tarjeta = document.createElement('article');
            tarjeta.className = 'patient-card';

            const titulo = document.createElement('h3');
            titulo.textContent = 'Solicitud de turno #' + turno.id;

            const paciente = pacientesPorId.get(
                String(turno.paciente_id)
            );

            const especialista = especialistasPorId.get(
                String(turno.especialista_id)
            );

            const nombrePaciente = document.createElement('p');
            nombrePaciente.textContent =
                'Paciente: ' +
                (paciente
                    ? paciente.nombre
                    : 'Paciente #' + turno.paciente_id);

            const nombreEspecialista = document.createElement('p');
            nombreEspecialista.textContent =
                'Especialista: ' +
                (especialista
                    ? especialista.nombre
                    : 'Especialista #' + turno.especialista_id);

            const especialidad = document.createElement('p');
            especialidad.textContent =
                'Especialidad: ' +
                (turno.especialidad ||
                    (especialista ? especialista.especialidad : '') ||
                    'No especificada');

            const fechaHora = document.createElement('p');
            fechaHora.textContent =
                'Fecha: ' + formatearFecha(turno.fecha) +
                ' | Hora: ' +
                (turno.hora
                    ? String(turno.hora).slice(0, 5)
                    : 'No especificada');

            const motivo = document.createElement('p');
            motivo.textContent =
                'Motivo: ' + (turno.motivo || 'No especificado');

            const estado = document.createElement('p');
            estado.textContent =
                'Estado: ' + (turno.estado || 'Sin estado');

            tarjeta.append(
                titulo,
                nombrePaciente,
                nombreEspecialista,
                especialidad,
                fechaHora,
                motivo,
                estado
            );

            lista.appendChild(tarjeta);
        });

    } catch (err) {
        console.error('Error al cargar turnos:', err);

        lista.textContent =
            'No se pudieron cargar las solicitudes: ' +
            (err.message || 'Error desconocido');
    }
}


// ==================================================
// FECHAS: FORMATO
// ==================================================

function formatearFecha(fecha) {
    if (!fecha) return 'No especificada';

    const partes = String(fecha).split('-');

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerFechaLocal() {
    const hoy = new Date();

    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
}
