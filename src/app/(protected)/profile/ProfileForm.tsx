'use client';

import { useState } from 'react';
import type { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { updateProfile } from './actions';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ProfileFormProps {
  user: User;
  profile: Profile | null;
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
    
    setIsLoading(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
          로그인 계정
        </label>
        <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px' }}>
          {user.email}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input 
          label="닉네임" 
          name="displayName" 
          defaultValue={profile?.display_name || ''} 
          placeholder="닉네임을 입력하세요" 
          required
        />
        
        <Input 
          label="연간 목표 (권)" 
          name="yearlyGoal" 
          type="number" 
          min="0"
          defaultValue={profile?.yearly_goal || 0} 
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <input 
            type="checkbox" 
            id="isPublic" 
            name="isPublic" 
            defaultChecked={profile?.is_public || false}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
          />
          <label htmlFor="isPublic" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            서재 공개 (퍼블릭 링크 허용)
          </label>
        </div>

        <Button 
          type="submit" 
          isLoading={isLoading} 
          style={{ 
            marginTop: '8px', 
            backgroundColor: '#1a1a1a', 
            color: '#ffffff',
            border: '1px solid #333'
          }}
        >
          프로필 저장
        </Button>
      </form>

      <div style={{ marginTop: '16px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
        <Button 
          onClick={handleLogout} 
          isLoading={isLoggingOut}
          style={{ 
            width: '100%', 
            backgroundColor: '#1a1a1a', 
            color: '#ffffff',
            border: '1px solid #333'
          }}
        >
          로그아웃
        </Button>
      </div>
    </div>
  );
}
