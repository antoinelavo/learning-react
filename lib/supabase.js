import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://scdoramzssnimcbsojml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZG9yYW16c3NuaW1jYnNvam1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMzQ2MTQsImV4cCI6MjA1MzcxMDYxNH0.IQWNZLgTaqzO_jR-NN3rfFUbz1qZ91DaUbBzodMKBuc';

export const supabase = createClient(supabaseUrl, supabaseKey);