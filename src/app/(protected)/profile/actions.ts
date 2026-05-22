'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types';

export async function updateProfile(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Server actions allow setting cookies
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: '인증되지 않은 사용자입니다.' };
    }

    const displayName = formData.get('displayName')?.toString();
    const yearlyGoal = parseInt(formData.get('yearlyGoal')?.toString() || '0', 10);
    const isPublic = formData.get('isPublic') === 'on';

    if (!displayName || displayName.trim() === '') {
      return { success: false, message: '닉네임을 입력해주세요.' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        yearly_goal: yearlyGoal,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true, message: '프로필이 성공적으로 업데이트되었습니다.' };
  } catch (error: any) {
    console.error('프로필 업데이트 오류:', error);
    return { success: false, message: error.message || '프로필 업데이트 실패' };
  }
}
