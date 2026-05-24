'use server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY;
const ANILIST_API_URL = 'https://graphql.anilist.co';

export async function getSimilarMovies(tmdbId: string) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/recommendations?api_key=${TMDB_API_KEY}&language=ko-KR&page=1`);
    if (res.ok) {
      const data = await res.json();
      return { success: true, data: data.results || [] };
    }
  } catch (error) {
    console.error('getSimilarMovies error:', error);
  }
  return { success: false, data: [] };
}

export async function getSimilarAnimes(anilistId: string) {
  try {
    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          recommendations(page: 1, perPage: 15) {
            nodes {
              mediaRecommendation {
                id
                title { romaji english native }
                coverImage { large extraLarge }
                bannerImage
                genres
                startDate { year month day }
                duration
                description
                averageScore
                episodes
              }
            }
          }
        }
      }
    `;
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { id: parseInt(anilistId) } })
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, data: data.data?.Media?.recommendations?.nodes?.map((n: any) => n.mediaRecommendation).filter(Boolean) || [] };
    }
  } catch (error) {
    console.error('getSimilarAnimes error:', error);
  }
  return { success: false, data: [] };
}

export async function getSimilarBooks(isbn: string, categoryName: string | null, author: string | null) {
  if (!ALADIN_TTB_KEY) return { success: false, data: [] };
  
  try {
    // 1. 카테고리 기반 검색
    let keyword = '';
    if (categoryName) {
      const parts = categoryName.split('>');
      keyword = parts[parts.length - 1].trim();
    }
    
    if (keyword) {
      const url = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
      url.searchParams.append('ttbkey', ALADIN_TTB_KEY);
      url.searchParams.append('Query', keyword);
      url.searchParams.append('QueryType', 'Keyword');
      url.searchParams.append('MaxResults', '15');
      url.searchParams.append('start', '1');
      url.searchParams.append('SearchTarget', 'Book');
      url.searchParams.append('output', 'js');
      url.searchParams.append('Version', '20131101');
      url.searchParams.append('OptResult', 'ebookList,usedList,reviewList');
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.item && data.item.length > 0) {
          return { success: true, data: data.item };
        }
      }
    }
    
    // 2. 카테고리가 없거나 결과가 없으면 작가 검색
    if (author) {
      const authorName = author.split('(')[0].split(',')[0].trim();
      if (authorName) {
        const url = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
        url.searchParams.append('ttbkey', ALADIN_TTB_KEY);
        url.searchParams.append('Query', authorName);
        url.searchParams.append('QueryType', 'Author');
        url.searchParams.append('MaxResults', '15');
        url.searchParams.append('start', '1');
        url.searchParams.append('SearchTarget', 'Book');
        url.searchParams.append('output', 'js');
        url.searchParams.append('Version', '20131101');
        url.searchParams.append('OptResult', 'ebookList,usedList,reviewList');
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          if (data.item && data.item.length > 0) {
            return { success: true, data: data.item };
          }
        }
      }
    }
  } catch (error) {
    console.error('getSimilarBooks error:', error);
  }
  
  return { success: false, data: [] };
}
