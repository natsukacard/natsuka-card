'use client';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

const getUser = async () => {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return null;
  }

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims || !claims.sub) {
    return null;
  }

  return claims;
};

export const useUser = () => {
  return useQuery({
    queryKey: ['auth-user'],
    queryFn: getUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

const getIsUserPro = async () => {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return false;
  }

  const { data: proData, error } = await supabase.rpc('is_user_pro');

  if (error) {
    console.error('Error checking pro status:', error);
    return false;
  }

  return proData || false;
};

export const useIsUserPro = () => {
  return useQuery({
    queryKey: ['auth-user-pro-status'],
    queryFn: getIsUserPro,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};
