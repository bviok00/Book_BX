'use client';
// 노트 시스템 — 목차 트리 구조 렌더링

import { useState } from 'react';
import type { ChapterWithNotes } from '@/types';
import GranularNote from './GranularNote';

interface ChapterTreeProps {
  chapters: ChapterWithNotes[];
  onAddNote: (chapterId: string) => void;
  onEditNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function ChapterTree({
  chapters,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: ChapterTreeProps) {
  if (!chapters || chapters.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: '14px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        목차 정보가 없습니다.
        <br />
        <button
          className="focus-ring"
          style={{
            marginTop: '12px',
            padding: '6px 12px',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          + 커스텀 챕터 추가
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {chapters.map((chapter) => (
        <ChapterNode
          key={chapter.id}
          chapter={chapter}
          onAddNote={onAddNote}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
        />
      ))}
    </div>
  );
}

// 개별 챕터 노드
function ChapterNode({
  chapter,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: {
  chapter: ChapterWithNotes;
  onAddNote: (chapterId: string) => void;
  onEditNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 챕터 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontWeight: 600,
            padding: 0,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transition: 'transform var(--transition-fast)',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              color: 'var(--text-tertiary)',
              fontSize: '12px',
            }}
          >
            ▶
          </span>
          {chapter.title}
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
            ({chapter.notes?.length || 0})
          </span>
        </button>

        <button
          onClick={() => onAddNote(chapter.id)}
          className="focus-ring"
          title="이 챕터에 메모 추가"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          + 메모
        </button>
      </div>

      {/* 소속 메모 목록 */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px' }}>
          {chapter.notes && chapter.notes.length > 0 ? (
            chapter.notes.map((note) => (
              <GranularNote
                key={note.id}
                note={note}
                onEdit={() => onEditNote(note.id)}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))
          ) : (
            <div
              style={{
                padding: '12px',
                color: 'var(--text-tertiary)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontStyle: 'italic',
              }}
            >
              이 챕터에 작성된 메모가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
