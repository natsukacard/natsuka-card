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
 * On success, invalidates the 'user' query to refetch the session
 */
export const signInWithPassword = async (credentials: SignInCredentials) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    throw new Error(error.message);
  }

  await queryClient.invalidateQueries({ queryKey: ['user'] });
  return data.user;
};

/**
 * Signs up a new user
 * Function does no log the user in; they must confirm their email
 */
export const signUpWithPassword = async (credentials: SignUpCredentials) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: credentials.username,
        // The avatar_url can be added here in the future
        // avatar_url: '...'
      },
    },
  });

  if (error) throw new Error(error.message);

  return data.user;
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
      redirectTo: `${origin}/callback`,
    },
  });

  if (error) throw new Error(error.message);
};

/**
 * Signs out current user
 * Invalidates the 'user' query to refetch the session
 */
export const signOut = async () => {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  await queryClient.invalidateQueries({ queryKey: ['user'] });
};
