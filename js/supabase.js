// js/supabase.js
const SUPABASE_URL = "https://qdoghzqzanyvgyapdrpr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_H1EOjnp5yx3Vs64lxsAuWw_s2TILWMt";

// Cria o cliente global do Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);