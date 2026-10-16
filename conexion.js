// conexion.js
// Importa el cliente de Supabase desde CDN (asegúrate de incluir el script en tu HTML)
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUÍ';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUÍ';

// Inicializar el cliente de Supabase
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);