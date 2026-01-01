import { createClient } from '@/lib/supabase/client';
import { getQueryClient } from '../get-query-client';

const queryClient = getQueryClient();

type SignInCredentials = Parameters<
  ReturnType<typeof createClient>['auth']['signInWithPassword']
>[0];

type SignUpCredentials = {
  username: string;
  email: string;
  password: string;
};

/*
 * Signs in a user with email and password
 * On success, invalidates the 'auth-user' query to refetch the session
 */
export const signInWithPassword = async (credentials: SignInCredentials) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    throw new Error(error.message);
  }

  await queryClient.invalidateQueries({ queryKey: ['auth-user'] });
  await queryClient.invalidateQueries({ queryKey: ['auth-user-pro-status'] });
  return data.user;
};

/**
 * Signs up a new user
 * Function does no log the user in; they must confirm their email
 */
export const signUpWithPassword = async (credentials: SignUpCredentials) => {
  const supabase = createClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'https://natsukacard.com';
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        full_name: credentials.username,
      },
      emailRedirectTo: `${origin}/confirm`,
    },
  });

  if (error) throw new Error(error.message);

  return data.user;
};

/**
 * Requests a password reset email
 */
export const requestPasswordReset = async ({ email, origin }: { email: string; origin?: string }) => {
  const supabase = createClient();
  const redirectOrigin = origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://natsukacard.com';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectOrigin}/reset-password`,
  });

  if (error) throw new Error(error.message);
};

/**
 * Updates the user's password
 */
export const updatePassword = async ({ password }: { password: string }) => {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) throw new Error(error.message);

  await queryClient.invalidateQueries({ queryKey: ['auth-user'] });
};

/**
 * Google OAuth sign-in flow
 * Redirects the user to the Google's authentication page
 */
export const signInWithGoogle = async () => {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/profile`,
    },
  });

  if (error) throw new Error(error.message);
};

/**
 * Signs out current user
 * Invalidates the 'auth-user' query to refetch the session
 */
export const signOut = async () => {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  await queryClient.invalidateQueries({ queryKey: ['auth-user'] });
  await queryClient.invalidateQueries({ queryKey: ['auth-user-pro-status'] });
};
