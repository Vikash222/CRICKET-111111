import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string> }).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://crowgkvxrfqptsmtphsq.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MhQlQnAftpUVLskMPSh6kQ_s1mrYkoJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
