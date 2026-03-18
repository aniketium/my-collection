// =============================================
// Supabase Configuration
// Replace these with your Supabase project credentials
// Found at: https://supabase.com/dashboard → Settings → API
// =============================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL';       // e.g. https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // starts with eyJ...

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
