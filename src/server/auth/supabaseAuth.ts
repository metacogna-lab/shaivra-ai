import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
const jwtSecret = process.env.JWT_SECRET?.trim() || 'dev-secret-change-in-production';

const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/** Supabase client when SUPABASE_URL and SUPABASE_ANON_KEY are set; otherwise null. */
function getSupabase(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!_supabase) _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

/** Supabase admin client when credentials are set; otherwise null. */
function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  if (!_supabaseAdmin) _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  return _supabaseAdmin;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for an authenticated user.
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, jwtSecret) as JWTPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

const AUTH_NOT_CONFIGURED = 'Authentication not configured (set SUPABASE_URL and SUPABASE_ANON_KEY).';

/**
 * Authenticate user (Supabase when configured).
 */
export async function authenticateUser(email: string, password: string) {
  const client = getSupabase();
  if (!client) throw new Error(AUTH_NOT_CONFIGURED);

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Authentication failed');

  const role = (data.user.user_metadata?.role as 'admin' | 'analyst' | 'viewer') || 'analyst';
  return {
    user: { id: data.user.id, email: data.user.email!, role },
    session: data.session,
  };
}

/**
 * Register a new user (Supabase when configured).
 */
export async function registerUser(
  email: string,
  password: string,
  role: 'admin' | 'analyst' | 'viewer' = 'analyst'
) {
  const client = getSupabase();
  if (!client) throw new Error(AUTH_NOT_CONFIGURED);

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Registration failed');

  return {
    user: { id: data.user.id, email: data.user.email!, role },
    session: data.session,
  };
}

/**
 * Sign out user (Supabase when configured).
 */
export async function signOutUser() {
  const client = getSupabase();
  if (!client) throw new Error(AUTH_NOT_CONFIGURED);
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Refresh session (Supabase when configured).
 */
export async function refreshSession() {
  const client = getSupabase();
  if (!client) throw new Error(AUTH_NOT_CONFIGURED);
  const { data, error } = await client.auth.refreshSession();
  if (error) throw new Error(error.message);
  return data.session;
}
