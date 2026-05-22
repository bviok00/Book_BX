// 루트 레이아웃 — ThemeProvider, 폰트, 메타 태그
import type { Metadata, Viewport } from 'next';
import ThemeProvider from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Intellect BX — 지식 관제탑',
  description:
    '도서 검색, 계층형 독서 노트, 인터랙티브 지식 그래프를 통한 Second Brain 구축 플랫폼.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
