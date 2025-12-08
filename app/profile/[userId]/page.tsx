import { PublicProfileView } from '../_components/PublicProfileView';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params; // Await params
  return <PublicProfileView userId={userId} />;
}
