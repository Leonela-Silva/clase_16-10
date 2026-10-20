// Configuración de conexión con Supabase
const SUPABASE_URL = 'https://vipxyjfjdnkfhxcukfut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BwdIhPDdZzhfDBGtDvoxuA__SLZjTTx';

// Crear la conexión una sola vez
window.supabaseClient = window.supabaseClient ||
    window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
