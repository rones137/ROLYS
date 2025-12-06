export type MediaCategory = 'Anime' | 'Manga' | 'Light Novel' | 'Manhwa' | 'Manhua';

export interface AnimeData {
  mal_id: number;
  anilist_id?: number;
  title: string;
  title_english?: string;
  title_native?: string;
  mediaType?: 'ANIME' | 'MANGA';
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
    webp?: {
      image_url: string;
      large_image_url: string;
    };
  };
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  synopsis?: string;
  genres?: Array<{ mal_id: number; name: string }>;
  type?: string;
  episodes?: number;
  chapters?: number;
  volumes?: number;
  status?: string;
  aired?: {
    from?: string;
    to?: string;
    string?: string;
  };
  season?: string;
  year?: number;
  studios?: Array<{ mal_id: number; name: string }>;
  rating?: string;
  trailer?: {
    youtube_id?: string;
    url?: string;
  };
}

export interface MyListItem extends AnimeData {
  addedAt: number;
  watchStatus: 'watching' | 'completed' | 'plan-to-watch' | 'dropped' | 'on-hold';
  userRating?: number;
  progress?: number;
  category: MediaCategory;
  genre?: string;
  userRank?: number;
  notes?: string;
}

export interface SearchFilters {
  type?: 'tv' | 'movie' | 'ova' | 'special' | 'ona' | 'music';
  status?: 'airing' | 'complete' | 'upcoming';
  rating?: string;
  genres?: number[];
  min_score?: number;
  order_by?: 'mal_id' | 'title' | 'start_date' | 'end_date' | 'score' | 'scored_by' | 'rank' | 'popularity' | 'members';
  sort?: 'asc' | 'desc';
}

export const CATEGORIES: MediaCategory[] = ['Anime', 'Manga', 'Light Novel', 'Manhwa', 'Manhua'];

export const GENRES_MAP: Record<MediaCategory, string[]> = {
  'Anime': ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Mecha', 'Music', 'Psychological'],
  'Manga': ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Shounen', 'Shoujo', 'Seinen', 'Josei'],
  'Light Novel': ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Isekai', 'Harem', 'Supernatural'],
  'Manhwa': ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Martial Arts', 'School Life', 'Supernatural'],
  'Manhua': ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Martial Arts', 'Cultivation', 'Supernatural'],
};

export const WATCH_STATUSES = [
  { value: 'watching', label: 'Watching/Reading' },
  { value: 'completed', label: 'Completed' },
  { value: 'plan-to-watch', label: 'Plan to Watch/Read' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'dropped', label: 'Dropped' },
] as const;
