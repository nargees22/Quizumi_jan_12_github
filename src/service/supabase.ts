import { createClient } from "@supabase/supabase-js";

// Use simple environment variable access
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jmgmzfjimkddnejgcmcu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZ216ZmppbWtkZG5lamdjbWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDUyNzcsImV4cCI6MjA4MjkyMTI3N30._PFnk3IluYYbPUEP56Vg4lmDefJUe05WmwrOE2DvxMY'

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
console.log(
  "SUPABASE RUNTIME CHECK →",
 SUPABASE_URL,
 SUPABASE_ANON_KEY?.slice(0, 8)
);




