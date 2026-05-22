'use client';
// 옵시디언 포맷(.md) 다운로드 유틸리티

import Button from '@/components/ui/Button';

interface ObsidianExportProps {
  bookTitle: string;
  author: string;
  tags: string[];
  summary: string;
  notes: { content: string; page?: string }[];
}

export default function ObsidianExport({
  bookTitle,
  author,
  tags,
  summary,
  notes,
}: ObsidianExportProps) {
  const handleExport = () => {
    // 1. YAML 프론트매터 생성
    const frontmatter = `---
title: "${bookTitle}"
author: "${author}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
date: "${new Date().toISOString().split('T')[0]}"
---

`;

    // 2. 본문 템플릿
    let content = `# 📖 ${bookTitle}

## 📝 총평
${summary || '작성된 총평이 없습니다.'}

## 💡 하이라이트 & 메모
`;

    if (notes.length === 0) {
      content += '작성된 메모가 없습니다.\n';
    } else {
      notes.forEach((n) => {
        const pageInfo = n.page ? ` (p.${n.page})` : '';
        content += `\n> ${n.content.split('\n').join('\n> ')}\n- 작성일: ${new Date().toLocaleDateString()}${pageInfo}\n`;
      });
    }

    // 3. Blob 생성 및 다운로드
    const fullContent = frontmatter + content;
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookTitle.replace(/[\/\\]/g, '_')}_독서노트.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="secondary" onClick={handleExport} style={{ gap: '8px' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Obsidian으로 내보내기
    </Button>
  );
}
