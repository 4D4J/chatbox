import { createClient } from '@supabase/supabase-js'

// Idéalement, ces valeurs devraient être dans des variables d'environnement
const supabaseUrl = 'https://ufutfzyfotrgemmxvrwj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdXRmenlmb3RyZ2VtbXh2cndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODExNTcsImV4cCI6MjA2MTA1NzE1N30.v8JCfgw5uHJiGLziF-KB1xEW3fUrazdpcDWaVIpixoU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // la session sera persistée dans le localStorage
    autoRefreshToken: true, // rafraîchir le token automatiquement
    detectSessionInUrl: true, // détecter si une session est contenue dans l'URL
    flowType: 'pkce', // utiliser PKCE flow pour une meilleure sécurité contre les attaques CSRF
  },
  // Ajout de headers pour protéger contre le clickjacking
  global: {
    headers: {
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'"
    }
  }
})