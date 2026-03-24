import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gjusrbtrohibyxnglwai.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdXNyYnRyb2hpYnl4bmdsd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzEwODgsImV4cCI6MjA4ODk0NzA4OH0.77QhEBtHaVLGcDGNPD98yRm9mwGOcnDOVScga-hc_Lk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
