import { supabase } from './conexion.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar datos iniciales en los selects
    cargarDatosSelects();
    cargarSelectHistorialPacientes();

    // 2. Manejar alta de pacientes
    const formPaciente = document.getElementById('form-paciente');
    if (formPaciente) {
        formPaciente.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre').value;
            const dni = document.getElementById('dni').value;
            const email = document.getElementById('email').value;
            const telefono = document.getElementById('telefono').value;

            const { error } = await supabase
                .from('pacientes')
                .insert([{ nombre, dni, email, telefono }]);

            if (error) {
                alert('Error al guardar paciente: ' + error.message);
            } else {
                alert('¡Paciente guardado con éxito!');
                formPaciente.reset();
                cargarDatosSelects();
                cargarSelectHistorialPacientes();
            }
        });
    }

    // 3. Manejar asignación de turnos
    const formTurno = document.getElementById('form-turno');
    if (formTurno) {
        formTurno.addEventListener('submit', async (e) => {
            e.preventDefault();
            const paciente_id = document.getElementById('select-paciente').value;
            const especialista_id = document.getElementById('select-especialista').value;
            const fecha = document.getElementById('fecha-turno').value;

            const { error } = await supabase
                .from('turnos')
                .insert([{ paciente_id, especialista_id, fecha, estado: 'Confirmado' }]);

            if (error) {
                alert('Error al asignar turno: ' + error.message);
            } else {
                alert('¡Turno asignado correctamente!');
                formTurno.reset();
            }
        });
    }

    // 4. Manejar alta de historia clínica
    const formHistorial = document.getElementById('form-historial');
    if (formHistorial) {
        formHistorial.addEventListener('submit', async (e) => {
            e.preventDefault();
            const paciente_id = document.getElementById('historial-select-paciente').value;
            const medico_responsable = document.getElementById('medico-responsable').value;
            const diagnostico = document.getElementById('diagnostico').value;
            const tratamiento = document.getElementById('tratamiento').value;

            const { error } = await supabase
                .from('historias_clinicas')
                .insert([{ paciente_id, medico_responsable, diagnostico, tratamiento }]);

            if (error) {
                alert('Error al guardar la historia clínica: ' + error.message);
            } else {
                alert('¡Historia clínica actualizada con éxito!');
                formHistorial.reset();
                consultarHistorial(paciente_id);
            }
        });
    }

    // 5. Escuchar cambios en el selector de pacientes del historial
    const selectHistorialPaciente = document.getElementById('historial-select-paciente');
    if (selectHistorialPaciente) {
        selectHistorialPaciente.addEventListener('change', (e) => {
            const pacienteId = e.target.value;
            if (pacienteId) {
                consultarHistorial(pacienteId);
            } else {
                document.getElementById('resultado-historial').innerHTML = 'Seleccione un paciente para ver su historial.';
            }
        });
    }
});

// --- Funciones auxiliares ---

async function cargarDatosSelects() {
    const selectPaciente = document.getElementById('select-paciente');
    const selectEspecialista = document.getElementById('select-especialista');

    if (selectPaciente) {
        const { data: pacientes } = await supabase.from('pacientes').select('*');
        selectPaciente.innerHTML = '<option value="">Seleccione Paciente</option>';
        pacientes?.forEach(p => {
            selectPaciente.innerHTML += `<option value="${p.id}">${p.nombre} (DNI: ${p.dni})</option>`;
        });
    }

    if (selectEspecialista) {
        const { data: especialistas } = await supabase.from('especialistas').select('*');
        selectEspecialista.innerHTML = '<option value="">Seleccione Especialista</option>';
        especialistas?.forEach(e => {
            selectEspecialista.innerHTML += `<option value="${e.id}">${e.nombre} - ${e.especialidad}</option>`;
        });
    }
}

async function cargarSelectHistorialPacientes() {
    const select = document.getElementById('historial-select-paciente');
    if (select) {
        const { data: pacientes } = await supabase.from('pacientes').select('*');
        select.innerHTML = '<option value="">Seleccione Paciente</option>';
        pacientes?.forEach(p => {
            select.innerHTML += `<option value="${p.id}">${p.nombre} (DNI: ${p.dni})</option>`;
        });
    }
}

async function consultarHistorial(pacienteId) {
    const contenedor = document.getElementById('resultado-historial');
    contenedor.innerHTML = '<p>Cargando historial...</p>';

    const { data, error } = await supabase
        .from('historias_clinicas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('fecha', { ascending: false });

    if (error) {
        contenedor.innerHTML = `<p style="color:red;">Error al cargar historial: ${error.message}</p>`;
        return;
    }

    if (data.length === 0) {
        contenedor.innerHTML = '<p>Este paciente no registra antecedentes en su historia clínica.</p>';
        return;
    }

    let html = '';
    data.forEach(h => {
        html += `
            <div class="item-historial">
                <p><strong>Fecha:</strong> ${new Date(h.fecha).toLocaleString()}</p>
                <p><strong>Médico:</strong> ${h.medico_responsable}</p>
                <p><strong>Diagnóstico:</strong> ${h.diagnostico}</p>
                <p><strong>Tratamiento:</strong> ${h.tratamiento}</p>
            </div>
        `;
    });

    contenedor.innerHTML = html;
}

// Función global para cambiar pestañas de la interfaz
window.mostrarSeccion = function(seccion) {
    document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none');
    document.getElementById(`seccion-${seccion}`).style.display = 'block';
}
