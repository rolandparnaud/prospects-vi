import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bhfowohsqsvfwnuwbmvh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZm93b2hzcXN2ZndudXdibXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTc4MTgsImV4cCI6MjA4OTU3MzgxOH0.RLGhS3wNNnYYoGUUgHAU5s651XDDqTB54mge8dluqMY'

export const supabase = createClient(supabaseUrl, supabaseKey)
