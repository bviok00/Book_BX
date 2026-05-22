// AI 프로바이더 통합 인터페이스 — 프로바이더 교체 시 이 파일만 수정
import { getAIConfig } from './config';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AICompletionOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
}

// 텍스트 완성 요청 — 프로바이더에 관계없이 동일한 인터페이스
export async function generateCompletion(
  options: AICompletionOptions
): Promise<string> {
  const config = getAIConfig();

  switch (config.provider) {
    case 'ollama':
      return ollamaCompletion(options, config.baseUrl!, config.model);
    case 'claude':
      return claudeCompletion(options, config.apiKey!, config.model);
    case 'gemini':
      return geminiCompletion(options, config.apiKey!, config.model);
    default:
      throw new Error(`지원하지 않는 AI 프로바이더: ${config.provider}`);
  }
}

// ── Ollama (로컬 LLM) ──
async function ollamaCompletion(
  options: AICompletionOptions,
  baseUrl: string,
  model: string
): Promise<string> {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: options.messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 1024,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API 오류: ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content ?? '';
}

// ── Claude (Anthropic) ──
async function claudeCompletion(
  options: AICompletionOptions,
  apiKey: string,
  model: string
): Promise<string> {
  // system 메시지 분리 (Claude API는 system을 별도 파라미터로 요구)
  const systemMsg = options.messages.find((m) => m.role === 'system');
  const chatMessages = options.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      ...(systemMsg && { system: systemMsg.content }),
      messages: chatMessages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API 오류: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

// ── Gemini (Google AI) ──
async function geminiCompletion(
  options: AICompletionOptions,
  apiKey: string,
  model: string
): Promise<string> {
  // Gemini는 role을 'model'로 표기 (assistant → model)
  const contents = options.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = options.messages.find(
    (m) => m.role === 'system'
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemInstruction && {
          systemInstruction: { parts: [{ text: systemInstruction.content }] },
        }),
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API 오류: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
