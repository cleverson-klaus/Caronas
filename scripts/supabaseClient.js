// scripts/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// substitua por suas variáveis do Supabase
const SUPABASE_URL = 'https://japuvbxnmjmsaqmanugg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcHV2YnhubWptc2FxbWFudWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzIzMjEsImV4cCI6MjA3ODA0ODMyMX0.CnXZABQ6aFYnVl5YjF6cv0Fd45RYpguMaGHPr1swn4g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);