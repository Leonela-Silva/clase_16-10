// Configuración global de conexión con Supabase
const SUPABASE_URL = 'https://vipxyjfjdnkfhxcukfut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BwdIhPDdZzhfDBGtDvoxuA__SLZjTTx';

// Instancia global de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
