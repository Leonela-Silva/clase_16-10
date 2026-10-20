
document.addEventListener('DOMContentLoaded', () => {
    cargarPacientes();

    const btnGuardar = document.getElementById('btnGuardar');
    const buscarInput = document.getElementById('buscarInput');
    const pacienteHistoria = document.getElementById('pacienteHistoria');

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
});

function obtenerCliente() {
    if (!window.supabaseClient) {
        throw new Error('La conexión con Supabase no está inicializada.');
    }

    return window.supabaseClient;
}

// Mostrar mensajes del formulario de pacientes
function mostrarEstado(mensaje, correcto) {
    const statusMsg = document.getElementById('statusMsg');
    if (!statusMsg) return;

    statusMsg.textContent = mensaje;
    statusMsg.style.color = correcto ? '#10b981' : '#ef4444';
}

// Cargar pacientes y actualizar el selector de historias clínicas
async function cargarPacientes() {
    const lista = document.getElementById('listaPacientes');

    try {
        const { data, error } = await obtenerCliente()
            .from('pacientes')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        const pacientes = data || [];

        if (lista) {
            if (pacientes.length === 0) {
                lista.textContent = 'No hay pacientes registrados aún.';
            } else {
                renderizarLista(pacientes);
            }
        }

        actualizarSelectorPacientes(pacientes);

    } catch (err) {
        console.error('Error al cargar pacientes:', err);

        if (lista) {
            lista.textContent = 'No se pudieron cargar los registros: ' +
                (err.message || 'Error desconocido');
        }
    }
}

// Actualizar el selector sin perder la selección actual
function actualizarSelectorPacientes(pacientes) {
    const selector = document.getElementById('pacienteHistoria');
    if (!selector) return;

    const seleccionAnterior = selector.value;

    selector.replaceChildren();

    const opcionInicial = document.createElement('option');
    opcionInicial.value = '';
    opcionInicial.textContent = 'Seleccioná un paciente';
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

    if (existeSeleccion) {
        selector.value = seleccionAnterior;
    } else {
        selector.value = '';

        const datosPaciente = document.getElementById('datosPacienteHistoria');
        const listaHistorias = document.getElementById('listaHistorias');

        if (datosPaciente) datosPaciente.replaceChildren();
        if (listaHistorias) {
            listaHistorias.textContent =
                'Seleccioná un paciente para consultar sus historias clínicas.';
        }
    }
}

// Guardar paciente
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

// Mostrar pacientes de forma segura
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

// Buscar pacientes por nombre o DNI
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

        renderizarLista(data || []);

    } catch (err) {
        console.error('Error al buscar pacientes:', err);

        if (lista) {
            lista.textContent = 'Error en la búsqueda: ' +
                (err.message || 'Error desconocido');
        }
    }
}

// Eliminar paciente
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

// Cargar historias clínicas de un paciente
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

// Dar formato a la fecha
function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no especificada';

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
        return fecha;
    }

    return fechaConvertida.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
