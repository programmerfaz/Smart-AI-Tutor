// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lilufuhxwnolnxcsrain.supabase.co'; // replace with your URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHVmdWh4d25vbG54Y3NyYWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzkzOTgsImV4cCI6MjA2OTMxNTM5OH0.IRAn-8eGgWuf2UCQ85Y9Bqm6-rYEaIKj1oF9juEQPww'; // replace with your anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
