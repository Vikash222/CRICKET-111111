import { supabase } from '../lib/supabase';
import { Profile } from '../types/cricket';

const SESSION_KEY = 'college_cricket_organizer_session';

export type OrganizerIdentity = Pick<Profile, 'id' | 'email' | 'full_name' | 'role'>;

export const getOrganizerSessionToken = () => localStorage.getItem(SESSION_KEY);

export const organizerLogin = async (email: string, password: string): Promise<Profile> => {
  const { data, error } = await supabase.rpc('organizer_login', {
    p_email: email.trim(),
    p_password: password,
  });
  if (error) throw new Error(error.message || 'Organizer login failed.');
  const result = data as { session_token?: string; organizer?: OrganizerIdentity } | null;
  if (!result?.session_token || !result.organizer) throw new Error('Invalid organizer login response.');

  localStorage.setItem(SESSION_KEY, result.session_token);
  return {
    id: `organizer:${result.organizer.id}`,
    email: result.organizer.email,
    full_name: result.organizer.full_name,
    role: 'organizer',
    language: 'english',
    is_verified: true,
  };
};

export const restoreOrganizerSession = async (): Promise<Profile | null> => {
  const token = getOrganizerSessionToken();
  if (!token) return null;
  const { data, error } = await supabase.rpc('organizer_restore', { p_session_token: token });
  if (error || !data) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  const identity = data as OrganizerIdentity;
  return {
    id: `organizer:${identity.id}`,
    email: identity.email,
    full_name: identity.full_name,
    role: 'organizer',
    language: 'english',
    is_verified: true,
  };
};

export const organizerLogout = async () => {
  const token = getOrganizerSessionToken();
  localStorage.removeItem(SESSION_KEY);
  if (!token) return;
  await supabase.rpc('organizer_logout', { p_session_token: token });
};
