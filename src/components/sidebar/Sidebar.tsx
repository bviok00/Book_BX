'use client';
// ZONE 2: 사이드바 — 상단 탭(HOME/BOOK/MOVIE) 상태에 따라 동적 렌더링

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createFolder, updateBookFolder, updateFolder, deleteFolder } from '@/app/dashboard/actions';
import type { Folder } from '@/types';

const BOOK_STATUS_TABS = [
  { key: 'ALL', label: '전체 도서', icon: '📖' },
  { key: 'READING', label: '읽는 중', icon: '📘' },
  { key: 'WANT_TO_READ', label: '위시리스트', icon: '💜' },
  { key: 'COMPLETED', label: '완독', icon: '✅' },
  { key: 'DROPPED', label: '중단', icon: '⏸️' },
];

const MOVIE_STATUS_TABS = [
  { key: 'ALL', label: '전체 영화', icon: '🎬' },
  { key: 'WATCHING', label: '보는 중', icon: '🍿' },
  { key: 'WANT_TO_WATCH', label: '위시리스트', icon: '💜' },
  { key: 'COMPLETED', label: '시청 완료', icon: '✅' },
  { key: 'DROPPED', label: '중단', icon: '⏸️' },
];

export default function Sidebar({ folders = [] }: { folders?: Folder[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  let currentTab = (searchParams.get('tab') as 'HOME' | 'BOOK' | 'MOVIE') || 'HOME';
  if (pathname.startsWith('/dashboard/book')) currentTab = 'BOOK';
  if (pathname.startsWith('/dashboard/movie')) currentTab = 'MOVIE';

  const bookStatus = searchParams.get('bookStatus') || 'ALL';
  const movieStatus = searchParams.get('movieStatus') || 'ALL';
  const activeBookFolderId = searchParams.get('bookFolderId');
  const activeMovieFolderId = searchParams.get('movieFolderId');
  
  const [isPending, startTransition] = useTransition();

  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);

  const bookFolders = folders.filter(f => f.media_type === 'BOOK' || !f.media_type);
  const movieFolders = folders.filter(f => f.media_type === 'MOVIE');

  const updateQueryParams = (paramsToUpdate: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value === null) current.delete(key);
      else current.set(key, value);
    });
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`/dashboard${query}`);
  };

  const handleCreateFolder = (mediaType: 'BOOK' | 'MOVIE') => {
    const name = window.prompt(`새 ${mediaType === 'BOOK' ? '도서' : '영화'} 폴더 이름을 입력하세요:`);
    if (name && name.trim()) {
      startTransition(async () => {
        const res = await createFolder(name.trim(), mediaType);
        if (!res.success) alert(res.message);
      });
    }
  };

  const handleEditFolder = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleSaveEditFolder = (e: React.FormEvent, folderId: string) => {
    e.preventDefault();
    if (!editingFolderName.trim()) return;
    startTransition(async () => {
      const res = await updateFolder(folderId, editingFolderName.trim());
      if (res.success) setEditingFolderId(null);
      else alert(res.message);
    });
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (window.confirm('정말 삭제하시겠습니까? 이 폴더의 항목들은 폴더 지정이 해제됩니다.')) {
      startTransition(async () => {
        const res = await deleteFolder(folderId);
        if (!res.success) alert(res.message);
      });
    }
  };

  const onDragStart = (e: React.DragEvent, folderId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folderId }));
    setDraggedFolderId(folderId);
  };

  const onDrop = (e: React.DragEvent, targetFolderId: string, folderMediaType: 'BOOK' | 'MOVIE') => {
    e.preventDefault();
    setDraggedFolderId(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.type === 'book' && folderMediaType === 'BOOK') {
        startTransition(async () => {
          const res = await updateBookFolder(data.id, targetFolderId);
          if (!res.success) alert(res.message);
        });
      } else if (data.type === 'movie' && folderMediaType === 'MOVIE') {
        alert('영화 폴더 이동이 곧 지원됩니다.');
      }
    } catch (err) {}
  };

  const renderFolderList = (folderList: Folder[], type: 'BOOK' | 'MOVIE', activeFolderId: string | null, paramKey: string) => {
    if (folderList.length === 0) return (
      <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '12px', textAlign: 'center' }}>
        폴더를 추가하세요.
      </div>
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {folderList.map(folder => (
          <div
            key={folder.id}
            draggable
            onDragStart={(e) => onDragStart(e, folder.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, folder.id, type)}
            onClick={() => updateQueryParams({ [paramKey]: activeFolderId === folder.id ? null : folder.id })}
            onMouseEnter={() => setHoveredFolderId(folder.id)}
            onMouseLeave={() => setHoveredFolderId(null)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: activeFolderId === folder.id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeFolderId === folder.id ? 'var(--bg-card)' : 'transparent',
              transition: 'background-color 0.2s',
            }}
            className="hover-bg folder-item"
          >
            <span style={{ color: activeFolderId === folder.id ? 'var(--accent)' : 'var(--text-tertiary)' }}>📁</span>
            {editingFolderId === folder.id ? (
              <form onSubmit={(e) => handleSaveEditFolder(e, folder.id)} style={{ flex: 1, display: 'flex' }}>
                <input
                  type="text"
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', padding: '2px 4px', borderRadius: '4px', minWidth: '50px' }}
                />
              </form>
            ) : (
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</span>
            )}
            {!editingFolderId && (
              <div className="folder-actions" style={{ display: hoveredFolderId === folder.id ? 'flex' : 'none', gap: '4px' }}>
                <button onClick={(e) => handleEditFolder(e, folder)} title="수정" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px' }}>✏️</button>
                <button onClick={(e) => handleDeleteFolder(e, folder.id)} title="삭제" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px' }}>🗑️</button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <aside
      style={{
        height: 'calc(100vh - var(--header-height))',
        overflowY: 'auto',
        borderRight: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}
    >
      {/* ── HOME 탭 일 때의 사이드바 ── */}
      {currentTab === 'HOME' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>✨ 추천 및 영감</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            나의 지식 성단을 채울 새로운 도서와 영화를 탐색해 보세요. 
          </p>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', marginTop: '8px' }}>
            <span style={{ fontSize: '24px' }}>🌌</span>
            <p style={{ fontSize: '13px', fontWeight: 500, marginTop: '8px', color: 'var(--text-primary)' }}>우주를 유영하는 중...</p>
          </div>
        </div>
      )}

      {/* ── BOOK 탭 일 때의 사이드바 ── */}
      {currentTab === 'BOOK' && (
        <div className="animate-fade-in">
          <div style={{ padding: '0 16px', marginBottom: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>📚 도서 컬렉션</h2>
          </div>
          
          <section style={{ padding: '0 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {BOOK_STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => updateQueryParams({ bookStatus: tab.key === 'ALL' ? null : tab.key })}
                  className="focus-ring"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                    borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '13px',
                    fontWeight: bookStatus === tab.key ? 600 : 400,
                    color: bookStatus === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: bookStatus === tab.key ? 'var(--accent-light)' : 'transparent',
                    textAlign: 'left', width: '100%', transition: 'all var(--transition-fast)',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </section>

          <section style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>도서 프로젝트</h3>
              <button onClick={() => handleCreateFolder('BOOK')} className="focus-ring" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>+</button>
            </div>
            {renderFolderList(bookFolders, 'BOOK', activeBookFolderId, 'bookFolderId')}
          </section>
        </div>
      )}

      {/* ── MOVIE 탭 일 때의 사이드바 ── */}
      {currentTab === 'MOVIE' && (
        <div className="animate-fade-in">
          <div style={{ padding: '0 16px', marginBottom: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>🎬 영화 컬렉션</h2>
          </div>

          <section style={{ padding: '0 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {MOVIE_STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => updateQueryParams({ movieStatus: tab.key === 'ALL' ? null : tab.key })}
                  className="focus-ring"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                    borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '13px',
                    fontWeight: movieStatus === tab.key ? 600 : 400,
                    color: movieStatus === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: movieStatus === tab.key ? 'rgba(230, 50, 80, 0.15)' : 'transparent',
                    textAlign: 'left', width: '100%', transition: 'all var(--transition-fast)',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </section>

          <section style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>영화 폴더</h3>
              <button onClick={() => handleCreateFolder('MOVIE')} className="focus-ring" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>+</button>
            </div>
            {renderFolderList(movieFolders, 'MOVIE', activeMovieFolderId, 'movieFolderId')}
          </section>
        </div>
      )}

    </aside>
  );
}
