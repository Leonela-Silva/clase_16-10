// app.js - Gestión síncrona con la Base de Datos de Supabase
document.addEventListener('DOMContentLoaded', () => {
    // Al iniciar, leemos silenciosamente los datos de la BD
    cargarPacientesBD();

    const btnGuardar = document.getElementById('btnGuardar');
    const buscarInput = document.getElementById('buscarInput');

    if (btnGuardar) btnGuardar.addEventListener('click', guardarPacienteBD);
    if (buscarInput) buscarInput.addEventListener('input', buscarPacienteBD);
});

// Función para notificaciones oportunas
function mostrarEstado(mensaje, esError = false) {
    const statusMsg = document.getElementById('statusMsg');
    if (statusMsg) {
        statusMsg.innerText = mensaje;
        statusMsg.style.color = esError ? '#ef4444' : '#10b981';
    }
}

// NAVEGACIÓN ENTRE MÓDULOS
function cambiarModulo(modulo) {
    const modulos = ['Paciente', 'Turno', 'Historia', 'Especialista'];
    
    modulos.forEach(m => {
        const form = document.getElementById(`secForm${m}`);
        const lista = document.getElementById(`secLista${m}s`);
        const tab = document.getElementById(`tab${m}s`);

        if (form) form.style.display = 'none';
        if (lista) lista.style.display = 'none';
        if (tab) tab.className = 'btn btn-secondary';
    });

    if (modulo === 'pacientes') {
        document.getElementById('secFormPaciente').style.display = 'block';
        document.getElementById('secListaPacientes').style.display = 'block';
        document.getElementById('tabPacientes').className = 'btn btn-primary';
        cargarPacientesBD();
    } else if (modulo === 'turnos') {
        document.getElementById('secFormTurno').style.display = 'block';
        document.getElementById('secListaTurnos').style.display = 'block';
        document.getElementById('tabTurnos').className = 'btn btn-primary';
        poblarSelectsPacientesBD();
        cargarTurnosBD();
    } else if (modulo === 'historias') {
        document.getElementById('secFormHistoria').style.display = 'block';
        document.getElementById('secListaHistorias').style.display = 'block';
        document.getElementById('tabHistorias').className = 'btn btn-primary';
        poblarSelectsPacientesBD();
        cargarHistoriasBD();
    } else if (modulo === 'especialistas') {
        document.getElementById('secFormEspecialista').style.display = 'block';
        document.getElementById('secListaEspecialistas').style.display = 'block';
        document.getElementById('tabEspecialistas').className = 'btn btn-primary';
        cargarEspecialistasBD();
    }
}

// ==================== 1. MÓDULO PACIENTES ====================

async function cargarPacientesBD() {
    const lista = document.getElementById('listaPacientes');
    if (!lista) return;

    try {
        // Pedido SELECT a Supabase
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            mostrarEstado('❌ Error BD: ' + error.message, true);
            lista.innerHTML = `<div class="empty-state">Error al consultar la base de datos: ${error.message}</div>`;
            return;
        }

        if (!data || data.length === 0) {
            lista.innerHTML = '<div class="empty-state">La base de datos no contiene pacientes guardados.</div>';
            return;
        }

        renderizarPacientes(data);

    } catch (err) {
        mostrarEstado('❌ Error de conexión con BD', true);
    }
}

async function guardarPacienteBD() {
    const nombre = document.getElementById('nombre') ? document.getElementById('nombre').value.trim() : '';
    const dni = document.getElementById('dni') ? document.getElementById('dni').value.trim() : '';
    const telefono = document.getElementById('telefono') ? document.getElementById('telefono').value.trim() : '';
    const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';

    if (!nombre || !dni) {
        mostrarEstado('⚠️ Por favor completa Nombre y DNI', true);
        return;
    }

    mostrarEstado('Guardando en BD...');

    // Envío INSERT a Supabase
    const { error } = await supabase
        .from('pacientes')
        .insert([{ nombre, dni, telefono, email }]);

    if (error) {
        mostrarEstado('❌ Error al insertar en BD: ' + error.message, true);
    } else {
        mostrarEstado('✅ ¡Paciente guardado exitosamente en la BD!');
        limpiarInputs(['nombre', 'dni', 'telefono', 'email']);
        cargarPacientesBD();
        setTimeout(() => mostrarEstado(''), 3000);
    }
}

async function buscarPacienteBD() {
    const busqueda = document.getElementById('buscarInput').value.trim();

    if (busqueda === '') {
        cargarPacientesBD();
        return;
    }

    // Pedido con filtro ilike a Supabase
    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .or(`nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`);

    const lista = document.getElementById('listaPacientes');
    if (!error && data) {
        if (data.length === 0) {
            lista.innerHTML = '<div class="empty-state">No hay registros coincidentes en la BD.</div>';
        } else {
            renderizarPacientes(data);
        }
    }
}

function renderizarPacientes(pacientes) {
    const lista = document.getElementById('listaPacientes');
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
                <button class="btn-delete" onclick="borrarPacienteBD(${p.id}, '${p.nombre}')" title="Eliminar de BD">🗑️</button>
            </div>

            <div id="historial-${p.id}" style="display: none; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 0.85rem; color: #475569;">
                <p><strong>📧 Observaciones / Antecedentes:</strong> ${p.email || 'Sin observaciones registradas.'}</p>
                <p style="color: #94a3b8; font-size: 0.75rem;">ID único en BD: #${p.id}</p>
            </div>
        `;
        lista.appendChild(card);
    });
}

async function borrarPacienteBD(id, nombre) {
    if (!confirm(`¿Eliminar a ${nombre} de la base de datos?`)) return;

    const { error } = await supabase.from('pacientes').delete().eq('id', id);
    if (error) {
        alert('Error al borrar de la BD: ' + error.message);
    } else {
        cargarPacientesBD();
    }
}

// ==================== 2. MÓDULO TURNOS ====================

async function cargarTurnosBD() {
    const lista = document.getElementById('listaTurnos');
    const { data, error } = await supabase.from('turnos').select('*').order('id', { ascending: false });

    if (error) {
        lista.innerHTML = `<div class="empty-state">Error al leer la tabla turnos: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = '<div class="empty-state">No hay turnos registrados en la BD.</div>';
        return;
    }

    lista.innerHTML = '';
    data.forEach(t => {
        let fecha = t.fecha ? new Date(t.fecha).toLocaleString() : 'Sin fecha';
        lista.innerHTML += `
            <div class="patient-card">
                <div class="patient-main">
                    <div class="patient-avatar" style="background:#06b6d4;">📅</div>
                    <div class="patient-info">
                        <h4>${t.paciente || 'Paciente indetectado'}</h4>
                        <div class="patient-meta"><span class="badge">📆 ${fecha}</span> <span>🩺 ${t.motivo || 'Consulta'}</span></div>
                    </div>
                </div>
            </div>`;
    });
}

async function guardarTurnoBD() {
    const paciente = document.getElementById('selectPacienteTurno').value;
    const fecha = document.getElementById('fechaTurno').value;
    const motivo = document.getElementById('motivoTurno').value;

    if (!paciente || !fecha) {
        mostrarEstado('⚠️ Selecciona un paciente y fecha/hora', true);
        return;
    }

    const { error } = await supabase.from('turnos').insert([{ paciente, fecha, motivo }]);
    if (error) {
        mostrarEstado('❌ Error al agendar en BD: ' + error.message, true);
    } else {
        mostrarEstado('✅ ¡Turno guardado en la BD!');
        limpiarInputs(['fechaTurno', 'motivoTurno']);
        cargarTurnosBD();
        setTimeout(() => mostrarEstado(''), 3000);
    }
}

// ==================== 3. MÓDULO HISTORIAS CLÍNICAS ====================

async function cargarHistoriasBD() {
    const lista = document.getElementById('listaHistorias');
    const { data, error } = await supabase.from('historias_clinicas').select('*').order('id', { ascending: false });

    if (error) {
        lista.innerHTML = `<div class="empty-state">Error al leer historias clínicas: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = '<div class="empty-state">No hay historias clínicas guardadas en la BD.</div>';
        return;
    }

    lista.innerHTML = '';
    data.forEach(h => {
        lista.innerHTML += `
            <div class="patient-card">
                <div class="patient-main">
                    <div class="patient-avatar" style="background:#8b5cf6;">📋</div>
                    <div class="patient-info">
                        <h4>${h.paciente || 'Paciente'}</h4>
                        <p style="margin-top:5px; font-size:0.85rem;">${h.diagnostico || h.detalle || 'Sin detalle de diagnóstico'}</p>
                    </div>
                </div>
            </div>`;
    });
}

async function guardarHistoriaBD() {
    const paciente = document.getElementById('selectPacienteHistoria').value;
    const diagnostico = document.getElementById('detalleHistoria').value.trim();

    if (!paciente || !diagnostico) {
        mostrarEstado('⚠️ Selecciona un paciente e ingresa el diagnóstico', true);
        return;
    }

    const { error } = await supabase.from('historias_clinicas').insert([{ paciente, diagnostico }]);
    if (error) {
        mostrarEstado('❌ Error al guardar en BD: ' + error.message, true);
    } else {
        mostrarEstado('✅ ¡Historia clínica registrada en la BD!');
        limpiarInputs(['detalleHistoria']);
        cargarHistoriasBD();
        setTimeout(() => mostrarEstado(''), 3000);
    }
}

// ==================== 4. MÓDULO ESPECIALISTAS ====================

async function cargarEspecialistasBD() {
    const lista = document.getElementById('listaEspecialistas');
    const { data, error } = await supabase.from('especialistas').select('*').order('id', { ascending: false });

    if (error) {
        lista.innerHTML = `<div class="empty-state">Error al consultar especialistas: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = '<div class="empty-state">No hay especialistas registrados en la BD.</div>';
        return;
    }

    lista.innerHTML = '';
    data.forEach(e => {
        lista.innerHTML += `
            <div class="patient-card">
                <div class="patient-main">
                    <div class="patient-avatar" style="background:#10b981;">👨‍⚕️</div>
                    <div class="patient-info">
                        <h4>${e.nombre || e.nombreEspecialista || 'Médico'}</h4>
                        <div class="patient-meta"><span class="badge">Especialidad: ${e.especialidad || 'General'}</span></div>
                    </div>
                </div>
            </div>`;
    });
}

async function guardarEspecialistaBD() {
    const nombre = document.getElementById('nombreEspecialista').value.trim();
    const especialidad = document.getElementById('especialidad').value.trim();

    if (!nombre) {
        mostrarEstado('⚠️ Ingresa el nombre del especialista', true);
        return;
    }

    const { error } = await supabase.from('especialistas').insert([{ nombre, especialidad }]);
    if (error) {
        mostrarEstado('❌ Error al guardar en BD: ' + error.message, true);
    } else {
        mostrarEstado('✅ ¡Especialista registrado en la BD!');
        limpiarInputs(['nombreEspecialista', 'especialidad']);
        cargarEspecialistasBD();
        setTimeout(() => mostrarEstado(''), 3000);
    }
}

// AUXILIARES
async function poblarSelectsPacientesBD() {
    const { data } = await supabase.from('pacientes').select('nombre, dni').order('nombre', { ascending: true });
    const s1 = document.getElementById('selectPacienteTurno');
    const s2 = document.getElementById('selectPacienteHistoria');

    if (data) {
        let opts = '<option value="">-- Seleccionar Paciente traído de la BD --</option>';
        data.forEach(p => { opts += `<option value="${p.nombre}">${p.nombre} (DNI: ${p.dni})</option>`; });
        if (s1) s1.innerHTML = opts;
        if (s2) s2.innerHTML = opts;
    }
}

function toggleHistorial(id) {
    const el = document.getElementById(`historial-${id}`);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function limpiarInputs(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    }
    
