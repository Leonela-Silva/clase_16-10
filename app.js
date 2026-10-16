// Configuración de conexión con Supabase
const SUPABASE_URL = 'https://vipxyjfjdnkfhxcukfut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BwdIhPDdZzhfDBGtDvoxuA__SLZjTTx';

// Inicializar Supabase cliente
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Captura de inputs y botones de tu HTML
const nombreInput = document.getElementById('nombre');
const dniInput = document.getElementById('dni');
const telefonoInput = document.getElementById('telefono');
const diagnosticoInput = document.getElementById('diagnostico');
const buscarInput = document.getElementById('buscarInput');

const btnGuardar = document.getElementById('btnGuardar');
const btnCargar = document.getElementById('btnCargar');
const btnBuscar = document.getElementById('btnBuscar');
const listaPacientes = document.getElementById('listaPacientes');
const statusMsg = document.getElementById('statusMsg');

// Vincular eventos
if (btnGuardar) btnGuardar.addEventListener('click', guardarPaciente);
if (btnCargar) btnCargar.addEventListener('click', cargarTodosLosPacientes);
if (btnBuscar) btnBuscar.addEventListener('click', buscarPaciente);
if (buscarInput) buscarInput.addEventListener('input', buscarPaciente);

// 1. GUARDAR EN SUPABASE
async function guardarPaciente() {
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const dni = dniInput ? dniInput.value.trim() : '';
    const telefono = telefonoInput ? telefonoInput.value.trim() : '';
    const diagnostico = diagnosticoInput ? diagnosticoInput.value.trim() : '';

    if (!nombre || !dni) {
        mostrarEstado('⚠️ Completa al menos el Nombre y el DNI.', '#ef4444');
        return;
    }

    mostrarEstado('Guardando datos en Supabase...', '#f59e0b');

    const { data, error } = await supabase
        .from('pacientes')
        .insert([{ 
            nombre: nombre, 
            dni: dni, 
            telefono: telefono, 
            diagnostico: diagnostico 
        }]);

    if (error) {
        console.error('Error al guardar:', error);
        mostrarEstado('❌ Error al guardar: ' + error.message, '#ef4444');
    } else {
        mostrarEstado('✅ ¡Paciente registrado exitosamente!', '#10b981');
        limpiarFormulario();
        cargarTodosLosPacientes();
    }
}

// 2. CONSULTAR Y DEVOLVER TODOS LOS PACIENTES
async function cargarTodosLosPacientes() {
    mostrarEstado('Consultando base de datos...', '#f59e0b');

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error al consultar:', error);
        mostrarEstado('❌ Error al consultar: ' + error.message, '#ef4444');
        return;
    }

    renderizarLista(data);
    mostrarEstado(`✅ Registros devueltos: ${data.length}`, '#10b981');
}

// 3. BUSCAR PACIENTES POR DNI O NOMBRE
async function buscarPaciente() {
    const busqueda = buscarInput ? buscarInput.value.trim() : '';

    if (busqueda === '') {
        cargarTodosLosPacientes();
        return;
    }

    mostrarEstado('Buscando coincidencia...', '#f59e0b');

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .or(`nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error en búsqueda:', error);
        mostrarEstado('❌ Error en búsqueda: ' + error.message, '#ef4444');
        return;
    }

    renderizarLista(data);
    mostrarEstado(`🔍 Coincidencias encontradas: ${data.length}`, '#10b981');
}

// 4. BORRAR PACIENTE DE LA BASE DE DATOS
window.borrarPaciente = async function(id) {
    if (!confirm('¿Seguro que deseas eliminar este paciente de Supabase?')) return;

    mostrarEstado('Eliminando registro...', '#f59e0b');

    const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id);

    if (error) {
        mostrarEstado('❌ Error al borrar: ' + error.message, '#ef4444');
    } else {
        mostrarEstado('🗑️ Registro eliminado correctamente.', '#10b981');
        cargarTodosLosPacientes();
    }
};

function renderizarLista(pacientes) {
    if (!listaPacientes) return;
    listaPacientes.innerHTML = '';

    if (!pacientes || pacientes.length === 0) {
        listaPacientes.innerHTML = '<li>No se encontraron registros.</li>';
        return;
    }

    pacientes.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>👤 ${p.nombre}</strong> — (DNI: ${p.dni})<br>
                    <small style="color: #8b949e;">📞 Tel: ${p.telefono || 'Sin registrar'} | 📝 Diag: ${p.diagnostico || 'Sin registrar'}</small>
                </div>
                <button onclick="borrarPaciente(${p.id})" style="background:none; border:none; cursor:pointer; font-size:1.1rem;">🗑️</button>
            </div>
        `;
        listaPacientes.appendChild(li);
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

// Cargar automáticamente los datos guardados al abrir la página
document.addEventListener('DOMContentLoaded', cargarTodosLosPacientes);
