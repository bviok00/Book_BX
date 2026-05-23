import { NextResponse } from 'next/server';
import type { TmdbSearchResponse } from '@/types/tmdb';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(request: Request) {
  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'TMDB API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';

  if (!query) {
    return NextResponse.json(
      { success: false, message: '검색어가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    // 1. 키워드 검색 시도
    const keywordUrl = new URL('https://api.themoviedb.org/3/search/keyword');
    keywordUrl.searchParams.append('api_key', TMDB_API_KEY);
    keywordUrl.searchParams.append('query', query);
    keywordUrl.searchParams.append('page', '1');

    let discoverResults: any[] = [];
    try {
      const keywordRes = await fetch(keywordUrl.toString());
      const keywordData = await keywordRes.json();
      if (keywordData.results && keywordData.results.length > 0) {
        const keywordId = keywordData.results[0].id;
        const discoverUrl = new URL('https://api.themoviedb.org/3/discover/movie');
        discoverUrl.searchParams.append('api_key', TMDB_API_KEY);
        discoverUrl.searchParams.append('with_keywords', String(keywordId));
        discoverUrl.searchParams.append('language', 'ko-KR');
        discoverUrl.searchParams.append('sort_by', 'popularity.desc');
        const discoverRes = await fetch(discoverUrl.toString());
        const discoverJson = await discoverRes.json();
        if (discoverJson.results) {
          discoverResults = discoverJson.results;
        }
      }
    } catch (e) {
      console.error('TMDB keyword search error', e);
    }

    // 2. 제목 직접 검색 (기본 검색)
    const searchUrl = new URL('https://api.themoviedb.org/3/search/movie');
    searchUrl.searchParams.append('api_key', TMDB_API_KEY);
    searchUrl.searchParams.append('query', query);
    searchUrl.searchParams.append('language', 'ko-KR');
    searchUrl.searchParams.append('page', page);
    searchUrl.searchParams.append('include_adult', 'false');

    const searchRes = await fetch(searchUrl.toString());
    
    if (!searchRes.ok) {
      throw new Error(`TMDB API 응답 오류: ${searchRes.status}`);
    }

    const searchData: TmdbSearchResponse = await searchRes.json();
    
    // 3. 두 결과 병합 및 중복 제거
    const combined = [...(searchData.results || []), ...discoverResults];
    const uniqueResults = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    return NextResponse.json({ success: true, data: { ...searchData, results: uniqueResults } });
  } catch (error: unknown) {
    console.error('TMDB 검색 API 에러:', error);
    const msg = error instanceof Error ? error.message : '알 수 없는 서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
