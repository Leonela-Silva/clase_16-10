// app.js - Flujo de Interfaz Limpio y Asíncrono
document.addEventListener('DOMContentLoaded', () => {
    // Cargar la lista silenciosamente al iniciar
    cargarPacientes();

    // Asignar eventos
    const btnGuardar = document.getElementById('btnGuardar');
    const buscarInput = document.getElementById('buscarInput');

    if (btnGuardar) btnGuardar.addEventListener('click', guardarPaciente);
    if (buscarInput) buscarInput.addEventListener('input', buscarPaciente);
});

// Función auxiliar para mostrar notificaciones únicamente cuando sea necesario
function mostrarEstado(mensaje, esError = false) {
    const statusMsg = document.getElementById('statusMsg');
    if (statusMsg) {
        statusMsg.innerText = mensaje;
        statusMsg.style.color = esError ? '#ef4444' : '#10b981';
    }
}

// 1. CARGAR PACIENTES
async function cargarPacientes() {
    const lista = document.getElementById('listaPacientes');
    if (!lista) return;

    try {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error Supabase:', error);
            mostrarEstado('❌ Error de conexión: ' + error.message, true);
            lista.innerHTML = `<div class="empty-state">No se pudieron recuperar los registros.</div>`;
            return;
        }

        if (!data || data.length === 0) {
            lista.innerHTML = '<div class="empty-state">No hay pacientes registrados.</div>';
            return;
        }

        renderizarPacientes(data);

    } catch (err) {
        console.error('Error General:', err);
        mostrarEstado('❌ Error en el script: ' + err.message, true);
    }
}

// 2. GUARDAR PACIENTE
async function guardarPaciente() {
    const nombre = document.getElementById('nombre') ? document.getElementById('nombre').value.trim() : '';
    const dni = document.getElementById('dni') ? document.getElementById('dni').value.trim() : '';
    const telefono = document.getElementById('telefono') ? document.getElementById('telefono').value.trim() : '';
    const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';

    if (!nombre || !dni) {
        mostrarEstado('⚠️ Completa Nombre y DNI', true);
        return;
    }

    mostrarEstado('Guardando...');

    try {
        const { error } = await supabase
            .from('pacientes')
            .insert([{ nombre, dni, telefono, email }]);

        if (error) {
            console.error('Error insert:', error);
            mostrarEstado('❌ Error al guardar: ' + error.message, true);
        } else {
            mostrarEstado('✅ ¡Paciente guardado exitosamente!');
            limpiarFormulario();
            cargarPacientes();
            
            // Ocultar mensaje de éxito tras 4 segundos
            setTimeout(() => { mostrarEstado(''); }, 4000);
        }
    } catch (err) {
        mostrarEstado('❌ Error inesperado: ' + err.message, true);
    }
}

// 3. RENDERIZAR LISTA
function renderizarPacientes(pacientes) {
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
            
            <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="toggleHistorial(${p.id})">📋 Ver Ficha</button>
                <button class="btn-delete" onclick="borrarPaciente(${p.id}, '${p.nombre}')" title="Eliminar">🗑️</button>
            </div>

            <div id="historial-${p.id}" style="display: none; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 0.85rem; color: #475569;">
                <p><strong>📧 Email / Observaciones:</strong> ${p.email || 'Sin datos de email registrados.'}</p>
                <p style="color: #94a3b8; font-size: 0.75rem;">ID Paciente: #${p.id}</p>
            </div>
        `;
        lista.appendChild(card);
    });
}

// 4. BUSCADOR EN TIEMPO REAL
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
        if (data.length === 0) {
            document.getElementById('listaPacientes').innerHTML = '<div class="empty-state">No se encontraron resultados.</div>';
        } else {
            renderizarPacientes(data);
        }
    }
}

// 5. ELIMINAR PACIENTE
async function borrarPaciente(id, nombre) {
    if (!confirm(`¿Deseas eliminar el registro de ${nombre}?`)) return;

    const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error al eliminar: ' + error.message);
    } else {
        cargarPacientes();
    }
}

// TOGGLE FICHA
function toggleHistorial(id) {
    const el = document.getElementById(`historial-${id}`);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
}

// LIMPIAR CAMPOS
function limpiarFormulario() {
    ['nombre', 'dni', 'telefono', 'email'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}
