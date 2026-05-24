import { NextResponse } from 'next/server';
import type { AladinSearchResponse } from '@/types';

const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY;

export async function GET(request: Request) {
  if (!ALADIN_TTB_KEY) {
    return NextResponse.json(
      { success: false, message: '알라딘 API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'Keyword'; // Keyword, Title, Author, Publisher
  const maxResults = searchParams.get('maxResults') || '10';
  const start = searchParams.get('start') || '1';

  if (!query) {
    return NextResponse.json(
      { success: false, message: '검색어가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    const url = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
    url.searchParams.append('ttbkey', ALADIN_TTB_KEY);
    url.searchParams.append('Query', query);
    url.searchParams.append('QueryType', type);
    url.searchParams.append('MaxResults', maxResults);
    url.searchParams.append('start', start);
    url.searchParams.append('SearchTarget', 'Book');
    url.searchParams.append('output', 'js'); // JSON 포맷 요청
    url.searchParams.append('Version', '20131101');
    // ISBN13을 ItemIdType으로 지정해야 cover_url 등에서 고품질 커버 확보 용이
    url.searchParams.append('OptResult', 'ebookList,usedList,reviewList');

    const response = await fetch(url.toString(), { cache: 'force-cache', next: { tags: ['search', 'recommendations'] } });
    
    if (!response.ok) {
      throw new Error(`알라딘 API 응답 오류: ${response.status}`);
    }

    const data: AladinSearchResponse = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('알라딘 검색 API 에러:', error);
    const msg = error instanceof Error ? error.message : '알 수 없는 서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
