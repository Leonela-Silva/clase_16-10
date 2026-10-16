// Configuración de conexión con Supabase
const SUPABASE_URL = 'https://vipxyjfjdnkfhxcukfut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BwdIhPDdZzhfDBGtDvoxuA__SLZjTTx';

// Inicializar Supabase cliente
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referencias a los elementos de la pantalla
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

// Eventos al presionar botones y escribir
btnGuardar.addEventListener('click', guardarPaciente);
btnCargar.addEventListener('click', cargarTodosLosPacientes);
btnBuscar.addEventListener('click', buscarPaciente);
buscarInput.addEventListener('input', buscarPaciente);

// 1. GUARDAR PACIENTE EN SUPABASE
async function guardarPaciente() {
    const nombre = nombreInput.value.trim();
    const dni = dniInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const diagnostico = diagnosticoInput.value.trim();

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

// 2. CONSULTAR Y MOSTRAR TODOS LOS PACIENTES
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
    const busqueda = buscarInput.value.trim();

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

// RENDERIZAR EN EL HTML
function renderizarLista(pacientes) {
    listaPacientes.innerHTML = '';

    if (!pacientes || pacientes.length === 0) {
        listaPacientes.innerHTML = '<li>No se encontraron registros.</li>';
        return;
    }

    pacientes.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="paciente-item">
                <div class="paciente-info">
                    <strong>👤 ${p.nombre}</strong> — (DNI: ${p.dni})
                    <small>📞 Tel: ${p.telefono || 'Sin registrar'} | 📝 Diag: ${p.diagnostico || 'Sin registrar'}</small>
                </div>
                <button class="btn-delete" onclick="borrarPaciente(${p.id})">🗑️</button>
            </div>
        `;
        listaPacientes.appendChild(li);
    });
}

function limpiarFormulario() {
    nombreInput.value = '';
    dniInput.value = '';
    telefonoInput.value = '';
    diagnosticoInput.value = '';
}

function mostrarEstado(mensaje, color) {
    statusMsg.innerText = mensaje;
    statusMsg.style.color = color;
}

// Cargar automáticamente al abrir la página
document.addEventListener('DOMContentLoaded', cargarTodosLosPacientes);
