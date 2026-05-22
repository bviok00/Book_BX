import { NextResponse } from 'next/server';

const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  if (!ALADIN_TTB_KEY) {
    return NextResponse.json(
      { success: false, message: '알라딘 API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const { isbn } = await params;

  if (!isbn) {
    return NextResponse.json(
      { success: false, message: 'ISBN 값이 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    const url = new URL('http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx');
    url.searchParams.append('ttbkey', ALADIN_TTB_KEY);
    url.searchParams.append('itemIdType', 'ISBN13'); // ISBN13 기준 검색
    url.searchParams.append('ItemId', isbn);
    url.searchParams.append('output', 'js'); // JSON 포맷 요청
    url.searchParams.append('Version', '20131101');
    url.searchParams.append('OptResult', 'toc,packing,authors'); // 목차(toc) 요청

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`알라딘 API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    // 알라딘 API는 결과가 없으면 errorCode를 반환하거나 빈 배열을 반환함
    if (data.errorCode) {
      throw new Error(data.errorMessage);
    }
    
    const item = data.item?.[0];
    if (!item) {
      return NextResponse.json(
        { success: false, message: '도서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: unknown) {
    console.error('알라딘 상세 조회 API 에러:', error);
    const msg = error instanceof Error ? error.message : '알 수 없는 서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
