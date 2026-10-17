// Event Listeners al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarTodosLosPacientes();
    cargarTurnos();
    poblarSelectPacientes();

    const btnGuardar = document.getElementById('btnGuardar');
    const btnCargar = document.getElementById('btnCargar');
    const btnGuardarTurno = document.getElementById('btnGuardarTurno');
    const buscarInput = document.getElementById('buscarInput');

    if (btnGuardar) btnGuardar.addEventListener('click', guardarPaciente);
    if (btnCargar) btnCargar.addEventListener('click', cargarTodosLosPacientes);
    if (btnGuardarTurno) btnGuardarTurno.addEventListener('click', guardarTurno);
    if (buscarInput) buscarInput.addEventListener('input', buscarPaciente);
});

// NAVEGACIÓN ENTRE MÓDULOS (Pacientes / Turnos)
function cambiarModulo(modulo) {
    const secFormPaciente = document.getElementById('secFormPaciente');
    const secFormTurno = document.getElementById('secFormTurno');
    const secListaPacientes = document.getElementById('secListaPacientes');
    const secListaTurnos = document.getElementById('secListaTurnos');

    const tabPacientes = document.getElementById('tabPacientes');
    const tabTurnos = document.getElementById('tabTurnos');

    if (modulo === 'pacientes') {
        secFormPaciente.style.display = 'block';
        secFormTurno.style.display = 'none';
        secListaPacientes.style.display = 'block';
        secListaTurnos.style.display = 'none';

        tabPacientes.className = 'btn btn-primary';
        tabTurnos.className = 'btn btn-secondary';
    } else {
        secFormPaciente.style.display = 'none';
        secFormTurno.style.display = 'block';
        secListaPacientes.style.display = 'none';
        secListaTurnos.style.display = 'block';

        tabPacientes.className = 'btn btn-secondary';
        tabTurnos.className = 'btn btn-primary';

        poblarSelectPacientes();
        cargarTurnos();
    }
}

// ------------------- MÓDULO PACIENTES -------------------

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

    renderizarListaPacientes(data);
}

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

    const { error } = await supabase
        .from('pacientes')
        .insert([{ nombre, dni, telefono, email }]);

    if (error) {
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
        poblarSelectPacientes();
    }
}

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
        renderizarListaPacientes(data);
    }
}

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

function toggleHistorial(id) {
    const detalle = document.getElementById(`historial-${id}`);
    if (detalle) {
        detalle.style.display = detalle.style.display === 'none' ? 'block' : 'none';
    }
}

function renderizarListaPacientes(pacientes) {
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
                    </div>
                </div>
            </div>
            
            <div class="patient-actions" style="margin-top: 10px; display: flex; gap: 10px;">
                <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.85rem;" onclick="toggleHistorial(${p.id})">📋 Ver Ficha / Historial</button>
                <button class="btn-delete" onclick="borrarPaciente(${p.id}, '${p.nombre}')" title="Eliminar paciente">🗑️</button>
            </div>

            <div id="historial-${p.id}" class="historial-detalle" style="display: none; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                <p><strong>📧 Observaciones / Diagnóstico:</strong> ${p.email || 'Sin observaciones registradas.'}</p>
                <p style="font-size: 0.85rem; color: #64748b;"><strong>ID de Registro:</strong> #${p.id}</p>
            </div>
        `;
        lista.appendChild(card);
    });
}

// ------------------- MÓDULO TURNOS -------------------

async function poblarSelectPacientes() {
    const select = document.getElementById('pacienteTurnoSelect');
    if (!select) return;

    const { data } = await supabase
        .from('pacientes')
        .select('id, nombre, dni')
        .order('nombre', { ascending: true });

    select.innerHTML = '<option value="">-- Seleccionar un paciente --</option>';

    if (data) {
        data.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.nombre;
            opt.innerText = `${p.nombre} (DNI: ${p.dni})`;
            select.appendChild(opt);
        });
    }
}

async function guardarTurno() {
    const paciente = document.getElementById('pacienteTurnoSelect').value;
    const fecha = document.getElementById('fechaTurno').value;
    const motivo = document.getElementById('motivoTurno').value.trim();
    const statusMsg = document.getElementById('statusMsg');

    if (!paciente || !fecha) {
        if (statusMsg) {
            statusMsg.innerText = '⚠️ Selecciona Paciente y Fecha/Hora';
            statusMsg.style.color = '#ef4444';
        }
        return;
    }

    const { error } = await supabase
        .from('turnos')
        .insert([{ 
            paciente: paciente, 
            fecha: fecha, 
            motivo: motivo || 'Consulta general' 
        }]);

    if (error) {
        console.error(error);
        if (statusMsg) {
            statusMsg.innerText = '❌ Error al agendar turno: ' + error.message;
            statusMsg.style.color = '#ef4444';
        }
    } else {
        if (statusMsg) {
            statusMsg.innerText = '✅ ¡Turno agendado correctamente!';
            statusMsg.style.color = '#10b981';
        }
        document.getElementById('fechaTurno').value = '';
        document.getElementById('motivoTurno').value = '';
        cargarTurnos();
    }
}

async function cargarTurnos() {
    const lista = document.getElementById('listaTurnos');
    if (!lista) return;

    const { data, error } = await supabase
        .from('turnos')
        .select('*')
        .order('id', { ascending: false });

    if (error || !data) {
        lista.innerHTML = '<div class="empty-state">No se pudieron cargar los turnos.</div>';
        return;
    }

    if (data.length === 0) {
        lista.innerHTML = '<div class="empty-state">No hay turnos agendados.</div>';
        return;
    }

    lista.innerHTML = '';
    data.forEach(t => {
        const card = document.createElement('div');
        card.className = 'patient-card';
        
        let fechaFormateada = t.fecha ? new Date(t.fecha).toLocaleString() : 'Fecha no especificada';

        card.innerHTML = `
            <div class="patient-main">
                <div class="patient-avatar" style="background: #06b6d4;">📅</div>
                <div class="patient-info">
                    <h4>${t.paciente || 'Paciente sin nombre'}</h4>
                    <div class="patient-meta">
                        <span class="badge">📆 ${fechaFormateada}</span>
                        <span>🩺 ${t.motivo || 'Consulta'}</span>
                    </div>
                </div>
            </div>
            <button class="btn-delete" onclick="borrarTurno(${t.id})" title="Cancelar turno">🗑️</button>
        `;
        lista.appendChild(card);
    });
}

async function borrarTurno(id) {
    if (!confirm('¿Deseas cancelar este turno?')) return;

    const { error } = await supabase
        .from('turnos')
        .delete()
        .eq('id', id);

    if (!error) {
        cargarTurnos();
    }
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
