import { createClient } from '@supabase/supabase-js';

// Configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wydblgfxdxrwvxhfrjdx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGJsZ2Z4ZHhyd3Z4aGZyamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNTMwNjcsImV4cCI6MjA1NTcyOTA2N30.dummy_public_key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('dummy') &&
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder')
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Authentication Methods using Supabase Auth
 */
export async function signInWithEmail(email, password) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }
  return null;
}

export async function signUpStudent({ email, password, name, reg_no, department_id, parent_name, parent_email, phone, address }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'student', // Public signup strictly restricted to Student role
          name,
          reg_no,
          department_id,
          parent_name,
          parent_email,
          phone,
          address,
        },
      },
    });
    if (error) throw error;
    return data;
  }
  return null;
}

export async function requestPasswordReset(email) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
    return data;
  }
  return null;
}

export async function updatePassword(newPassword) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  }
  return null;
}

export async function signOut() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

/**
 * Supabase Storage Helpers
 */
export async function uploadAssignmentFile(file, studentId, assignmentId) {
  if (!isSupabaseConfigured) {
    return {
      fileName: file.name,
      filePath: `local/assignments/${studentId}_${assignmentId}_${file.name}`,
      fileSize: file.size,
    };
  }

  const fileExt = file.name.split('.').pop();
  const filePath = `assignments/${assignmentId}/${studentId}_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('assignments')
    .upload(filePath, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;

  return {
    fileName: file.name,
    filePath: data.path,
    fileSize: file.size,
  };
}

export async function getSignedDownloadUrl(bucket, filePath) {
  if (!isSupabaseConfigured) {
    return '#';
  }
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600); // 1 hour link

  if (error) throw error;
  return data.signedUrl;
}
