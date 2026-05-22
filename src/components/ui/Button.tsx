'use client';
// 범용 버튼 컴포넌트 — variant/size/loading 지원

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: `
    background-color: var(--accent);
    color: var(--text-inverse);
    border: none;
  `,
  secondary: `
    background-color: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
  `,
  ghost: `
    background-color: transparent;
    color: var(--text-secondary);
    border: none;
  `,
  danger: `
    background-color: #ef4444;
    color: #ffffff;
    border: none;
  `,
};

const sizeStyles: Record<string, string> = {
  sm: 'padding: 6px 12px; font-size: 13px; border-radius: var(--radius-sm);',
  md: 'padding: 8px 18px; font-size: 14px; border-radius: var(--radius-md);',
  lg: 'padding: 12px 24px; font-size: 16px; border-radius: var(--radius-md);',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`focus-ring ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 500,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'all var(--transition-fast)',
        ...parseInlineStyles(variantStyles[variant]),
        ...parseInlineStyles(sizeStyles[size]),
        ...style,
      }}
      {...props}
    >
      {isLoading && <LoadingSpinner />}
      {children}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: 'spin-slow 1s linear infinite' }}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="28"
        strokeDashoffset="8"
      />
    </svg>
  );
}

// CSS 문자열을 style 객체로 변환하는 헬퍼
function parseInlineStyles(css: string): React.CSSProperties {
  const result: Record<string, string> = {};
  css.split(';').forEach((declaration) => {
    const [prop, val] = declaration.split(':').map((s) => s.trim());
    if (prop && val) {
      // kebab-case → camelCase 변환
      const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      result[camelProp] = val;
    }
  });
  return result as unknown as React.CSSProperties;
}
