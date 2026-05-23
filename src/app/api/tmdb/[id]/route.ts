import { NextResponse } from 'next/server';
import type { TmdbMovieDetail } from '@/types/tmdb';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'TMDB API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const { id: tmdbId } = await params;
  if (!tmdbId) {
    return NextResponse.json(
      { success: false, message: '영화 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    // credits(출연진, 제작진) 정보도 함께 가져옴
    const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'ko-KR');
    url.searchParams.append('append_to_response', 'credits');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`TMDB 상세 조회 응답 오류: ${response.status}`);
    }

    const data: TmdbMovieDetail = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('TMDB 상세 조회 API 에러:', error);
    const msg = error instanceof Error ? error.message : '알 수 없는 서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
