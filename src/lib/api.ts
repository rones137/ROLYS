import { AnimeData, SearchFilters } from "@/types/anime";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

const getCachedData = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
};

const setCachedData = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Rate limiting helper (Jikan has a rate limit of 3 requests/second, 60 requests/minute)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 350; // ~3 requests per second

const waitForRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
};

const fetchWithRetry = async <T>(url: string, retries = 3): Promise<T> => {
  const cacheKey = url;
  const cached = getCachedData<T>(cacheKey);
  if (cached) return cached;

  await waitForRateLimit();

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        // Rate limited, wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw new Error("Max retries reached");
};

export const getTopAnime = async (page = 1, filter?: string): Promise<{ data: AnimeData[]; pagination: any }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '25',
  });
  
  if (filter) params.append('filter', filter);
  
  return fetchWithRetry(`${JIKAN_BASE_URL}/top/anime?${params}`);
};

export const getSeasonNow = async (): Promise<{ data: AnimeData[] }> => {
  return fetchWithRetry(`${JIKAN_BASE_URL}/seasons/now?limit=25`);
};

export const getSeasonUpcoming = async (): Promise<{ data: AnimeData[] }> => {
  return fetchWithRetry(`${JIKAN_BASE_URL}/seasons/upcoming?limit=25`);
};

export const searchAnime = async (query: string, filters?: SearchFilters): Promise<{ data: AnimeData[] }> => {
  const params = new URLSearchParams({
    q: query,
    limit: '25',
    sfw: 'true',
  });
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  return fetchWithRetry(`${JIKAN_BASE_URL}/anime?${params}`);
};

export const getAnimeById = async (id: number): Promise<{ data: AnimeData }> => {
  return fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}`);
};

export const getAnimeRecommendations = async (id: number): Promise<{ data: Array<{ entry: AnimeData }> }> => {
  return fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}/recommendations`);
};

export const getAnimeByGenre = async (genreId: number, page = 1): Promise<{ data: AnimeData[] }> => {
  const params = new URLSearchParams({
    genres: genreId.toString(),
    page: page.toString(),
    limit: '25',
    order_by: 'score',
    sort: 'desc',
  });
  
  return fetchWithRetry(`${JIKAN_BASE_URL}/anime?${params}`);
};

// Genre IDs from MyAnimeList
export const GENRES = {
  ACTION: 1,
  ADVENTURE: 2,
  COMEDY: 4,
  DRAMA: 8,
  FANTASY: 10,
  HORROR: 14,
  ROMANCE: 22,
  SCIFI: 24,
  SLICE_OF_LIFE: 36,
  SPORTS: 30,
  SUPERNATURAL: 37,
  THRILLER: 41,
};
