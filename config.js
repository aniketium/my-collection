// =============================================
// Supabase Configuration
// Replace these with your Supabase project credentials
// Found at: https://supabase.com/dashboard → Settings → API
// =============================================

const SUPABASE_URL = 'https://falsdzkpltfyijlfbeig.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MIV9jfsMNj9WK_rxCpHMAQ_5KkFYLJe';

// Initialize Supabase client (gracefully handle missing config)
// Use window.sb to avoid conflict with the SDK's window.supabase namespace
window.sb = null;
try {
  if (SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && window.supabase) {
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase not configured:', e.message);
}
