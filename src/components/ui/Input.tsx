'use client';
// 범용 Input 컴포넌트 — 검색, 텍스트, 텍스트에어리어 variant

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';

// ── 텍스트 인풋 ──
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, style, ...props }, ref) => {
    const inputId = id || label?.replace(/\s/g, '-').toLowerCase();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className="focus-ring"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: `1px solid ${error ? '#ef4444' : 'var(--border-primary)'}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
            ...style,
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: '12px', color: '#ef4444' }}>{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ── 검색 인풋 (돋보기 아이콘 내장) ──
interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export function SearchInput({ onSearch, style, ...props }: SearchInputProps) {
  return (
    <div style={{ position: 'relative', ...style }}>
      {/* 돋보기 아이콘 */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-tertiary)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search"
        className="focus-ring"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearch) {
            onSearch((e.target as HTMLInputElement).value);
          }
        }}
        style={{
          width: '100%',
          padding: '8px 12px 8px 38px',
          fontSize: '14px',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-full)',
          outline: 'none',
          transition: 'border-color var(--transition-fast)',
        }}
        {...props}
      />
    </div>
  );
}

// ── 텍스트에어리어 ──
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, id, style, ...props }, ref) => {
    const inputId = id || label?.replace(/\s/g, '-').toLowerCase();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className="focus-ring"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: `1px solid ${error ? '#ef4444' : 'var(--border-primary)'}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            resize: 'vertical',
            minHeight: '80px',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            transition: 'border-color var(--transition-fast)',
            ...style,
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: '12px', color: '#ef4444' }}>{error}</span>
        )}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';
