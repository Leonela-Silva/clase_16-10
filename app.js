// Configuración de Supabase
const SUPABASE_URL = 'https://vipxyjfjdnkfhxcukfut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BwdIhPDdZzhfDBGtDvoxuA__SLZjTTx';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos DOM
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

// 1. CARGAR/INSERTAR EN LA BASE DE DATOS
async function guardarPaciente() {
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const dni = dniInput ? dniInput.value.trim() : '';
    const telefono = telefonoInput ? telefonoInput.value.trim() : '';
    const diagnostico = diagnosticoInput ? diagnosticoInput.value.trim() : '';

    if (!nombre || !dni) {
        mostrarEstado('⚠️ Completa Nombre y DNI.', '#ef4444');
        mostrarNotificacion('⚠️ Por favor completa Nombre y DNI', 'error');
        return;
    }

    mostrarEstado('Guardando en Supabase...', '#06b6d4');

    const { error } = await supabase
        .from('pacientes')
        .insert([{ nombre, dni, telefono, diagnostico }]);

    if (error) {
        console.error('Error Supabase:', error);
        mostrarEstado('❌ Error: ' + error.message, '#ef4444');
        mostrarNotificacion('❌ Error al guardar en Supabase', 'error');
    } else {
        mostrarEstado('✅ Paciente registrado.', '#10b981');
        mostrarNotificacion(`✅ ¡${nombre} guardado con éxito!`, 'exito');
        limpiarFormulario();
        cargarTodosLosPacientes();
    }
}

// 2. CONSULTAR Y MOSTRAR REGISTROS
async function cargarTodosLosPacientes() {
    mostrarEstado('Sincronizando...', '#06b6d4');

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        mostrarEstado('❌ Error: ' + error.message, '#ef4444');
        mostrarNotificacion('❌ Error al consultar la base de datos', 'error');
        return;
    }

    renderizarLista(data);
    mostrarEstado(`Base de datos actualizada (${data.length} pacientes)`, '#10b981');
}

// 3. BUSCAR PACIENTES EN TIEMPO REAL
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

// 4. BORRAR REGISTRO
window.borrarPaciente = async function(id, nombre) {
    if (!confirm(`¿Eliminar definitivamente a ${nombre || 'este paciente'}?`)) return;

    mostrarEstado('Eliminando registro...', '#06b6d4');

    const { error } = await supabase.from('pacientes').delete().eq('id', id);

    if (error) {
        mostrarEstado('❌ Error al eliminar', '#ef4444');
        mostrarNotificacion('❌ No se pudo borrar el registro', 'error');
    } else {
        mostrarNotificacion('🗑️ Paciente eliminado correctamente', 'exito');
        cargarTodosLosPacientes();
    }
};

// AUXILIARES DE INTERFAZ
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
                        <span class="badge">DNI ${p.dni}</span>
                        <span>📱 ${p.telefono || 'Sin teléfono'}</span>
                        <span>📋 ${p.diagnostico || 'Sin diagnóstico'}</span>
                    </div>
                </div>
            </div>
            <button class="btn-delete" onclick="borrarPaciente(${p.id}, '${p.nombre}')" title="Eliminar Paciente">🗑️</button>
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

// NOTIFICACIÓN FLOTANTE (TOAST)
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

// Carga inicial
document.addEventListener('DOMContentLoaded', cargarTodosLosPacientes);
