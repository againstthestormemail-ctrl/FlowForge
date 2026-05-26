import { supabase } from './supabase-client.js';

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return subscription;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function getUserEmail(session) {
  return session?.user?.email || '';
}

export function getUserId(session) {
  return session?.user?.id || null;
}
