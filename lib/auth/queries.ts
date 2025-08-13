'use client';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

const getUser = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    throw new Error(error.message);
  }

  return data?.claims || null;
};

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });
};
