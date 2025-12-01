export interface AnimeData {
  mal_id: number;
  title: string;
  title_english?: string;
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
  watchStatus: 'watching' | 'completed' | 'plan-to-watch' | 'dropped';
  userRating?: number;
  progress?: number;
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
