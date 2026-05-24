import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnimeDetailHero from '@/components/library/AnimeDetailHero';
import AnimeTagsEditor from '@/components/library/AnimeTagsEditor';
import AnimeNotesFeed from '@/components/library/AnimeNotesFeed';
import MovieMediaSection from '@/components/library/MovieMediaSection';
import SimilarRecommendationsClient from '@/components/library/SimilarRecommendationsClient';

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const userAnimeId = resolvedParams.id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userAnimeId);
  
  let userAnimeQuery = supabase.from('user_animes').select(`
    *,
    animes (*),
    folders (id, name),
    anime_tags (tags (id, name))
  `).eq('user_id', user.id);

  if (isUuid) {
    userAnimeQuery = userAnimeQuery.eq('id', userAnimeId);
  } else {
    userAnimeQuery = userAnimeQuery.eq('anilist_id', parseInt(userAnimeId, 10));
  }

  const [userAnimeRes, foldersRes, profileRes] = await Promise.all([
    userAnimeQuery.single(),
    supabase.from('folders').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('profiles').select('*').eq('id', user.id).single()
  ]);

  let userAnime = userAnimeRes.data;
  let anime = userAnime?.animes;
  let profile = profileRes.data;
  let isReadOnly = false;

  // 서재에 없는 경우 (읽기 전용 모드: AniList 검색)
  if (!userAnime && !isUuid) {
    isReadOnly = true;
    const anilistQuery = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
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
          trailer {
            id
            site
            thumbnail
          }
          recommendations(page: 1, perPage: 15) {
            nodes {
              mediaRecommendation {
                id
                title {
                  romaji
                  english
                  native
                }
                coverImage {
                  large
                }
              }
            }
          }
        }
      }
    `;

    try {
      const anilistRes = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: anilistQuery,
          variables: { id: parseInt(userAnimeId, 10) }
        })
      });

      if (anilistRes.ok) {
        const json = await anilistRes.json();
        const m = json.data?.Media;
        if (m) {
          const directorEdge = m.staff?.edges.find((e: any) => e.role.toLowerCase().includes('director'));
          const director = directorEdge ? directorEdge.node.name.full : null;

          anime = {
            anilist_id: m.id,
            title: m.title.romaji || m.title.english || m.title.native || 'Unknown',
            original_title: m.title.native,
            director: director,
            poster_url: m.coverImage?.large || m.coverImage?.extraLarge,
            backdrop_url: m.bannerImage,
            genre: m.genres?.join(', ') || null,
            release_date: m.startDate?.year ? `${m.startDate.year}-${String(m.startDate.month || 1).padStart(2, '0')}-${String(m.startDate.day || 1).padStart(2, '0')}` : null,
            runtime_min: m.duration,
            overview: m.description,
            metadata: {
              episodes: m.episodes,
              averageScore: m.averageScore,
            }
          };
          userAnime = {
            id: 'readonly',
            user_id: user.id,
            anilist_id: m.id,
            status: 'NONE',
            progress_pct: 0,
            rating: 0,
              granular_notes: [],
            anime_tags: []
          };
          anime.metadata = {
            ...anime.metadata,
            trailer: m.trailer,
            recommendations: m.recommendations
          };
        }
      }
    } catch (e) {
      console.error('AniList detail fetch error:', e);
    }
  }

  const folders = foldersRes.data || [];
  let anilistMedia = null;

  // 서재에 등록된 애니메이션이라도 추가 데이터(트레일러, 추천)를 위해 Anilist 패치
  if (userAnime && !isReadOnly) {
    const anilistQuery = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          trailer {
            id
            site
            thumbnail
          }
          recommendations(page: 1, perPage: 15) {
            nodes {
              mediaRecommendation {
                id
                title {
                  romaji
                  english
                  native
                }
                coverImage {
                  large
                }
              }
            }
          }
        }
      }
    `;
    try {
      const anilistRes = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: anilistQuery, variables: { id: userAnime.anilist_id } })
      });
      if (anilistRes.ok) {
        const json = await anilistRes.json();
        anilistMedia = json.data?.Media;
      }
    } catch (e) {
      console.error('AniList extra fetch error:', e);
    }
  } else if (isReadOnly) {
    // isReadOnly일 경우, 이미 패치한 데이터를 쓰기 위해, 원래 패치 코드를 수정할 필요 없이 여기서 임시 처리하지만,
    // 위에서 m을 scope 밖으로 빼기 귀찮으므로, 다시 패치하진 않고 위 코드에서 담은 변수를 쓰기 위해 m을 저장해야 함.
    // 위 코드에서 metadata에 통째로 넣거나 하자.
  }

  if (!userAnime || !anime) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">애니메이션을 찾을 수 없습니다.</div>;
  }

  // 트레일러 및 추천 데이터 추출
  const trailerData = anime.metadata?.trailer || anilistMedia?.trailer;
  const recommendationsData = anime.metadata?.recommendations || anilistMedia?.recommendations;

  const videos = trailerData?.site === 'youtube' && trailerData?.id ? [{
    id: trailerData.id,
    key: trailerData.id,
    site: 'YouTube',
    name: 'Trailer',
    type: 'Trailer'
  }] : [];

  const recommendedItems = (recommendationsData?.nodes || [])
    .filter((n: any) => n.mediaRecommendation)
    .map((n: any) => {
      const m = n.mediaRecommendation;
      return {
        id: `ANIME_${m.id}`,
        type: 'ANIME',
        title: m.title.romaji || m.title.english || m.title.native,
        creator: m.title.native,
        posterUrl: m.coverImage?.large,
        originalData: m
      };
    });

  // Fetch notes separately until the DB schema migration is run, to avoid page crashing
  const { data: notesData } = await supabase
    .from('granular_notes')
    .select('*, note_tags (tags (id, name))')
    .eq('user_anime_id', userAnime.id)
    .order('created_at', { ascending: true });

  const notes = notesData || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {isReadOnly && (
        <div style={{ backgroundColor: 'rgba(232, 197, 71, 0.1)', border: '1px solid var(--accent)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>읽기 전용 모드</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>이 애니메이션은 아직 위시리스트에 없습니다. 노트와 태그를 작성하려면 서재에 추가해주세요.</p>
          </div>
        </div>
      )}

      <AnimeDetailHero userAnime={userAnime} anime={anime} folders={folders} isReadOnly={isReadOnly} />

      {/* 컨텐츠 영역: 개요 및 정보 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '32px', display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
        
        {/* 개요 정보 및 태그 */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
          {/* 애니 태그 에디터 */}
          <AnimeTagsEditor userAnimeId={userAnime.id} initialTags={userAnime.anime_tags || []} isReadOnly={isReadOnly} />

          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
            개요
          </h2>
          <div className="glass-card" style={{ padding: '24px', maxHeight: '300px', overflowY: 'auto' }}>
            {anime.overview ? (
              <p 
                style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: anime.overview }}
              />
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center' }}>개요 정보가 제공되지 않는 애니메이션입니다.</p>
            )}
          </div>
        </div>

        {/* 마이크로 메모 */}
        <div className="lg:col-span-1">
          {!isReadOnly && <AnimeNotesFeed userAnimeId={userAnime.id} notes={notes} user={user} profile={profile} />}
        </div>
      </div>

      {/* 애니메이션 트레일러 및 미디어 섹션 (하단 Full Width) */}
      {videos.length > 0 && <MovieMediaSection videos={videos} images={anime.backdrop_url ? [{file_path: anime.backdrop_url}] : []} />}

      {/* ── 비슷한 추천 작품 ── */}
      {recommendedItems.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 48px', paddingBottom: '48px' }}>
          <SimilarRecommendationsClient title="이 애니와 비슷한 작품" items={recommendedItems} />
        </div>
      )}
    </div>
  );
}
