// Credenciales de Supabase
const SUPABASE_URL = 'https://vipxyjfjdnkfhxcukfut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BwdIhPDdZzhfDBGtDvoxuA__SLZjTTx';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Captura de elementos DOM
const nombreInput = document.getElementById('nombre');
const dniInput = document.getElementById('dni');
const telefonoInput = document.getElementById('telefono');
const diagnosticoInput = document.getElementById('diagnostico');

const btnGuardar = document.getElementById('btnGuardar');
const btnCargar = document.getElementById('btnCargar');
const listaPacientes = document.getElementById('listaPacientes');
const statusMsg = document.getElementById('statusMsg');

// Guardar Paciente al hacer clic en el botón
btnGuardar.addEventListener('click', async () => {
    const nombre = nombreInput.value.trim();
    const dni = dniInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const diagnostico = diagnosticoInput.value.trim();

    if (!nombre || !dni) {
        mostrarEstado('⚠️ Completa al menos el Nombre y el DNI.', '#ef4444');
        return;
    }

    mostrarEstado('Guardando paciente en Supabase...', '#f59e0b');

    const { data, error } = await supabase
        .from('pacientes')
        .insert([{ 
            nombre: nombre, 
            dni: dni, 
            telefono: telefono, 
            diagnostico: diagnostico 
        }]);

    if (error) {
        console.error('Error al insertar:', error);
        mostrarEstado('❌ Error al guardar: ' + error.message, '#ef4444');
    } else {
        mostrarEstado('✅ Paciente registrado con éxito.', '#10b981');
        limpiarFormulario();
        cargarPacientes();
    }
});

// Cargar / Consultar Lista de Pacientes
btnCargar.addEventListener('click', cargarPacientes);

async function cargarPacientes() {
    mostrarEstado('Consultando base de datos...', '#f59e0b');

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error al consultar:', error);
        mostrarEstado('❌ Error al consultar datos: ' + error.message, '#ef4444');
        return;
    }

    listaPacientes.innerHTML = '';

    if (!data || data.length === 0) {
        listaPacientes.innerHTML = '<li>No hay pacientes registrados aún.</li>';
    } else {
        data.forEach(paciente => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="paciente-item">
                    <div>
                        <strong>${paciente.nombre}</strong> (DNI: ${paciente.dni})<br>
                        <small>📱 ${paciente.telefono || 'Sin tel'} | 📋 ${paciente.diagnostico || 'Sin diagnóstico'}</small>
                    </div>
                    <button class="btn-delete" onclick="borrarPaciente(${paciente.id})">🗑️</button>
                </div>
            `;
            listaPacientes.appendChild(li);
        });
    }

    mostrarEstado(`✅ Total pacientes: ${data.length}`, '#10b981');
}

// Función para eliminar paciente
window.borrarPaciente = async function(id) {
    if (!confirm('¿Deseas eliminar este registro?')) return;

    mostrarEstado('Eliminando paciente...', '#f59e0b');

    const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id);

    if (error) {
        mostrarEstado('❌ Error al borrar: ' + error.message, '#ef4444');
    } else {
        mostrarEstado('🗑️ Registro eliminado correctamente.', '#10b981');
        cargarPacientes();
    }
};

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

// Cargar automáticamente al entrar a la página
document.addEventListener('DOMContentLoaded', cargarPacientes);
