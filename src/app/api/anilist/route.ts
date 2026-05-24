import { NextResponse } from 'next/server';

const ANILIST_API_URL = 'https://graphql.anilist.co';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';

  if (!query) {
    return NextResponse.json(
      { success: false, message: '검색어가 필요합니다.' },
      { status: 400 }
    );
  }

  const graphqlQuery = `
    query ($page: Int, $perPage: Int, $search: String) {
      Page (page: $page, perPage: $perPage) {
        media (search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          bannerImage
          genres
          startDate {
            year
            month
            day
          }
          duration
          description
          averageScore
          episodes
          staff {
            edges {
              role
              node {
                name {
                  full
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    search: query,
    page: parseInt(page),
    perPage: 10
  };

  try {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables
      }),
      cache: 'force-cache',
      next: { tags: ['search', 'recommendations'] }
    });

    if (!res.ok) {
      if (res.status === 429) {
        return NextResponse.json({ success: false, message: 'AniList API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요. (429)' }, { status: 429 });
      }
      throw new Error(`AniList API 에러: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('AniList API 에러:', error);
    const msg = error instanceof Error ? error.message : '서버 오류';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
