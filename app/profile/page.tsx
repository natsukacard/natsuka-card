import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileView } from './_components/ProfileView';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect('/login');
  }

  return <ProfileView />;
}
