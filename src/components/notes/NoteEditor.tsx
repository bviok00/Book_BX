'use client';
// 메모 작성/수정용 인라인 에디터

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { TextArea, Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { createNote } from '@/app/dashboard/actions';

interface NoteEditorProps {
  userBookId: string;
  chapterId?: string;
  onCancel: () => void;
  onSuccess: () => void;
  initialContent?: string;
  initialPageRef?: string;
}

export default function NoteEditor({
  userBookId,
  chapterId,
  onCancel,
  onSuccess,
  initialContent = '',
  initialPageRef = '',
}: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [pageRef, setPageRef] = useState(initialPageRef);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!content.trim()) {
      showToast('메모 내용을 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);
    
    // TODO: 수정 기능은 별도 액션 필요 (현재는 생성만 처리)
    const result = await createNote(userBookId, content, chapterId, pageRef);
    
    if (result.success) {
      showToast('메모가 저장되었습니다.', 'success');
      onSuccess();
    } else {
      showToast(result.message, 'error');
    }
    
    setIsLoading(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', gap: '12px' }}>
        <Input
          placeholder="p. 142 (선택)"
          value={pageRef}
          onChange={(e) => setPageRef(e.target.value)}
          style={{ width: '120px' }}
        />
        <div style={{ flex: 1, color: 'var(--text-tertiary)', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
          페이지 참조를 입력하면 그래프에서 더 정확히 연결됩니다.
        </div>
      </div>
      
      <TextArea
        placeholder="이 부분에서 어떤 통찰을 얻었나요?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ minHeight: '120px' }}
        autoFocus
      />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
        <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
          저장
        </Button>
      </div>
    </div>
  );
}
