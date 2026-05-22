// AI 프로바이더 추상화 레이어 — Ollama/Claude/Gemini 교체 가능 설정
import type { AIProvider, AIConfig } from '@/types';

// .env.local 기반 현재 활성 AI 설정을 반환
export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'ollama') as AIProvider;

  switch (provider) {
    case 'ollama':
      return {
        provider: 'ollama',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'gemma4:e4b',
      };
    case 'claude':
      return {
        provider: 'claude',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      };
    case 'gemini':
      return {
        provider: 'gemini',
        apiKey: process.env.GOOGLE_AI_API_KEY,
        model: process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash',
      };
    default:
      return {
        provider: 'ollama',
        baseUrl: 'http://localhost:11434',
        model: 'gemma4:e4b',
      };
  }
}
