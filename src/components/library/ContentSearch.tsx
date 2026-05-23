'use client';
// 알라딘(도서) + TMDB(영화) 병렬 검색 및 서재/영화관 추가 통합 모달

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { AladinBookItem, TmdbMovieItem, AniListMediaItem } from '@/types';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZE, TMDB_BACKDROP_SIZE } from '@/types/tmdb';
import { addBookToLibrary } from '@/app/dashboard/actions';
import { addMovieToLibrary } from '@/app/dashboard/movie-actions';
import { addAnimeToLibrary } from '@/app/dashboard/anime-actions';
import { getColorSync } from 'colorthief';
import { useRouter } from 'next/navigation';

interface ContentSearchProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string;
}

type SearchTab = 'BOOK' | 'MOVIE' | 'ANIME';

export default function ContentSearch({ isOpen, onClose, folderId }: ContentSearchProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('BOOK');
  const [bookResults, setBookResults] = useState<AladinBookItem[]>([]);
  const [movieResults, setMovieResults] = useState<TmdbMovieItem[]>([]);
  const [animeResults, setAnimeResults] = useState<AniListMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // 병렬 비동기 호출
      const [bookRes, movieRes, animeRes] = await Promise.all([
        fetch(`/api/aladin?query=${encodeURIComponent(searchQuery)}&maxResults=10`),
        fetch(`/api/tmdb?query=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/anilist?query=${encodeURIComponent(searchQuery)}`)
      ]);

      const bookJson = await bookRes.json();
      const movieJson = await movieRes.json();
      const animeJson = await animeRes.json();
      
      if (bookJson.success) {
        setBookResults(bookJson.data?.item || []);
      } else {
        showToast(bookJson.message || '도서 검색 실패', 'error');
      }

      if (movieJson.success) {
        setMovieResults(movieJson.data?.results || []);
      } else {
        showToast(movieJson.message || '영화 검색 실패', 'error');
      }

      if (animeJson.success) {
        setAnimeResults(animeJson.data?.data?.Page?.media || []);
      } else {
        showToast(animeJson.message || '애니 검색 실패', 'error');
      }
    } catch (error) {
      showToast('검색 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const extractDominantColor = (imageUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const color = getColorSync(img);
          resolve(color ? color.hex() : null);
        };
        img.onerror = () => resolve(null);
        img.src = imageUrl;
      } catch (e) {
        resolve(null);
      }
    });
  };

  const handleAddBook = async (book: AladinBookItem) => {
    setAddingId(`BOOK_${book.isbn13}`);
    
    try {
      let tocData = null;
      try {
        const detailRes = await fetch(`/api/aladin/${book.isbn13}`);
        const detailJson = await detailRes.json();
        if (detailJson.success && detailJson.data?.subInfo?.toc) {
          tocData = { raw: detailJson.data.subInfo.toc };
        }
      } catch (e) {
        console.warn('TOC 패치 실패, 기본 정보로 추가 진행', e);
      }

      const result = await addBookToLibrary(
        book.isbn13,
        {
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          cover_url: book.cover,
          category: book.categoryName,
          aladin_toc: tocData,
        },
        folderId
      );

      if (result.success) {
        showToast(result.message, 'success');
        onClose();
        if (result.data) {
          router.push(`/dashboard/book/${result.data}`);
        }
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('도서 추가 중 오류가 발생했습니다.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleAddMovie = async (movie: TmdbMovieItem) => {
    setAddingId(`MOVIE_${movie.id}`);
    
    try {
      // 상세 정보 가져와서 장르 문자열, 감독 등 구성
      let director = null;
      let runtime = null;
      let genreString = null;
      try {
        const detailRes = await fetch(`/api/tmdb/${movie.id}`);
        const detailJson = await detailRes.json();
        if (detailJson.success && detailJson.data) {
          const d = detailJson.data;
          runtime = d.runtime;
          genreString = d.genres?.map((g: any) => g.name).join(', ');
          const dirObj = d.credits?.crew?.find((c: any) => c.job === 'Director');
          if (dirObj) director = dirObj.name;
        }
      } catch(e) {
        console.warn('TMDB 상세 패치 실패', e);
      }

      const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${movie.poster_path}` : null;
      const backdropUrl = movie.backdrop_path ? `${TMDB_IMAGE_BASE}/${TMDB_BACKDROP_SIZE}${movie.backdrop_path}` : null;

      const result = await addMovieToLibrary(
        movie.id,
        {
          title: movie.title,
          original_title: movie.original_title,
          director: director,
          poster_url: posterUrl,
          backdrop_url: backdropUrl,
          genre: genreString,
          release_date: movie.release_date,
          runtime_min: runtime,
          overview: movie.overview,
          metadata: {
            vote_average: movie.vote_average
          }
        },
        folderId
      );

      if (result.success) {
        showToast(result.message, 'success');
        onClose();
        if (result.data) {
          router.push(`/dashboard/movie/${result.data}`);
        }
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('영화 추가 중 오류가 발생했습니다.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleAddAnime = async (anime: AniListMediaItem) => {
    setAddingId(`ANIME_${anime.id}`);
    
    try {
      const directorEdge = anime.staff?.edges.find(e => e.role.toLowerCase().includes('director'));
      const director = directorEdge ? directorEdge.node.name.full : null;

      const result = await addAnimeToLibrary(
        anime.id,
        {
          title: anime.title.romaji || anime.title.english || anime.title.native || 'Unknown',
          original_title: anime.title.native,
          director: director,
          poster_url: anime.coverImage.large || anime.coverImage.extraLarge,
          backdrop_url: anime.bannerImage,
          genre: anime.genres.join(', '),
          release_date: anime.startDate.year ? `${anime.startDate.year}-${String(anime.startDate.month || 1).padStart(2, '0')}-${String(anime.startDate.day || 1).padStart(2, '0')}` : null,
          runtime_min: anime.duration,
          overview: anime.description,
          metadata: {
            episodes: anime.episodes,
            averageScore: anime.averageScore,
          }
        },
        folderId
      );

      if (result.success) {
        showToast(result.message, 'success');
        onClose();
        if (result.data) {
          router.push(`/dashboard/anime/${result.data}`);
        }
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('애니메이션 추가 중 오류가 발생했습니다.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const renderBookItem = (book: AladinBookItem, index: number) => (
    <div
      key={book.isbn13 || book.isbn || String(index)}
      onClick={() => {
        onClose();
        router.push(`/dashboard/book/${book.isbn13 || book.isbn}`);
      }}
      className="hover-bg card-glow"
      style={{
        display: 'flex',
        gap: '16px',
        padding: '12px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        transition: 'all var(--transition-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      <img
        src={book.cover}
        alt={book.title}
        style={{ width: '60px', height: '88px', objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {book.title}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {book.author} · {book.publisher} ({book.pubDate})
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }} className="line-clamp-1">
            {book.categoryName}
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="sm"
            isLoading={addingId === `BOOK_${book.isbn13}`}
            disabled={addingId !== null}
            onClick={(e) => { e.stopPropagation(); handleAddBook(book); }}
          >
            + 위시리스트 추가
          </Button>
        </div>
      </div>
    </div>
  );

  const renderMovieItem = (movie: TmdbMovieItem) => {
    const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${movie.poster_path}` : '/img/3.png';
    return (
      <div
        key={movie.id}
        onClick={() => {
          onClose();
          router.push(`/dashboard/movie/${movie.id}`);
        }}
        className="hover-bg card-glow"
        style={{
          display: 'flex',
          gap: '16px',
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          transition: 'all var(--transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
      >
        <img
          src={posterUrl}
          alt={movie.title}
          style={{ width: '60px', height: '88px', objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {movie.title} <span style={{fontSize:'12px', color:'var(--text-tertiary)'}}>({movie.release_date?.substring(0,4)})</span>
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="line-clamp-1">
              {movie.original_title}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }} className="line-clamp-2">
              {movie.overview}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>⭐ {movie.vote_average.toFixed(1)}</span>
            <Button
              size="sm"
              isLoading={addingId === `MOVIE_${movie.id}`}
              disabled={addingId !== null}
              onClick={(e) => { e.stopPropagation(); handleAddMovie(movie); }}
            >
              + 위시리스트 추가
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnimeItem = (anime: AniListMediaItem) => {
    const posterUrl = anime.coverImage.large || anime.coverImage.extraLarge || '/img/3.png';
    const title = anime.title.romaji || anime.title.english || anime.title.native || 'Unknown';
    return (
      <div
        key={anime.id}
        onClick={() => {
          onClose();
          router.push(`/dashboard/anime/${anime.id}`);
        }}
        className="hover-bg card-glow"
        style={{
          display: 'flex',
          gap: '16px',
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          transition: 'all var(--transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
      >
        <img
          src={posterUrl}
          alt={title}
          style={{ width: '60px', height: '88px', objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {title} <span style={{fontSize:'12px', color:'var(--text-tertiary)'}}>({anime.startDate.year})</span>
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="line-clamp-1">
              {anime.title.native}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }} className="line-clamp-2" dangerouslySetInnerHTML={{ __html: anime.description || '' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>⭐ {anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}</span>
            <Button
              size="sm"
              isLoading={addingId === `ANIME_${anime.id}`}
              disabled={addingId !== null}
              onClick={(e) => { e.stopPropagation(); handleAddAnime(anime); }}
            >
              + 위시리스트 추가
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="콘텐츠 탐색" maxWidth="700px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 검색창 */}
        <SearchInput
          placeholder="제목, 저자, 감독 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={handleSearch}
          autoFocus
        />

        {/* 탭 네비게이션 */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: '24px' }}>
          <button
            onClick={() => setActiveTab('BOOK')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 4px',
              fontSize: '14px',
              fontWeight: activeTab === 'BOOK' ? 600 : 400,
              color: activeTab === 'BOOK' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'BOOK' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >
            📚 도서 ({bookResults.length})
          </button>
          <button
            onClick={() => setActiveTab('MOVIE')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 4px',
              fontSize: '14px',
              fontWeight: activeTab === 'MOVIE' ? 600 : 400,
              color: activeTab === 'MOVIE' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'MOVIE' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >
            🎬 영화 ({movieResults.length})
          </button>
          <button
            onClick={() => setActiveTab('ANIME')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 4px',
              fontSize: '14px',
              fontWeight: activeTab === 'ANIME' ? 600 : 400,
              color: activeTab === 'ANIME' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'ANIME' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >
            🌸 애니 ({animeResults.length})
          </button>
        </div>

        {/* 로딩 표시 */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
            검색 중...
          </div>
        )}

        {/* 결과 목록 */}
        {!isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
            {activeTab === 'BOOK' && bookResults.length === 0 && query && (
               <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>도서 검색 결과가 없습니다.</div>
            )}
            {activeTab === 'MOVIE' && movieResults.length === 0 && query && (
               <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>영화 검색 결과가 없습니다.</div>
            )}
            {activeTab === 'ANIME' && animeResults.length === 0 && query && (
               <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>애니 검색 결과가 없습니다.</div>
            )}

            {activeTab === 'BOOK' && bookResults.map(renderBookItem)}
            {activeTab === 'MOVIE' && movieResults.map(renderMovieItem)}
            {activeTab === 'ANIME' && animeResults.map(renderAnimeItem)}
          </div>
        )}
      </div>
    </Modal>
  );
}
