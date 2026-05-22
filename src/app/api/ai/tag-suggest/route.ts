import { NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/ai/provider';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ success: false, message: '내용이 없습니다.' }, { status: 400 });
    }

    const systemPrompt = `당신은 독서 노트를 분석하여 핵심 개념 태그를 추출하는 AI 사서입니다.
주어진 메모 내용을 읽고, 지식 그래프 구성에 유용한 2~4개의 단어로 된 짧은 명사형 태그를 추천하세요.
태그는 배열 형태의 순수 JSON으로만 출력하세요. 다른 설명은 절대 추가하지 마세요.
예시: ["인지편향", "행동경제학", "의사결정"]`;

    const responseText = await generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `다음 메모에서 태그를 추출해줘:\n\n${content}` }
      ],
      temperature: 0.3,
      maxTokens: 100,
    });

    // JSON 파싱 (Ollama나 Claude가 백틱(```json)을 포함했을 경우 처리)
    let tags: string[] = [];
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      tags = JSON.parse(cleaned);
      if (!Array.isArray(tags)) tags = [];
    } catch (e) {
      console.warn('AI 태그 파싱 실패:', responseText);
    }

    return NextResponse.json({ success: true, data: tags });
  } catch (error: unknown) {
    console.error('AI 태그 추천 에러:', error);
    const msg = error instanceof Error ? error.message : '알 수 없는 서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
