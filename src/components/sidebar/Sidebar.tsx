'use client';
// ZONE 2: 사이드바 — 폴더 트리 + 독서 상태 필터

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { BookStatus } from '@/types';
import { createFolder, updateBookFolder, updateFolderOrder, updateFolder, deleteFolder } from '@/app/dashboard/actions';

const STATUS_TABS: { key: BookStatus | 'ALL'; label: string; icon: string }[] = [
  { key: 'ALL', label: '전체', icon: '📖' },
  { key: 'READING', label: '읽는 중', icon: '📘' },
  { key: 'WANT_TO_READ', label: '읽고 싶은', icon: '💜' },
  { key: 'COMPLETED', label: '완독', icon: '✅' },
  { key: 'DROPPED', label: '중단', icon: '⏸️' },
];

export default function Sidebar({ folders = [] }: { folders?: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get('status') || 'ALL';
  const activeFolderId = searchParams.get('folderId');
  const [isPending, startTransition] = useTransition();

  // Drag and Drop state for folder reordering
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  
  // Edit Folder State
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);

  const handleStatusClick = (status: string) => {
    if (status === 'ALL') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard?status=${status}`);
    }
  };

  const handleCreateFolder = () => {
    const name = window.prompt('새 폴더 이름을 입력하세요:');
    if (name && name.trim()) {
      startTransition(async () => {
        const res = await createFolder(name.trim());
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
      if (res.success) {
        setEditingFolderId(null);
      } else {
        alert(res.message);
      }
    });
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (window.confirm('정말 삭제하시겠습니까? 이 폴더의 책들은 폴더 지정이 해제됩니다.')) {
      startTransition(async () => {
        const res = await deleteFolder(folderId);
        if (!res.success) alert(res.message);
      });
    }
  };

  // -- Drag and Drop Handlers for Folders --
  const onDragStart = (e: React.DragEvent, folderId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folderId }));
    setDraggedFolderId(folderId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const onDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDraggedFolderId(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.type === 'book') {
        // Drop book into folder
        startTransition(async () => {
          const res = await updateBookFolder(data.id, targetFolderId);
          if (!res.success) alert(res.message);
        });
      } else if (data.type === 'folder' && data.id !== targetFolderId) {
        // Reorder folders
        const draggedIdx = folders.findIndex(f => f.id === data.id);
        const targetIdx = folders.findIndex(f => f.id === targetFolderId);
        if (draggedIdx >= 0 && targetIdx >= 0) {
          const newFolders = [...folders];
          const [draggedItem] = newFolders.splice(draggedIdx, 1);
          newFolders.splice(targetIdx, 0, draggedItem);
          
          const updates = newFolders.map((f, i) => ({ id: f.id, sort_order: i + 1 }));
          startTransition(async () => {
            const res = await updateFolderOrder(updates);
            if (!res.success) alert(res.message);
          });
        }
      }
    } catch (err) {
      // JSON parse error or something else
    }
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
        gap: '24px',
      }}
    >
      {/* 독서 상태 필터 */}
      <section style={{ padding: '0 16px' }}>
        <h3
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.5px',
            marginBottom: '8px',
          }}
        >
          독서 상태
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusClick(tab.key)}
              className="focus-ring"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeStatus === tab.key ? 600 : 400,
                color: activeStatus === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: activeStatus === tab.key ? 'var(--accent-light)' : 'transparent',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '15px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* 폴더 트리 */}
      <section style={{ padding: '0 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <h3
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.5px',
            }}
          >
            프로젝트 폴더
          </h3>
          <button
            onClick={handleCreateFolder}
            disabled={isPending}
            className="focus-ring"
            title="폴더 추가"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              fontSize: '16px',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              opacity: isPending ? 0.5 : 1
            }}
          >
            +
          </button>
        </div>
        
        {folders.length === 0 ? (
          <div
            style={{
              color: 'var(--text-tertiary)',
              fontSize: '13px',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            폴더를 추가하여
            <br />
            도서를 분류하세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {folders.map(folder => (
              <div
                key={folder.id}
                draggable
                onDragStart={(e) => onDragStart(e, folder.id)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, folder.id)}
                onClick={() => router.push(`/dashboard?folderId=${folder.id}`)}
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
                  backgroundColor: activeFolderId === folder.id ? 'var(--bg-card)' : (draggedFolderId === folder.id ? 'var(--bg-secondary)' : 'transparent'),
                  opacity: draggedFolderId === folder.id ? 0.5 : 1,
                  transition: 'background-color 0.2s',
                  position: 'relative'
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
                      style={{
                        flex: 1,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        minWidth: '50px'
                      }}
                    />
                  </form>
                ) : (
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {folder.name}
                  </span>
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
        )}
      </section>
    </aside>
  );
}
