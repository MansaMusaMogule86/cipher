'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRoleFromUser } from '@/lib/auth/role-guards';
import { hasMinimumRole } from '@/lib/auth/permissions';

export async function adminLoginAction(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: 'Invalid credentials.' };
  }

  const role = getRoleFromUser(data.user);
  if (!hasMinimumRole(role, 'admin')) {
    await supabase.auth.signOut();
    return { error: 'Access denied.' };
  }

  redirect('/admin/command-center');
}
