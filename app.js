
document.addEventListener('DOMContentLoaded', () => {
    cargarPacientes();

    const btnGuardar = document.getElementById('btnGuardar');
    const buscarInput = document.getElementById('buscarInput');

    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarPaciente);
    }

    if (buscarInput) {
        buscarInput.addEventListener('input', buscarPaciente);
    }
});

function obtenerCliente() {
    if (!window.supabaseClient) {
        throw new Error('La conexión con Supabase no está inicializada.');
    }

    return window.supabaseClient;
}

// Cargar y mostrar pacientes
async function cargarPacientes() {
    const lista = document.getElementById('listaPacientes');
    if (!lista) return;

    try {
        const { data, error } = await obtenerCliente()
            .from('pacientes')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            lista.textContent = 'No hay pacientes registrados aún.';
            return;
        }

        renderizarLista(data);
    } catch (err) {
        console.error('Error al cargar pacientes:', err);
        lista.textContent = 'No se pudieron cargar los registros: ' +
            (err.message || 'Error desconocido');
    }
}

// Guardar paciente
async function guardarPaciente() {
    const nombreInput = document.getElementById('nombre');
    const dniInput = document.getElementById('dni');
    const telefonoInput = document.getElementById('telefono');
    const emailInput = document.getElementById('email');
    const statusMsg = document.getElementById('statusMsg');

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
                nombre: nombre,
                dni: dni,
                telefono: telefono,
                email: email
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
        mostrarEstado('No se pudo guardar: ' +
            (err.message || 'Error desconocido'), false);
    }

    function mostrarEstado(mensaje, correcto) {
        if (!statusMsg) return;
        statusMsg.textContent = mensaje;
        statusMsg.style.color = correcto ? '#10b981' : '#ef4444';
    }
}

// Mostrar pacientes sin interpretar los datos como HTML
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
        avatar.textContent = p.nombre ? p.nombre.charAt(0).toUpperCase() : 'P';

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
        telefono.textContent = 'Teléfono: ' + (p.telefono || 'Sin teléfono');

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

// Buscar por nombre o DNI
async function buscarPaciente() {
    const input = document.getElementById('buscarInput');
    const busqueda = input.value.trim();

    if (!busqueda) {
        await cargarPacientes();
        return;
    }

    const lista = document.getElementById('listaPacientes');

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
        lista.textContent = 'Error en la búsqueda: ' +
            (err.message || 'Error desconocido');
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
