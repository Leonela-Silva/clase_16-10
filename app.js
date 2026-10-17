// app.js - Versión Simplificada y Garantizada
document.addEventListener('DOMContentLoaded', () => {
    // Carga inicial al abrir
    cargarPacientes();

    // Asignación de botones
    const btnGuardar = document.getElementById('btnGuardar');
    const buscarInput = document.getElementById('buscarInput');

    if (btnGuardar) btnGuardar.addEventListener('click', guardarPaciente);
    if (buscarInput) buscarInput.addEventListener('input', buscarPaciente);
});

// FUNCIÓN DE CARGA SIMPLE
async function cargarPacientes() {
    const lista = document.getElementById('listaPacientes');
    if (!lista) return;

    try {
        // Consultamos únicamente campos básicos que existen en la tabla
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error de Supabase:', error.message);
            lista.innerHTML = `<div class="empty-state">Error al cargar: ${error.message}</div>`;
            return;
        }

        if (!data || data.length === 0) {
            lista.innerHTML = '<div class="empty-state">No hay pacientes registrados aún.</div>';
            return;
        }

        renderizarLista(data);

    } catch (err) {
        console.error('Error general:', err);
    }
}

// FUNCIÓN DE GUARDADO SEGURO
async function guardarPaciente() {
    const nombreInput = document.getElementById('nombre');
    const dniInput = document.getElementById('dni');
    const telefonoInput = document.getElementById('telefono');
    const statusMsg = document.getElementById('statusMsg');

    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const dni = dniInput ? dniInput.value.trim() : '';
    const telefono = telefonoInput ? telefonoInput.value.trim() : '';

    if (!nombre || !dni) {
        if (statusMsg) {
            statusMsg.innerText = '⚠️ Por favor ingresa Nombre y DNI';
            statusMsg.style.color = '#ef4444';
        }
        return;
    }

    if (statusMsg) statusMsg.innerText = 'Guardando...';

    // Insertamos solo las columnas universales
    const { error } = await supabase
        .from('pacientes')
        .insert([{ nombre: nombre, dni: dni, telefono: telefono }]);

    if (error) {
        console.error('Error al guardar:', error);
        if (statusMsg) {
            statusMsg.innerText = '❌ Error: ' + error.message;
            statusMsg.style.color = '#ef4444';
        }
    } else {
        if (statusMsg) {
            statusMsg.innerText = '✅ ¡Paciente guardado con éxito!';
            statusMsg.style.color = '#10b981';
        }
        // Limpiamos los inputs
        if (nombreInput) nombreInput.value = '';
        if (dniInput) dniInput.value = '';
        if (telefonoInput) telefonoInput.value = '';

        // Recargamos la lista inmediatamente
        cargarPacientes();

        setTimeout(() => { if (statusMsg) statusMsg.innerText = ''; }, 3000);
    }
}

// RENDERIZADO DE LA LISTA
function renderizarLista(pacientes) {
    const lista = document.getElementById('listaPacientes');
    if (!lista) return;

    lista.innerHTML = '';
    pacientes.forEach(p => {
        const inicial = p.nombre ? p.nombre.charAt(0).toUpperCase() : 'P';
        const card = document.createElement('div');
        card.className = 'patient-card';
        card.innerHTML = `
            <div class="patient-main">
                <div class="patient-avatar">${inicial}</div>
                <div class="patient-info">
                    <h4>${p.nombre || 'Sin nombre'}</h4>
                    <div class="patient-meta">
                        <span class="badge">DNI: ${p.dni || 'S/D'}</span>
                        <span>📱 ${p.telefono || 'Sin teléfono'}</span>
                    </div>
                </div>
            </div>
            <button class="btn-delete" onclick="borrarPaciente(${p.id})" title="Eliminar">🗑️</button>
        `;
        lista.appendChild(card);
    });
}

// BUSCADOR EN TIEMPO REAL
async function buscarPaciente() {
    const busqueda = document.getElementById('buscarInput').value.trim();

    if (busqueda === '') {
        cargarPacientes();
        return;
    }

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .or(`nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`);

    if (!error && data) {
        renderizarLista(data);
    }
}

// ELIMINAR PACIENTE
async function borrarPaciente(id) {
    if (!confirm('¿Deseas eliminar este registro?')) return;

    const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id);

    if (!error) {
        cargarPacientes();
    } else {
        alert('Error al eliminar: ' + error.message);
    }
}
