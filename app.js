// Event Listeners al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarTodosLosPacientes();

    const btnGuardar = document.getElementById('btnGuardar');
    const btnCargar = document.getElementById('btnCargar');
    const buscarInput = document.getElementById('buscarInput');

    if (btnGuardar) btnGuardar.addEventListener('click', guardarPaciente);
    if (btnCargar) btnCargar.addEventListener('click', cargarTodosLosPacientes);
    if (buscarInput) buscarInput.addEventListener('input', buscarPaciente);
});

// 1. CARGAR TODOS LOS PACIENTES
async function cargarTodosLosPacientes() {
    const lista = document.getElementById('listaPacientes');
    const statusMsg = document.getElementById('statusMsg');

    if (statusMsg) {
        statusMsg.innerText = 'Cargando registros...';
        statusMsg.style.color = '#06b6d4';
    }

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error al cargar:', error);
        if (statusMsg) {
            statusMsg.innerText = '❌ Error de conexión: ' + error.message;
            statusMsg.style.color = '#ef4444';
        }
        if (lista) lista.innerHTML = `<div class="empty-state">Error al cargar datos.</div>`;
        return;
    }

    if (statusMsg) {
        statusMsg.innerText = `Sincronizado (${data ? data.length : 0} pacientes)`;
        statusMsg.style.color = '#10b981';
    }

    renderizarLista(data);
}

// 2. GUARDAR NUEVO PACIENTE
async function guardarPaciente() {
    const nombreInput = document.getElementById('nombre');
    const dniInput = document.getElementById('dni');
    const telefonoInput = document.getElementById('telefono');
    const diagnosticoInput = document.getElementById('diagnostico');
    const statusMsg = document.getElementById('statusMsg');

    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const dni = dniInput ? dniInput.value.trim() : '';
    const telefono = telefonoInput ? telefonoInput.value.trim() : '';
    const email = diagnosticoInput ? diagnosticoInput.value.trim() : '';

    if (!nombre || !dni) {
        if (statusMsg) {
            statusMsg.innerText = '⚠️ Completa Nombre y DNI';
            statusMsg.style.color = '#ef4444';
        }
        return;
    }

    if (statusMsg) {
        statusMsg.innerText = 'Guardando paciente...';
        statusMsg.style.color = '#06b6d4';
    }

    const { error } = await supabase
        .from('pacientes')
        .insert([{ nombre, dni, telefono, email }]);

    if (error) {
        console.error('Error al guardar:', error);
        if (statusMsg) {
            statusMsg.innerText = '❌ Error al guardar: ' + error.message;
            statusMsg.style.color = '#ef4444';
        }
    } else {
        if (statusMsg) {
            statusMsg.innerText = '✅ ¡Paciente guardado exitosamente!';
            statusMsg.style.color = '#10b981';
        }
        limpiarFormulario();
        cargarTodosLosPacientes();
    }
}

// 3. BUSCAR PACIENTE EN TIEMPO REAL
async function buscarPaciente() {
    const busqueda = document.getElementById('buscarInput').value.trim();

    if (busqueda === '') {
        cargarTodosLosPacientes();
        return;
    }

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .or(`nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`)
        .order('id', { ascending: false });

    if (!error) {
        renderizarLista(data);
    }
}

// 4. ELIMINAR PACIENTE
async function borrarPaciente(id, nombre) {
    if (!confirm(`¿Deseas eliminar a ${nombre}?`)) return;

    const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error al eliminar: ' + error.message);
    } else {
        cargarTodosLosPacientes();
    }
}

// FUNCIONES AUXILIARES
function renderizarLista(pacientes) {
    const lista = document.getElementById('listaPacientes');
    if (!lista) return;

    lista.innerHTML = '';

    if (!pacientes || pacientes.length === 0) {
        lista.innerHTML = '<div class="empty-state">No hay pacientes registrados.</div>';
        return;
    }

    pacientes.forEach(p => {
        const inicial = p.nombre ? p.nombre.charAt(0).toUpperCase() : 'P';
        const card = document.createElement('div');
        card.className = 'patient-card';
        card.innerHTML = `
            <div class="patient-main">
                <div class="patient-avatar">${inicial}</div>
                <div class="patient-info">
                    <h4>${p.nombre}</h4>
                    <div class="patient-meta">
                        <span class="badge">DNI: ${p.dni}</span>
                        <span>📱 ${p.telefono || 'Sin teléfono'}</span>
                        <span>📧 ${p.email || 'Sin observaciones'}</span>
                    </div>
                </div>
            </div>
            <button class="btn-delete" onclick="borrarPaciente(${p.id}, '${p.nombre}')" title="Eliminar paciente">🗑️</button>
        `;
        lista.appendChild(card);
    });
}

function limpiarFormulario() {
    const nombre = document.getElementById('nombre');
    const dni = document.getElementById('dni');
    const telefono = document.getElementById('telefono');
    const diagnostico = document.getElementById('diagnostico');

    if (nombre) nombre.value = '';
    if (dni) dni.value = '';
    if (telefono) telefono.value = '';
    if (diagnostico) diagnostico.value = '';
}
