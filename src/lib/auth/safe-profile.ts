import { createClient } from '@supabase/supabase-js';

export async function getSafeProfile(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  return data;
}
