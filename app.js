
let pacientesDisponibles = [];
let especialistasDisponibles = [];

document.addEventListener('DOMContentLoaded', () => {
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

    // Evita seleccionar fechas anteriores al día actual.
    if (turnoFecha) {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');

        turnoFecha.min = `${anio}-${mes}-${dia}`;
    }

    cargarPacientes();
    cargarEspecialistas();
    cargarTurnos();
});

function obtenerCliente() {
    if (!window.supabaseClient) {
        throw new Error('La conexión con Supabase no está inicializada.');
    }

    return window.supabaseClient;
}

// Mostrar mensajes del formulario de pacientes.
function mostrarEstado(mensaje, correcto) {
    const statusMsg = document.getElementById('statusMsg');
    if (!statusMsg) return;

    statusMsg.textContent = mensaje;
    statusMsg.style.color = correcto ? '#10b981' : '#ef4444';
}

// Mostrar mensajes del formulario de turnos.
function mostrarEstadoTurno(mensaje, correcto) {
    const status = document.getElementById('turnoStatus');
    if (!status) return;

    status.textContent = mensaje;
    status.style.color = correcto ? '#10b981' : '#ef4444';
}

// Cargar pacientes desde Supabase.
async function cargarPacientes() {
    const lista = document.getElementById('listaPacientes');

    try {
        const { data, error } = await obtenerCliente()
            .from('pacientes')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        pacientesDisponibles = data || [];

        if (lista) {
            if (pacientesDisponibles.length === 0) {
                lista.textContent = 'No hay pacientes registrados aún.';
            } else {
                renderizarLista(pacientesDisponibles);
            }
        }

        actualizarSelectoresPacientes(pacientesDisponibles);

        // Actualiza los nombres en el listado de turnos.
        await cargarTurnos();

    } catch (err) {
        console.error('Error al cargar pacientes:', err);

        if (lista) {
            lista.textContent = 'No se pudieron cargar los registros: ' +
                (err.message || 'Error desconocido');
        }
    }
}

// Actualizar ambos selectores sin perder la selección actual.
function actualizarSelectoresPacientes(pacientes) {
    actualizarSelectorPaciente(
        document.getElementById('pacienteHistoria'),
        pacientes,
        'Seleccioná un paciente'
    );

    actualizarSelectorPaciente(
        document.getElementById('turnoPaciente'),
        pacientes,
        'Seleccioná un paciente'
    );
}

function actualizarSelectorPaciente(selector, pacientes, textoInicial) {
    if (!selector) return;

    const seleccionAnterior = selector.value;

    selector.replaceChildren();

    const opcionInicial = document.createElement('option');
    opcionInicial.value = '';
    opcionInicial.textContent = textoInicial;
    selector.appendChild(opcionInicial);

    pacientes.forEach(paciente => {
        const opcion = document.createElement('option');
        opcion.value = paciente.id;
        opcion.textContent =
            `${paciente.nombre || 'Sin nombre'} — DNI: ${paciente.dni || 'S/D'}`;

        selector.appendChild(opcion);
    });

    const existeSeleccion = pacientes.some(
        paciente => String(paciente.id) === seleccionAnterior
    );

    selector.value = existeSeleccion ? seleccionAnterior : '';

    if (
        selector.id === 'pacienteHistoria' &&
        !existeSeleccion
    ) {
        const datosPaciente = document.getElementById('datosPacienteHistoria');
        const listaHistorias = document.getElementById('listaHistorias');

        if (datosPaciente) datosPaciente.replaceChildren();

        if (listaHistorias) {
            listaHistorias.textContent =
                'Seleccioná un paciente para consultar sus historias clínicas.';
        }
    }
}

// Guardar paciente.
async function guardarPaciente() {
    const nombreInput = document.getElementById('nombre');
    const dniInput = document.getElementById('dni');
    const telefonoInput = document.getElementById('telefono');
    const emailInput = document.getElementById('email');

    const nombre = nombreInput.value.trim();
    const dni = dniInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const email = emailInput.value.trim();

    if (!nombre || !dni) {
        mostrarEstado('Ingresá el nombre y el DNI.', false);
        return;
    }

    mostrarEstado('Guardando...', true);

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

        nombreInput.value = '';
        dniInput.value = '';
        telefonoInput.value = '';
        emailInput.value = '';

        mostrarEstado('Paciente guardado correctamente.', true);
        await cargarPacientes();

    } catch (err) {
        console.error('Error al guardar paciente:', err);

        mostrarEstado(
            'No se pudo guardar: ' + (err.message || 'Error desconocido'),
            false
        );
    }
}

// Mostrar pacientes de forma segura.
function renderizarLista(pacientes) {
    const lista = document.getElementById('listaPacientes');
    if (!lista) return;

    lista.replaceChildren();

    pacientes.forEach(p => {
        const card = document.createElement('div');
        card.className = 'patient-card';

        const main = document.createElement('div');
        main.className = 'patient-main';

        const avatar = document.createElement('div');
        avatar.className = 'patient-avatar';
        avatar.textContent = p.nombre
            ? p.nombre.charAt(0).toUpperCase()
            : 'P';

        const info = document.createElement('div');
        info.className = 'patient-info';

        const nombre = document.createElement('h4');
        nombre.textContent = p.nombre || 'Sin nombre';

        const meta = document.createElement('div');
        meta.className = 'patient-meta';

        const dni = document.createElement('span');
        dni.className = 'badge';
        dni.textContent = 'DNI: ' + (p.dni || 'S/D');

        const telefono = document.createElement('span');
        telefono.textContent =
            'Teléfono: ' + (p.telefono || 'Sin teléfono');

        const eliminar = document.createElement('button');
        eliminar.className = 'btn-delete';
        eliminar.type = 'button';
        eliminar.textContent = '🗑️';
        eliminar.title = 'Eliminar paciente';
        eliminar.addEventListener('click', () => borrarPaciente(p.id));

        meta.append(dni, telefono);
        info.append(nombre, meta);
        main.append(avatar, info);
        card.append(main, eliminar);
        lista.appendChild(card);
    });
}

// Buscar pacientes por nombre o DNI.
async function buscarPaciente() {
    const input = document.getElementById('buscarInput');
    const busqueda = input.value.trim();
    const lista = document.getElementById('listaPacientes');

    if (!busqueda) {
        await cargarPacientes();
        return;
    }

    try {
        const { data, error } = await obtenerCliente()
            .from('pacientes')
            .select('*')
            .or(`nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`)
            .order('id', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            if (lista) lista.textContent = 'No se encontraron pacientes.';
            return;
        }

        renderizarLista(data);

    } catch (err) {
        console.error('Error al buscar pacientes:', err);

        if (lista) {
            lista.textContent = 'Error en la búsqueda: ' +
                (err.message || 'Error desconocido');
        }
    }
}

// Eliminar paciente.
async function borrarPaciente(id) {
    if (!confirm('¿Deseás eliminar este registro?')) return;

    try {
        const { error } = await obtenerCliente()
            .from('pacientes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await cargarPacientes();

    } catch (err) {
        console.error('Error al eliminar paciente:', err);

        alert('No se pudo eliminar: ' +
            (err.message || 'Error desconocido'));
    }
}

// Cargar historias clínicas de un paciente.
async function cargarHistoriasClinicas(pacienteId) {
    const datosPaciente = document.getElementById('datosPacienteHistoria');
    const listaHistorias = document.getElementById('listaHistorias');

    if (datosPaciente) datosPaciente.replaceChildren();
    if (!listaHistorias) return;

    listaHistorias.textContent = '';

    if (!pacienteId) {
        listaHistorias.textContent =
            'Seleccioná un paciente para consultar sus historias clínicas.';
        return;
    }

    listaHistorias.textContent = 'Cargando historias clínicas...';

    try {
        const cliente = obtenerCliente();

        const { data: paciente, error: errorPaciente } = await cliente
            .from('pacientes')
            .select('id, nombre, dni, email, telefono')
            .eq('id', pacienteId)
            .single();

        if (errorPaciente) throw errorPaciente;

        if (datosPaciente) {
            const titulo = document.createElement('h3');
            titulo.textContent = paciente.nombre || 'Paciente';

            const documento = document.createElement('p');
            documento.textContent = 'DNI: ' + (paciente.dni || 'S/D');

            const contacto = document.createElement('p');
            contacto.textContent =
                'Email: ' + (paciente.email || 'Sin email') +
                ' | Teléfono: ' + (paciente.telefono || 'Sin teléfono');

            datosPaciente.append(titulo, documento, contacto);
        }

        const { data: historias, error: errorHistorias } = await cliente
            .from('historias_clinicas')
            .select('id, paciente_id, fecha, diagnostico, tratamiento, medico_responsable')
            .eq('paciente_id', pacienteId)
            .order('fecha', { ascending: false });

        if (errorHistorias) throw errorHistorias;

        listaHistorias.replaceChildren();

        if (!historias || historias.length === 0) {
            listaHistorias.textContent =
                'Este paciente todavía no tiene historias clínicas registradas.';
            return;
        }

        historias.forEach(historia => {
            const tarjeta = document.createElement('article');
            tarjeta.className = 'patient-card';

            const titulo = document.createElement('h3');
            titulo.textContent = 'Consulta: ' + formatearFecha(historia.fecha);

            const diagnostico = document.createElement('p');
            diagnostico.textContent =
                'Diagnóstico: ' + (historia.diagnostico || 'Sin diagnóstico');

            const tratamiento = document.createElement('p');
            tratamiento.textContent =
                'Tratamiento: ' + (historia.tratamiento || 'Sin tratamiento');

            const medico = document.createElement('p');
            medico.textContent =
                'Médico responsable: ' +
                (historia.medico_responsable || 'Sin especificar');

            tarjeta.append(titulo, diagnostico, tratamiento, medico);
            listaHistorias.appendChild(tarjeta);
        });

    } catch (err) {
        console.error('Error al cargar historias clínicas:', err);

        listaHistorias.textContent =
            'No se pudieron cargar las historias clínicas: ' +
            (err.message || 'Error desconocido');
    }
}

// Dar formato a una fecha sin alterar el día por diferencias horarias.
function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no especificada';

    const partes = String(fecha).split('-');

    if (
        partes.length === 3 &&
        partes[0].length === 4
    ) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
        return fecha;
    }

    return fechaConvertida.toLocaleDateString('es-AR');
}

// ==================================================
// MÓDULO DE ESPECIALISTAS
// ==================================================

async function cargarEspecialistas() {
    const selector = document.getElementById('turnoEspecialista');
    const info = document.getElementById('infoEspecialista');

    if (!selector) return;

    try {
        const { data, error } = await obtenerCliente()
            .from('especialistas')
            .select('id, nombre, especialidad, horario')
            .order('id', { ascending: true });

        if (error) throw error;

        especialistasDisponibles = data || [];

        selector.replaceChildren();

        const opcionInicial = document.createElement('option');
        opcionInicial.value = '';
        opcionInicial.textContent = especialistasDisponibles.length
            ? 'Seleccioná un especialista'
            : 'No hay especialistas registrados';

        selector.appendChild(opcionInicial);

        especialistasDisponibles.forEach(especialista => {
            const opcion = document.createElement('option');
            opcion.value = especialista.id;
            opcion.textContent =
                `${especialista.nombre} — ${especialista.especialidad}`;

            selector.appendChild(opcion);
        });

        mostrarInfoEspecialista();

    } catch (err) {
        console.error('Error al cargar especialistas:', err);

        selector.replaceChildren();

        const opcion = document.createElement('option');
        opcion.value = '';
        opcion.textContent = 'No se pudieron cargar los especialistas';
        selector.appendChild(opcion);

        if (info) {
            info.textContent =
                'Error al cargar especialistas: ' +
                (err.message || 'Error desconocido');
        }
    }
}

// Mostrar el horario informativo del especialista seleccionado.
function mostrarInfoEspecialista() {
    const selector = document.getElementById('turnoEspecialista');
    const info = document.getElementById('infoEspecialista');

    if (!selector || !info) return;

    const especialista = especialistasDisponibles.find(
        e => String(e.id) === selector.value
    );

    if (!especialista) {
        info.textContent =
            'Seleccioná un especialista para consultar su horario.';
        return;
    }

    info.replaceChildren();

    const especialidad = document.createElement('p');
    especialidad.textContent =
        'Especialidad: ' + (especialista.especialidad || 'No especificada');

    const horario = document.createElement('p');
    horario.textContent =
        'Horario informado: ' + (especialista.horario || 'No especificado');

    const aviso = document.createElement('p');
    aviso.textContent =
        'Este horario es informativo. La solicitud no confirma disponibilidad.';

    info.append(especialidad, horario, aviso);
}

// ==================================================
// MÓDULO DE SOLICITUDES DE TURNOS
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
        p => String(p.id) === pacienteId
    );

    const especialista = especialistasDisponibles.find(
        e => String(e.id) === especialistaId
    );

    if (!paciente) {
        mostrarEstadoTurno(
            'No se encontró el paciente seleccionado. Actualizá la página e intentá nuevamente.',
            false
        );
        return;
    }

    if (!especialista) {
        mostrarEstadoTurno(
            'No se encontró el especialista seleccionado. Actualizá la página e intentá nuevamente.',
            false
        );
        return;
    }

    // Evitar solicitudes con fecha u hora anteriores al momento actual.
    const fechaSolicitada = new Date(`${fecha}T${hora}:00`);
    const ahora = new Date();

    if (Number.isNaN(fechaSolicitada.getTime())) {
        mostrarEstadoTurno('La fecha o la hora no son válidas.', false);
        return;
    }

    if (fechaSolicitada < ahora) {
        mostrarEstadoTurno(
            'Elegí una fecha y hora futuras.',
            false
        );
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

        // Limpiar los campos de la solicitud.
        form.reset();

        // Mantener la fecha mínima actualizada.
        const turnoFecha = document.getElementById('turnoFecha');

        if (turnoFecha) {
            const hoy = new Date();
            const anio = hoy.getFullYear();
            const mes = String(hoy.getMonth() + 1).padStart(2, '0');
            const dia = String(hoy.getDate()).padStart(2, '0');

            turnoFecha.min = `${anio}-${mes}-${dia}`;
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

// Consultar y mostrar solicitudes registradas.
async function cargarTurnos() {
    const lista = document.getElementById('listaTurnos');
    if (!lista) return;

    lista.textContent = 'Cargando solicitudes...';

    try {
        const { data: turnos, error } = await obtenerCliente()
            .from('turnos')
            .select('id, paciente_id, especialista_id, fecha, hora, especialidad, motivo, estado')
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

        if (error) throw error;

        lista.replaceChildren();

        if (!turnos || turnos.length === 0) {
            lista.textContent = 'Todavía no hay solicitudes de turnos.';
            return;
        }

        // Crear un mapa para identificar pacientes y especialistas.
        const pacientesPorId = new Map(
            pacientesDisponibles.map(p => [String(p.id), p])
        );

        const especialistasPorId = new Map(
            especialistasDisponibles.map(e => [String(e.id), e])
        );

        turnos.forEach(turno => {
            const tarjeta = document.createElement('article');
            tarjeta.className = 'patient-card';

            const titulo = document.createElement('h3');
            titulo.textContent = 'Solicitud de turno #' + turno.id;

            const paciente = pacientesPorId.get(String(turno.paciente_id));
            const especialista = especialistasPorId.get(
                String(turno.especialista_id)
            );

            const nombrePaciente = document.createElement('p');
            nombrePaciente.textContent =
                'Paciente: ' +
                (paciente ? paciente.nombre : 'Paciente #' + turno.paciente_id);

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
                    (especialista && especialista.especialidad) ||
                    'No especificada');

            const fechaHora = document.createElement('p');
            fechaHora.textContent =
                'Fecha: ' + formatearFecha(turno.fecha) +
                ' | Hora: ' + (turno.hora
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
