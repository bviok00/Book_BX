'use client';
// 개별 마이크로 메모 렌더링 (왓챠 코멘트 스타일)

import type { GranularNote as NoteType } from '@/types';
import { TagBadge } from '@/components/ui/Badge';

interface GranularNoteProps {
  note: NoteType & { tag_names?: string[] };
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function GranularNote({
  note,
  onEdit,
  onDelete,
}: GranularNoteProps) {
  const formattedDate = new Date(note.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* 헤더: 페이지 참조 & 날짜 & 액션 메뉴 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {note.page_reference && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-light)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {note.page_reference}
            </span>
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {formattedDate}
          </span>
        </div>

        {/* 액션 (수정/삭제/공유) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {onEdit && (
            <button
              onClick={onEdit}
              className="focus-ring"
              title="수정"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '14px' }}
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="focus-ring"
              title="삭제"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '14px' }}
            >
              🗑️
            </button>
          )}
          <button
            className="focus-ring"
            title="이미지로 공유"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '14px' }}
          >
            📸
          </button>
        </div>
      </div>

      {/* 본문 텍스트 (줄바꿈 보존) */}
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {note.content}
      </p>

      {/* 태그 영역 */}
      {note.tag_names && note.tag_names.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
          {note.tag_names.map((tag) => (
            <TagBadge key={tag} name={tag} variant="glass" />
          ))}
        </div>
      )}
    </div>
  );
}
