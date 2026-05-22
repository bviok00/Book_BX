import { NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/ai/provider';

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json({ success: false, message: '분석할 메모가 없습니다.' }, { status: 400 });
    }

    const mergedNotes = notes.map((n: { content: string, page?: string }, i) => 
      `[메모 ${i+1}${n.page ? ` - p.${n.page}` : ''}] ${n.content}`
    ).join('\n\n');

    const systemPrompt = `당신은 독서가의 흩어진 메모들을 모아 하나의 구조적인 총평(Summary) 초안을 작성해주는 어시스턴트입니다.
사용자가 책을 읽으며 남긴 파편화된 메모들을 바탕으로, 이 책에서 사용자가 얻은 핵심 인사이트와 감상을 3단락으로 정리해주세요.
어조는 전문가적이면서도 개인적인 회고 느낌이 나게 해주세요.
(※ 주의: 책 전체 줄거리 요약이 아니라, '사용자의 메모'에 드러난 생각과 감상을 중심으로 요약해야 합니다.)`;

    // SSE 스트리밍이 베스트이나, 현재 provider 추상화가 단순 텍스트 완성이므로 일단 일반 응답
    // TODO: 향후 스트리밍 지원을 위해 provider.ts에 streamCompletion 추가 필요
    const responseText = await generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `다음 메모들을 바탕으로 총평 초안을 작성해줘:\n\n${mergedNotes}` }
      ],
      temperature: 0.7,
      maxTokens: 1500,
    });

    return NextResponse.json({ success: true, data: responseText });
  } catch (error: unknown) {
    console.error('AI 총평 초안 생성 에러:', error);
    const msg = error instanceof Error ? error.message : '알 수 없는 서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
