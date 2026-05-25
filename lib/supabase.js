import { createClient } from '@supabase/supabase-js';

// Aquí van tus credenciales de Supabase
const supabaseUrl = 'https://iazrjeyodgjhzemosrkx.supabase.co';  // Cambia esto n tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenJqZXlvZGdqaHplbW9zcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDc2NjcsImV4cCI6MjA5NDA4MzY2N30.MBW8blilquo01tPYBK4bvCRLpoNOYOckvyfT3BBUvYs';  // Cambia esto con tu clave pública (anon)

export const supabase = createClient(supabaseUrl, supabaseKey);