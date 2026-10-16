// Configuración directa de Supabase
const SUPABASE_URL = 'https://vipxyjfjdnkfhxcukfut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BwdIhPDdZzhfDBGtDvoxuA__SLZjTTx';

// Inicializar el cliente desde el CDN global
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Captura de elementos de la pantalla
const nombreInput = document.getElementById('nombreInput');
const emailInput = document.getElementById('emailInput');
const btnGuardar = document.getElementById('btnGuardar');
const btnCargar = document.getElementById('btnCargar');
const listaDatos = document.getElementById('listaDatos');
const statusMsg = document.getElementById('statusMsg');

// Guardar datos ingresados por el usuario
btnGuardar.addEventListener('click', async () => {
    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();

    if (!nombre || !email) {
        statusMsg.innerText = '⚠️ Por favor, completa ambos campos.';
        statusMsg.style.color = '#ef4444';
        return;
    }

    statusMsg.innerText = 'Guardando en Supabase...';
    statusMsg.style.color = '#f59e0b';

    const { data, error } = await supabase
        .from('contactos')
        .insert([{ nombre: nombre, email: email }]);

    if (error) {
        console.error(error);
        statusMsg.innerText = '❌ Error al guardar: ' + error.message;
        statusMsg.style.color = '#ef4444';
    } else {
        statusMsg.innerText = '✅ ¡Registro guardado con éxito!';
        statusMsg.style.color = '#10b981';
        nombreInput.value = '';
        emailInput.value = '';
        cargarDatos();
    }
});

// Consultar/Cargar datos existentes
btnCargar.addEventListener('click', cargarDatos);

async function cargarDatos() {
    statusMsg.innerText = 'Consultando base de datos...';
    statusMsg.style.color = '#f59e0b';

    const { data, error } = await supabase
        .from('contactos')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error(error);
        statusMsg.innerText = '❌ Error al consultar: ' + error.message;
        statusMsg.style.color = '#ef4444';
        return;
    }

    listaDatos.innerHTML = '';
    
    if (!data || data.length === 0) {
        listaDatos.innerHTML = '<li>No hay registros guardados aún.</li>';
    } else {
        data.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.nombre}</strong> — ${item.email}`;
            listaDatos.appendChild(li);
        });
    }

    statusMsg.innerText = `✅ Se encontraron ${data.length} registros.`;
    statusMsg.style.color = '#10b981';
}

// Cargar automáticamente los datos al abrir la página
document.addEventListener('DOMContentLoaded', cargarDatos);
              
