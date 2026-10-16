// conexion.js
// Importa el cliente de Supabase desde CDN (asegúrate de incluir el script en tu HTML)
const SUPABASE_URL = 'vipxyjfjdnkfhxcukfut';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcHh5amZqZG5rZmh4Y3VrZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5Njg1NjcsImV4cCI6MjEwNjU0NDU2N30.dFqoF6K16r24wBvlzhJ7LK4AdiKnTdKzQ9lg2GErE9I';

// Inicializar el cliente de Supabase
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
