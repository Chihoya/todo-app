/**
 * Supabase Client Konfiguration
 * 
 * Optional: Für Multi-Device-Sync
 * - Development: .env Datei mit VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY
 * - Production: GitHub Secrets
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Nur in Development-Modus Info ausgeben
if (import.meta.env.DEV) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('💾 LocalStorage-Modus (Daten nur auf diesem Gerät)');
    console.log('ℹ️  Für Multi-Device-Sync: Siehe DOKUMENTATION.md');
  } else {
    console.log('☁️ Supabase-Modus (Multi-Device-Sync aktiv)');
  }
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
