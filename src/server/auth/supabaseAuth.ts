import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.JWT_SECRET || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Authentication will fail.');
}

if (!jwtSecret) {
  console.warn('⚠️ JWT_SECRET not configured. Using insecure default for development.');
}

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (bypasses RLS, use with caution)
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for an authenticated user
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(
    payload,
    jwtSecret || 'dev-secret-change-in-production',
    { expiresIn: '7d' }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(
      token,
      jwtSecret || 'dev-secret-change-in-production'
    ) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Authenticate user with Supabase
 */
export async function authenticateUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Authentication failed');
  }

  // Get user role from user metadata or database
  const role = (data.user.user_metadata?.role as 'admin' | 'analyst' | 'viewer') || 'analyst';

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      role,
    },
    session: data.session,
  };
}

/**
 * Register a new user with Supabase
 */
export async function registerUser(
  email: string,
  password: string,
  role: 'admin' | 'analyst' | 'viewer' = 'analyst'
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Registration failed');
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      role,
    },
    session: data.session,
  };
}

/**
 * Sign out user
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Refresh session
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}
