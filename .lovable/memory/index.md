# Project Memory

## Core
NEVER enable Lovable Cloud. Backend is the user's own Supabase project (zayzrtcsgkricsxrbxwr). Config in src/integrations/supabase/config.ts.
NEVER migrate AI calls to Lovable AI Gateway / LOVABLE_API_KEY. AI uses user's own GEMINI_API_KEY directly against generativelanguage.googleapis.com.
Agent role is management only (migrations, RLS, server functions) via SB_MANAGEMENT_ACCESS_TOKEN — no Lovable-managed infra.
