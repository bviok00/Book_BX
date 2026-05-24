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
    let recommended: any[] = [];

    // 1. 작가 기반 검색 (동일 저자의 다른 인기작 우선)
    if (author) {
      const authorName = author.split('(')[0].split(',')[0].trim();
      if (authorName) {
        const url = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
        url.searchParams.append('ttbkey', ALADIN_TTB_KEY);
        url.searchParams.append('Query', authorName);
        url.searchParams.append('QueryType', 'Author');
        url.searchParams.append('MaxResults', '10');
        url.searchParams.append('start', '1');
        url.searchParams.append('SearchTarget', 'Book');
        url.searchParams.append('output', 'js');
        url.searchParams.append('Version', '20131101');
        url.searchParams.append('Sort', 'SalesPoint'); // 판매량 순 정렬
        url.searchParams.append('OptResult', 'ebookList,usedList,reviewList');
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          if (data.item) {
            // 현재 책 제외
            recommended = data.item.filter((item: any) => item.isbn13 !== isbn && item.isbn !== isbn);
          }
        }
      }
    }
    
    // 2. 작가 책이 충분하지 않으면 카테고리(키워드) 기반 베스트셀러 추가
    if (recommended.length < 15 && categoryName) {
      const parts = categoryName.split('>');
      const keyword = parts[parts.length - 1].trim();
      
      if (keyword && keyword !== '국내도서' && keyword !== '외국도서') {
        const url = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
        url.searchParams.append('ttbkey', ALADIN_TTB_KEY);
        url.searchParams.append('Query', keyword);
        url.searchParams.append('QueryType', 'Keyword');
        url.searchParams.append('MaxResults', '15');
        url.searchParams.append('start', '1');
        url.searchParams.append('SearchTarget', 'Book');
        url.searchParams.append('output', 'js');
        url.searchParams.append('Version', '20131101');
        url.searchParams.append('Sort', 'SalesPoint'); // 판매량 순 정렬 (이상한 책 방지)
        url.searchParams.append('OptResult', 'ebookList,usedList,reviewList');
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          if (data.item) {
            const newItems = data.item.filter((item: any) => 
              item.isbn13 !== isbn && 
              item.isbn !== isbn && 
              !recommended.some(r => r.isbn13 === item.isbn13)
            );
            recommended = [...recommended, ...newItems];
          }
        }
      }
    }
    
    if (recommended.length > 0) {
      return { success: true, data: recommended.slice(0, 15) };
    }
  } catch (error) {
    console.error('getSimilarBooks error:', error);
  }
  
  return { success: false, data: [] };
}
