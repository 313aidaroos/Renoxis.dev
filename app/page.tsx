import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WelcomeExperience from '@/components/WelcomeExperience';
import { dashboardDestination } from '@/lib/renoxis/tour';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const destination = dashboardDestination(await searchParams);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect(destination);
  }
  return <WelcomeExperience destination={destination} />;
}
