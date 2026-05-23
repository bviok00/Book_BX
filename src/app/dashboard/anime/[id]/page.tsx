import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnimeDetailHero from '@/components/library/AnimeDetailHero';
import AnimeTagsEditor from '@/components/library/AnimeTagsEditor';
import AnimeNotesFeed from '@/components/library/AnimeNotesFeed';
import MovieMediaSection from '@/components/library/MovieMediaSection'; // 미디어 섹션 재사용 가능하면 재사용 (혹은 생략)

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
    anime_tags (tags (id, name)),
    granular_notes (*, note_tags (tags (id, name)))
  `).eq('user_id', user.id);

  if (isUuid) {
    userAnimeQuery = userAnimeQuery.eq('id', userAnimeId);
  } else {
    userAnimeQuery = userAnimeQuery.eq('anilist_id', parseInt(userAnimeId, 10));
  }

  const [userAnimeRes, foldersRes] = await Promise.all([
    userAnimeQuery.single(),
    supabase.from('folders').select('*').eq('user_id', user.id).order('sort_order')
  ]);

  let userAnime = userAnimeRes.data;
  let anime = userAnime?.animes;
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
        }
      }
    } catch (e) {
      console.error('AniList detail fetch error:', e);
    }
  }

  const folders = foldersRes.data || [];

  if (!userAnime || !anime) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">애니메이션을 찾을 수 없습니다.</div>;
  }

  const notes = userAnime.granular_notes || [];

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
          <div className="glass-card" style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
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
        <div style={{ flex: '1 1 400px' }}>
          {!isReadOnly && <AnimeNotesFeed userAnimeId={userAnime.id} notes={notes} user={user} />}
        </div>
      </div>
    </div>
  );
}
