// Configuración de Supabase
const SUPABASE_URL = 'https://vipxyjfjdnkfhxcukfut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BwdIhPDdZzhfDBGtDvoxuA__SLZjTTx';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Captura de Elementos
const nombreInput = document.getElementById('nombre');
const dniInput = document.getElementById('dni');
const telefonoInput = document.getElementById('telefono');
const diagnosticoInput = document.getElementById('diagnostico');
const buscarInput = document.getElementById('buscarInput');

const btnGuardar = document.getElementById('btnGuardar');
const btnCargar = document.getElementById('btnCargar');
const listaPacientes = document.getElementById('listaPacientes');
const statusMsg = document.getElementById('statusMsg');

// Listeners
if (btnGuardar) btnGuardar.addEventListener('click', guardarPaciente);
if (btnCargar) btnCargar.addEventListener('click', cargarTodosLosPacientes);
if (buscarInput) buscarInput.addEventListener('input', buscarPaciente);

// 1. GUARDAR PACIENTE (Ajustado al esquema real de la tabla pacientes: id, nombre, dni, email, telefono)
async function guardarPaciente() {
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const dni = dniInput ? dniInput.value.trim() : '';
    const telefono = telefonoInput ? telefonoInput.value.trim() : '';
    const email = diagnosticoInput ? diagnosticoInput.value.trim() : ''; // Guardamos las observaciones/email en el campo email

    if (!nombre || !dni) {
        mostrarEstado('⚠️ Completa Nombre y DNI.', '#ef4444');
        mostrarNotificacion('⚠️ Ingresa Nombre y DNI', 'error');
        return;
    }

    mostrarEstado('Guardando en Supabase...', '#06b6d4');

    // Insert con las columnas reales de Supabase
    const { error } = await supabase
        .from('pacientes')
        .insert([{ nombre, dni, telefono, email }]);

    if (error) {
        console.error('Error Supabase:', error);
        mostrarEstado('❌ Error: ' + error.message, '#ef4444');
        mostrarNotificacion('❌ Error: ' + error.message, 'error');
    } else {
        mostrarEstado('✅ Paciente registrado.', '#10b981');
        mostrarNotificacion(`✅ ¡${nombre} guardado correctamente!`, 'exito');
        limpiarFormulario();
        cargarTodosLosPacientes();
    }
}

// 2. CARGAR TODOS LOS PACIENTES
async function cargarTodosLosPacientes() {
    mostrarEstado('Sincronizando con Supabase...', '#06b6d4');

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error al cargar:', error);
        mostrarEstado('❌ Error: ' + error.message, '#ef4444');
        mostrarNotificacion('❌ Error al consultar la base de datos', 'error');
        return;
    }

    renderizarLista(data);
    mostrarEstado(`Base de datos actualizada (${data.length} pacientes)`, '#10b981');
}

// 3. BUSCAR PACIENTE
async function buscarPaciente() {
    const busqueda = buscarInput ? buscarInput.value.trim() : '';

    if (busqueda === '') {
        cargarTodosLosPacientes();
        return;
    }

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .or(`nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`)
        .order('id', { ascending: false });

    if (error) return;
    renderizarLista(data);
}

// 4. ELIMINAR PACIENTE
window.borrarPaciente = async function(id, nombre) {
    if (!confirm(`¿Deseas eliminar a ${nombre || 'este paciente'}?`)) return;

    mostrarEstado('Eliminando registro...', '#06b6d4');

    const { error } = await supabase.from('pacientes').delete().eq('id', id);

    if (error) {
        mostrarEstado('❌ Error al eliminar', '#ef4444');
        mostrarNotificacion('❌ No se pudo eliminar', 'error');
    } else {
        mostrarNotificacion('🗑️ Paciente eliminado', 'exito');
        cargarTodosLosPacientes();
    }
};

// AUXILIARES
function renderizarLista(pacientes) {
    if (!listaPacientes) return;
    listaPacientes.innerHTML = '';

    if (!pacientes || pacientes.length === 0) {
        listaPacientes.innerHTML = '<div class="empty-state">No hay pacientes registrados en Supabase.</div>';
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
        listaPacientes.appendChild(card);
    });
}

function limpiarFormulario() {
    if (nombreInput) nombreInput.value = '';
    if (dniInput) dniInput.value = '';
    if (telefonoInput) telefonoInput.value = '';
    if (diagnosticoInput) diagnosticoInput.value = '';
}

function mostrarEstado(mensaje, color) {
    if (statusMsg) {
        statusMsg.innerText = mensaje;
        statusMsg.style.color = color;
    }
}

function mostrarNotificacion(mensaje, tipo = 'exito') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${tipo === 'exito' ? '#10b981' : '#ef4444'};
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.88rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        z-index: 9999;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    toast.innerText = mensaje;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', cargarTodosLosPacientes);
