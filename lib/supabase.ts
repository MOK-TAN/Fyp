import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Your Supabase credentials
const supabaseUrl = 'https://yyhytueronsovjifusjc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5aHl0dWVyb25zb3ZqaWZ1c2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MzY5ODcsImV4cCI6MjA1MzExMjk4N30.FVoEoL6YGkzJ3r4Q4-OYQJJk9XxJI0PF8bqYqNhVKLM';

// Use AsyncStorage only on mobile, localStorage on web
const storage = Platform.OS === 'web' 
  ? {
      getItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    }
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});