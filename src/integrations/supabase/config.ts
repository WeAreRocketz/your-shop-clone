// ============================================================================
// SUPABASE CONFIG — Conexão ao seu próprio projeto Supabase (NÃO Lovable Cloud)
// ============================================================================
//
// URL e PUBLISHABLE_KEY (anon key) são PÚBLICAS — seguras de ficar no bundle
// do client. A proteção real vem das policies RLS no seu Supabase.
//
// SUBSTITUA os valores abaixo pelos do seu projeto Supabase:
//   1. Acesse https://supabase.com/dashboard/project/_/settings/api
//   2. Copie "Project URL" → SUPABASE_URL
//   3. Copie "anon / public" key → SUPABASE_PUBLISHABLE_KEY
//
// A SERVICE_ROLE_KEY (privada, bypassa RLS) é lida de
// process.env.APP_SUPABASE_SERVICE_ROLE_KEY no servidor.
// ============================================================================

export const SUPABASE_URL = 'https://zayzrtcsgkricsxrbxwr.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpheXpydGNzZ2tyaWNzeHJieHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDk2OTcsImV4cCI6MjA5NzcyNTY5N30.ZPmeSsYYXlWMEnuqOYuQMLULu3P_E5UQKWrBVgYmiSk';

export function assertSupabaseConfig() {
  if (
    SUPABASE_URL.startsWith('__SET_') ||
    SUPABASE_PUBLISHABLE_KEY.startsWith('__SET_')
  ) {
    throw new Error(
      'Supabase config not set. Edit src/integrations/supabase/config.ts with your project URL and publishable (anon) key.',
    );
  }
}
