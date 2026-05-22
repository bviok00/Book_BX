'use client';
// 도서 디테일 오버레이 — 왓챠 스타일 디테일 뷰

import { useState } from 'react';
import type { BookStatus } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { updateBookStatus, updateBookRating, updateSummaryNote } from '@/app/dashboard/actions';
import ChapterTree from '@/components/notes/ChapterTree';
import NoteEditor from '@/components/notes/NoteEditor';

// props 타입은 임시로 any 처리 (실제 사용 시 DashboardClient와 맞출 예정)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BookDetailOverlay({ isOpen, onClose, userBook }: any) {
  const [activeTab, setActiveTab] = useState<'info' | 'notes'>('info');
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState(userBook?.summary_note || '');
  const [isAddingNoteTo, setIsAddingNoteTo] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!userBook) return null;

  const handleStatusChange = async (status: BookStatus) => {
    const res = await updateBookStatus(userBook.id, status);
    if (res.success) showToast(res.message, 'success');
    else showToast(res.message, 'error');
  };

  const handleRatingChange = async (clickedRating: number) => {
    const newRating = (userBook.rating || 0) === clickedRating ? 0 : clickedRating;
    const res = await updateBookRating(userBook.id, newRating === 0 ? null : newRating);
    if (res.success) showToast(res.message, 'success');
    else showToast(res.message, 'error');
  };

  const handleSummarySave = async () => {
    const res = await updateSummaryNote(userBook.id, summaryText);
    if (res.success) {
      showToast(res.message, 'success');
      setEditingSummary(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="800px">
      <div style={{ position: 'relative', margin: '-20px' }}>
        {/* 히어로 배너 (표지 블러 배경) */}
        <div
          style={{
            height: '240px',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: userBook.dominant_color || 'var(--bg-secondary)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${userBook.books?.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px) brightness(0.6)',
              transform: 'scale(1.1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, var(--bg-card) 0%, transparent 100%)',
            }}
          />
          
          {/* 뒤로가기 / 닫기 버튼 */}
          <button
            onClick={onClose}
            className="focus-ring"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            ✕
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div style={{ padding: '0 32px 32px', marginTop: '-120px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            {/* 좌측: 책 표지 */}
            <div
              style={{
                width: '160px',
                flexShrink: 0,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <img
                src={userBook.books?.cover_url}
                alt={userBook.books?.title}
                style={{ width: '100%', display: 'block' }}
              />
            </div>

            {/* 우측: 메타 정보 및 액션 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: 1.3 }}>
                  {userBook.books?.title}
                </h1>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                  {userBook.books?.author} · {userBook.books?.publisher}
                </p>
              </div>

              {/* 상태 및 평점 컨트롤 */}
              <div
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  padding: '16px',
                  marginTop: '16px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                {/* 상태 선택 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>상태</span>
                  <select
                    value={userBook.status}
                    onChange={(e) => handleStatusChange(e.target.value as BookStatus)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-primary)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="WANT_TO_READ">읽고 싶은</option>
                    <option value="READING">읽는 중</option>
                    <option value="COMPLETED">완독</option>
                    <option value="DROPPED">중단</option>
                  </select>
                </div>

                {/* 평점 선택 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>평점</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '20px',
                          color: (userBook.rating || 0) >= star ? 'var(--accent)' : 'var(--border-secondary)',
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '32px', borderBottom: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('info')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: activeTab === 'info' ? 600 : 400,
                color: activeTab === 'info' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'info' ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              기본 정보 & 총평
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: activeTab === 'notes' ? 600 : 400,
                color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'notes' ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              독서 노트
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div style={{ paddingTop: '24px' }}>
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 총평 */}
                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>총평</h3>
                    {!editingSummary && (
                      <Button variant="ghost" size="sm" onClick={() => setEditingSummary(true)}>
                        수정
                      </Button>
                    )}
                  </div>
                  
                  {editingSummary ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <TextArea
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        placeholder="이 책에 대한 전반적인 감상이나 요약을 남겨보세요."
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingSummary(false); setSummaryText(userBook.summary_note || ''); }}>
                          취소
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSummarySave}>
                          저장
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        color: userBook.summary_note ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {userBook.summary_note || '아직 작성된 총평이 없습니다.'}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                {isAddingNoteTo && (
                  <div style={{ marginBottom: '24px' }}>
                    <NoteEditor
                      userBookId={userBook.id}
                      chapterId={isAddingNoteTo}
                      onCancel={() => setIsAddingNoteTo(null)}
                      onSuccess={() => setIsAddingNoteTo(null)}
                    />
                  </div>
                )}
                
                {/* 추후 실제 chapters 데이터 주입 필요 */}
                <ChapterTree
                  chapters={[]} // FIXME: 서버에서 패치된 챕터 구조 주입
                  onAddNote={(chapId) => setIsAddingNoteTo(chapId)}
                  onEditNote={(noteId) => console.log('Edit note', noteId)}
                  onDeleteNote={(noteId) => console.log('Delete note', noteId)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
