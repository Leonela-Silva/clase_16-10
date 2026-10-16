import { supabase } from './conexion.js';

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosSelects();
    
    // Manejar alta de pacientes
    const formPaciente = document.getElementById('form-paciente');
    if (formPaciente) {
        formPaciente.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre').value;
            const dni = document.getElementById('dni').value;
            const email = document.getElementById('email').value;
            const telefono = document.getElementById('telefono').value;

            const { data, error } = await supabase
                .from('pacientes')
                .insert([{ nombre, dni, email, telefono }]);

            if (error) {
                alert('Error al guardar paciente: ' + error.message);
            } else {
                alert('¡Paciente guardado con éxito!');
                formPaciente.reset();
                cargarDatosSelects();
            }
        });
    }

    // Manejar asignación de turnos
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
});

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

// Función global simple para cambiar pestañas
window.mostrarSeccion = function(seccion) {
    document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none');
    document.getElementById(`seccion-${seccion}`).style.display = 'block';
}