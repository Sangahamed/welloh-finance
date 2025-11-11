import { createClient } from '@supabase/supabase-js';

// Remplacement des variables d'environnement par les clés fournies pour corriger le problème de connexion.
const supabaseUrl = "https://cfnihxftwckbwsccnpni.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbmloeGZ0d2NrYndzY2NucG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTQwMTgsImV4cCI6MjA3Nzk5MDAxOH0.ZOaqp843ESxM560ZJGmcrc_DZcWJjGvxuLQwdMKJ54k";

function initializeSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        // Cette vérification ne devrait plus échouer, mais reste une sécurité.
        console.error("CRITICAL: Les clés Supabase ne sont pas configurées. L'authentification et la persistance des données seront désactivées.");
        return null;
    }
    return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = initializeSupabase();
