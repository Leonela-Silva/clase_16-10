import { supabase } from './conexion.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnReporte = document.getElementById('btn-generar-reporte');
    if (btnReporte) {
        btnReporte.addEventListener('click', generarReporteTurnos);
    }
});

async function generarReporteTurnos() {
    const contenedor = document.getElementById('resultado-reportes');
    contenedor.innerHTML = '<p>Generando reporte...</p>';

    // Consulta con relaciones (Join simulado en Supabase)
    const { data, error } = await supabase
        .from('turnos')
        .select(`
            id,
            fecha,
            estado,
            pacientes (nombre, dni),
            especialistas (nombre, especialidad)
        `);

    if (error) {
        contenedor.innerHTML = `<p style="color:red;">Error al generar reporte: ${error.message}</p>`;
        return;
    }

    if (data.length === 0) {
        contenedor.innerHTML = '<p>No hay turnos registrados en el sistema.</p>';
        return;
    }

    let html = '<ul>';
    data.forEach(t => {
        html += `<li><strong>Turno #${t.id}</strong>: ${t.pacientes?.nombre} atendido por ${t.especialistas?.nombre} (${t.especialistas?.especialidad}) el ${new Date(t.fecha).toLocaleString()} - Estado: <em>${t.estado}</em></li>`;
    });
    html += '</ul>';

    contenedor.innerHTML = html;
}