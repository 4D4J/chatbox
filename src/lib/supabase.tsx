import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ufutfzyfotrgemmxvrwj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdXRmenlmb3RyZ2VtbXh2cndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODExNTcsImV4cCI6MjA2MTA1NzE1N30.v8JCfgw5uHJiGLziF-KB1xEW3fUrazdpcDWaVIpixoU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)