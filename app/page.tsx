import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WelcomeExperience from '@/components/WelcomeExperience';
import AuthHashHandler from '@/components/AuthHashHandler';
import { dashboardDestination } from '@/lib/renoxis/tour';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const destination = dashboardDestination(params);
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = !!user;
    // Only explicit workspace/provider links bypass the public welcome.
    if (user && destination !== "/dashboard") redirect(destination);
  }
  return (
    <>
      <AuthHashHandler destination={destination} />
      <WelcomeExperience destination={destination} signedIn={signedIn} />
    </>
  );
}
