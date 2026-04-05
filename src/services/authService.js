import { createClient } from '@supabase/supabase-js';
import { getAuthRateLimitInfo } from './authRateLimit.js';
import { canSelfRegisterRole } from './loginPolicy.js';
import { clearReadMostlyCache } from './readMostlyCache.js';

const allowedRoles = new Set(['student', 'parent', 'teacher', 'admin', 'payments']);
export const SELF_SIGN_UP_DISABLED_MESSAGE =
  'This account must be created by your school administrator.';
export { getAuthRateLimitInfo } from './authRateLimit.js';

async function requireSupabaseClient() {
  const { requireSupabase } = await import('./supabase.js');
  return requireSupabase();
}

async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

function createPasswordVerificationClient(createClientFn = createClient) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return createClientFn(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: 'password-verification',
    },
  });
}

function sanitizeRole(role) {
  if (!role) return 'student';
  return allowedRoles.has(role) ? role : 'student';
}

export async function getSession() {
  const client = await requireSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithPassword(email, password) {
  const client = await requireSupabaseClient();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
  if (error) throw error;
  clearReadMostlyCache();
  return data;
}

export async function signUpWithRole(
  { email, password, fullName, role = 'student' },
  requireSupabaseFn = requireSupabaseClient,
  { canSelfRegisterRoleFn = canSelfRegisterRole } = {}
) {
  const cleanRole = sanitizeRole(role);
  if (!canSelfRegisterRoleFn(cleanRole)) {
    throw new Error(SELF_SIGN_UP_DISABLED_MESSAGE);
  }
  const client = await requireSupabaseFn();
  const cleanEmail = String(email || '').trim().toLowerCase();

  const { data, error } = await client.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        role: cleanRole,
        first_name: String(fullName || '').trim().split(/\s+/).filter(Boolean)[0] || '',
        last_name: String(fullName || '').trim().split(/\s+/).filter(Boolean).slice(1).join(' ') || '',
      },
    },
  });

  if (error) throw error;

  const userId = data.user?.id;
  if (userId) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || '';
    const { error: profileErr } = await client
      .from('profiles')
      .upsert(
        {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email: cleanEmail,
          role: cleanRole,
        },
        { onConflict: 'id' }
      );

    if (profileErr) {
      throw new Error(
        'Account created, but profile setup failed. Contact admin if role is not assigned.'
      );
    }
  }

  clearReadMostlyCache();
  return data;
}

export async function resetPasswordForEmail(email) {
  const client = await requireSupabaseClient();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const { error } = await client.auth.resetPasswordForEmail(cleanEmail);
  if (error) throw error;
  return true;
}

export async function updatePassword(newPassword) {
  const client = await requireSupabaseClient();
  const { data, error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export async function verifyCurrentPassword(
  currentPassword,
  clientOverride,
  createClientFn = createClient
) {
  const client = clientOverride || (await requireSupabaseClient());
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) throw error;

  const email = String(user?.email || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Account email is missing.');
  }

  const verifierClient = createPasswordVerificationClient(createClientFn);
  const { error: verificationError } = await verifierClient.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (verificationError) {
    throw new Error('Current password is incorrect.');
  }

  return true;
}

export async function completeFirstLoginPasswordChange(
  currentPassword,
  newPassword,
  requestFn,
  dependencies = {}
) {
  const verifyCurrentPasswordFn = dependencies.verifyCurrentPasswordFn || verifyCurrentPassword;
  const updatePasswordFn = dependencies.updatePasswordFn || updatePassword;
  const resolvedRequestFn = requestFn || (await getApiRequest());

  await verifyCurrentPasswordFn(currentPassword);
  await updatePasswordFn(newPassword);

  const payload = await resolvedRequestFn('/api/auth/complete-first-login', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  return payload;
}

export async function signOut() {
  const client = await requireSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
  clearReadMostlyCache();
}

export async function onAuthStateChange(callback) {
  const client = await requireSupabaseClient();
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}

export function normalizeAuthError(error) {
  const msg = error?.message || String(error || 'Authentication failed');
  const rateLimit = getAuthRateLimitInfo(error);

  if (rateLimit.isRateLimited) return rateLimit.message;

  if (/Invalid login credentials/i.test(msg)) return 'Invalid email or password.';
  if (/Email not confirmed/i.test(msg)) return 'Email is not confirmed yet. (Email verification is disabled during testing.)';
  if (/Password should be at least/i.test(msg)) return 'Password must be at least 6 characters.';
  if (/User already registered/i.test(msg)) return 'This email is already registered. Sign in instead.';

  return msg;
}
