'use client';
// 통합 검색 (TMDB, 알라딘, AniList) 결과를 선택만 하는 모달

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { AladinBookItem, TmdbMovieItem, AniListMediaItem } from '@/types';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZE } from '@/types/tmdb';

interface GlobalSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: { type: 'BOOK' | 'MOVIE' | 'ANIME', id: string, title: string, posterUrl: string }) => void;
}

type SearchTab = 'BOOK' | 'MOVIE' | 'ANIME';

export default function GlobalSelectModal({ isOpen, onClose, onSelect }: GlobalSelectModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('MOVIE');
  const [bookResults, setBookResults] = useState<AladinBookItem[]>([]);
  const [movieResults, setMovieResults] = useState<TmdbMovieItem[]>([]);
  const [animeResults, setAnimeResults] = useState<AniListMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const [bookRes, movieRes, animeRes] = await Promise.all([
        fetch(`/api/aladin?query=${encodeURIComponent(searchQuery)}&maxResults=10`),
        fetch(`/api/tmdb?query=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/anilist?query=${encodeURIComponent(searchQuery)}`)
      ]);

      const bookJson = await bookRes.json();
      const movieJson = await movieRes.json();
      const animeJson = await animeRes.json();
      
      if (bookJson.success) setBookResults(bookJson.data?.item || []);
      if (movieJson.success) setMovieResults(movieJson.data?.results || []);
      if (animeJson.success) setAnimeResults(animeJson.data?.data?.Page?.media || []);
      
    } catch (error) {
      showToast('검색 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBook = (book: AladinBookItem) => {
    onSelect({
      type: 'BOOK',
      id: book.isbn13,
      title: book.title,
      posterUrl: book.cover
    });
    onClose();
  };

  const handleSelectMovie = (movie: TmdbMovieItem) => {
    onSelect({
      type: 'MOVIE',
      id: movie.id.toString(),
      title: movie.title,
      posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${movie.poster_path}` : ''
    });
    onClose();
  };

  const handleSelectAnime = (anime: AniListMediaItem) => {
    onSelect({
      type: 'ANIME',
      id: anime.id.toString(),
      title: anime.title.romaji || anime.title.english || anime.title.native || 'Unknown',
      posterUrl: anime.coverImage.large || anime.coverImage.extraLarge || ''
    });
    onClose();
  };

  const renderBookItem = (book: AladinBookItem, index: number) => (
    <div
      key={book.isbn13 || book.isbn || String(index)}
      onClick={() => handleSelectBook(book)}
      className="hover-bg card-glow"
      style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', alignItems: 'center' }}
    >
      <img src={book.cover} alt={book.title} style={{ width: '60px', height: '85px', objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }} />
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }} className="line-clamp-1">{book.title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }} className="line-clamp-1">{book.author} | {book.publisher}</p>
      </div>
    </div>
  );

  const renderMovieItem = (movie: TmdbMovieItem) => (
    <div
      key={movie.id}
      onClick={() => handleSelectMovie(movie)}
      className="hover-bg card-glow"
      style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', alignItems: 'center' }}
    >
      {movie.poster_path ? (
        <img src={`${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${movie.poster_path}`} alt={movie.title} style={{ width: '60px', height: '85px', objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }} />
      ) : (
        <div style={{ width: '60px', height: '85px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎬</div>
      )}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }} className="line-clamp-1">{movie.title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="line-clamp-1">{movie.original_title}</p>
        {movie.release_date && <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{movie.release_date.split('-')[0]}</p>}
      </div>
    </div>
  );

  const renderAnimeItem = (anime: AniListMediaItem) => (
    <div
      key={anime.id}
      onClick={() => handleSelectAnime(anime)}
      className="hover-bg card-glow"
      style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', alignItems: 'center' }}
    >
      {(anime.coverImage?.large || anime.coverImage?.extraLarge) ? (
        <img src={anime.coverImage.large || anime.coverImage.extraLarge} alt={anime.title.romaji || ''} style={{ width: '60px', height: '85px', objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }} />
      ) : (
        <div style={{ width: '60px', height: '85px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🌸</div>
      )}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }} className="line-clamp-1">{anime.title.romaji || anime.title.english || anime.title.native}</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="line-clamp-1">{anime.title.native}</p>
        {anime.startDate?.year && <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{anime.startDate.year}</p>}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="통합 검색하여 리뷰 쓰기">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <SearchInput
          placeholder="검색어를 입력하세요..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch(query);
          }}
          style={{ flex: 1 }}
        />
        <Button onClick={() => handleSearch(query)} isLoading={isLoading}>검색</Button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
        {(['MOVIE', 'BOOK', 'ANIME'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'MOVIE' ? '🎬 영화' : tab === 'BOOK' ? '📚 도서' : '🌸 애니'}
            <span style={{ marginLeft: '4px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
              ({tab === 'MOVIE' ? movieResults.length : tab === 'BOOK' ? bookResults.length : animeResults.length})
            </span>
          </button>
        ))}
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>검색 중...</div>
        ) : (
          <>
            {activeTab === 'BOOK' && bookResults.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>검색 결과가 없습니다.</div>}
            {activeTab === 'BOOK' && bookResults.map((book, index) => renderBookItem(book, index))}
            
            {activeTab === 'MOVIE' && movieResults.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>검색 결과가 없습니다.</div>}
            {activeTab === 'MOVIE' && movieResults.map(renderMovieItem)}
            
            {activeTab === 'ANIME' && animeResults.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>검색 결과가 없습니다.</div>}
            {activeTab === 'ANIME' && animeResults.map(renderAnimeItem)}
          </>
        )}
      </div>
    </Modal>
  );
}
