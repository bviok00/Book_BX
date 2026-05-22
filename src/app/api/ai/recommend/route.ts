import { NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/ai/provider';

export async function POST(request: Request) {
  try {
    const { currentBookTitle, tags } = await request.json();

    if (!currentBookTitle) {
      return NextResponse.json({ success: false, message: '기준 도서 제목이 필요합니다.' }, { status: 400 });
    }

    const tagStr = tags && tags.length > 0 ? `특히 다음 주제(태그)들에 관심이 있습니다: ${tags.join(', ')}` : '';

    const systemPrompt = `당신은 사용자의 독서 취향을 분석하고 지식 확장을 돕는 도서 큐레이터입니다.
사용자가 최근 읽은 책과 관심 태그를 바탕으로, 연관된 다음 책 3권을 추천해주세요.
추천 이유는 사용자가 앞서 읽은 책/태그와 어떻게 연결되는지에 초점을 맞춰 1~2문장으로 짧게 작성하세요.

결과는 다음 형태의 순수 JSON 배열로만 출력하세요. 다른 설명은 제외합니다.
[
  {
    "title": "도서 제목",
    "author": "저자명",
    "reason": "추천 이유"
  }
]`;

    const responseText = await generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `현재 책: "${currentBookTitle}"\n${tagStr}\n\n이어서 읽기 좋은 책 3권을 추천해줘.` }
      ],
      temperature: 0.6,
      maxTokens: 500,
    });

    let recommendations = [];
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      recommendations = JSON.parse(cleaned);
      if (!Array.isArray(recommendations)) recommendations = [];
    } catch (e) {
      console.warn('AI 도서 추천 파싱 실패:', responseText);
    }

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error: unknown) {
    console.error('AI 도서 추천 에러:', error);
    const msg = error instanceof Error ? error.message : '알 수 없는 서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
