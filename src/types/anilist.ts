export interface AniListSearchResponse {
  data: {
    Page: {
      media: AniListMediaItem[];
    }
  }
}

export interface AniListMediaItem {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    large: string | null;
    extraLarge: string | null;
  };
  bannerImage: string | null;
  genres: string[];
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  duration: number | null;
  description: string | null;
  averageScore: number | null;
  episodes: number | null;
  staff?: {
    edges: {
      role: string;
      node: {
        name: {
          full: string;
        }
      }
    }[];
  };
}
