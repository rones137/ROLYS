// AniList API Integration
const ANILIST_URL = "https://graphql.anilist.co";

export type MediaType = 'ANIME' | 'MANGA';

export interface AniListMedia {
  id: number;
  idMal: number | null;
  type: MediaType;
  title: {
    romaji: string;
    english: string | null;
    native: string;
  };
  description: string | null;
  coverImage: {
    large: string;
    medium: string;
    extraLarge: string;
  };
  bannerImage: string | null;
  averageScore: number | null;
  popularity: number;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  status: string;
  season: string | null;
  seasonYear: number | null;
  format: string;
  genres: string[];
  tags: Array<{ name: string; rank: number }>;
  studios: { nodes: Array<{ name: string; isAnimationStudio: boolean }> };
  staff: { nodes: Array<{ id: number; name: { full: string; native: string | null }; image: { medium: string }; primaryOccupations: string[]; description: string | null }> };
  characters: { nodes: Array<{ name: { full: string }; image: { medium: string } }> };
  trailer: { id: string; site: string } | null;
  externalLinks: Array<{ url: string; site: string; icon: string | null; color: string | null }>;
  recommendations: { nodes: Array<{ mediaRecommendation: AniListMedia | null }> };
  relations: { edges: Array<{ relationType: string; node: { id: number; type: MediaType; format: string; title: { romaji: string; english: string | null; native: string }; coverImage: { medium: string } } }> };
  startDate: { year: number | null; month: number | null; day: number | null };
  endDate: { year: number | null; month: number | null; day: number | null };
  nextAiringEpisode: { airingAt: number; episode: number } | null;
  streamingEpisodes: Array<{ title: string; thumbnail: string; url: string; site: string }>;
}

export interface AniListStaff {
  id: number;
  name: {
    full: string;
    native: string | null;
    alternative: string[];
  };
  image: {
    large: string;
    medium: string;
  };
  description: string | null;
  primaryOccupations: string[];
  gender: string | null;
  dateOfBirth: { year: number | null; month: number | null; day: number | null };
  dateOfDeath: { year: number | null; month: number | null; day: number | null };
  age: number | null;
  yearsActive: number[];
  homeTown: string | null;
  bloodType: string | null;
  staffMedia: {
    edges: Array<{
      staffRole: string;
      node: AniListMedia;
    }>;
  };
}

export interface AniListStudio {
  id: number;
  name: string;
  isAnimationStudio: boolean;
  media: {
    nodes: AniListMedia[];
  };
}

// Keep backward compatibility
export type AniListAnime = AniListMedia;

export interface StreamingLink {
  site: string;
  url: string;
  icon?: string | null;
  color?: string | null;
}

export interface SearchResult {
  anime: AniListMedia[];
  manga: AniListMedia[];
  novels: AniListMedia[];
}

const mediaQuery = `
query ($id: Int, $search: String, $page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $format: MediaFormat, $genre: String, $type: MediaType, $format_in: [MediaFormat]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    media(id: $id, search: $search, type: $type, sort: $sort, season: $season, seasonYear: $seasonYear, status: $status, format: $format, genre: $genre, format_in: $format_in) {
      id
      idMal
      type
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      coverImage {
        large
        medium
        extraLarge
      }
      bannerImage
      averageScore
      popularity
      episodes
      chapters
      volumes
      status
      season
      seasonYear
      format
      genres
      tags {
        name
        rank
      }
      studios {
        nodes {
          name
          isAnimationStudio
        }
      }
      staff(perPage: 10) {
        nodes {
          id
          name {
            full
            native
          }
          image {
            medium
          }
          primaryOccupations
          description
        }
      }
      characters(perPage: 10) {
        nodes {
          name {
            full
          }
          image {
            medium
          }
        }
      }
      trailer {
        id
        site
      }
      externalLinks {
        url
        site
        icon
        color
      }
      recommendations(perPage: 6) {
        nodes {
          mediaRecommendation {
            id
            type
            title {
              romaji
              english
            }
            coverImage {
              medium
            }
            averageScore
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            type
            format
            title {
              romaji
              english
              native
            }
            coverImage {
              medium
            }
          }
        }
      }
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      nextAiringEpisode {
        airingAt
        episode
      }
      streamingEpisodes {
        title
        thumbnail
        url
        site
      }
    }
  }
}
`;

const staffQuery = `
query ($search: String, $id: Int, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    staff(search: $search, id: $id) {
      id
      name {
        full
        native
        alternative
      }
      image {
        large
        medium
      }
      description
      primaryOccupations
      gender
      dateOfBirth {
        year
        month
        day
      }
      dateOfDeath {
        year
        month
        day
      }
      age
      yearsActive
      homeTown
      bloodType
      staffMedia(perPage: 25, sort: [POPULARITY_DESC]) {
        edges {
          staffRole
          node {
            id
            type
            format
            title {
              romaji
              english
              native
            }
            coverImage {
              medium
              large
            }
            averageScore
            popularity
            status
            episodes
            chapters
            volumes
          }
        }
      }
    }
  }
}
`;

const studioQuery = `
query ($search: String, $id: Int, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    studios(search: $search, id: $id) {
      id
      name
      isAnimationStudio
      media(perPage: 25, sort: [POPULARITY_DESC]) {
        nodes {
          id
          type
          format
          title {
            romaji
            english
            native
          }
          coverImage {
            medium
            large
          }
          averageScore
          popularity
          status
          episodes
        }
      }
    }
  }
}
`;

// Query for anime only (backward compatibility)
const animeQuery = mediaQuery;

const fetchAniList = async (query: string, variables: Record<string, any>) => {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0]?.message || "AniList API error");
  }

  return data.data;
};

export const getTrendingAnime = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    type: "ANIME",
    sort: ["TRENDING_DESC"],
  });
  return data.Page;
};

export const getTopAnimeAniList = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    type: "ANIME",
    sort: ["SCORE_DESC"],
  });
  return data.Page;
};

export const getPopularAnime = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    type: "ANIME",
    sort: ["POPULARITY_DESC"],
  });
  return data.Page;
};

export const getCurrentSeasonAnime = async (page = 1, perPage = 25) => {
  const now = new Date();
  const month = now.getMonth();
  let season: string;
  
  if (month >= 0 && month <= 2) season = "WINTER";
  else if (month >= 3 && month <= 5) season = "SPRING";
  else if (month >= 6 && month <= 8) season = "SUMMER";
  else season = "FALL";

  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    type: "ANIME",
    season,
    seasonYear: now.getFullYear(),
    sort: ["POPULARITY_DESC"],
  });
  return data.Page;
};

export const getUpcomingAnime = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    type: "ANIME",
    status: "NOT_YET_RELEASED",
    sort: ["POPULARITY_DESC"],
  });
  return data.Page;
};

export const searchAnimeAniList = async (search: string, page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    type: "ANIME",
    search,
  });
  return data.Page;
};

export const searchMangaAniList = async (search: string, page = 1, perPage = 25) => {
  const data = await fetchAniList(mediaQuery, {
    page,
    perPage,
    type: "MANGA",
    search,
  });
  return data.Page;
};

// Search all media types and separate them
export const searchAllMedia = async (search: string, page = 1, perPage = 15): Promise<SearchResult> => {
  // Search both anime and manga in parallel
  const [animeData, mangaData] = await Promise.all([
    fetchAniList(mediaQuery, { page, perPage, type: "ANIME", search }),
    fetchAniList(mediaQuery, { page, perPage, type: "MANGA", search }),
  ]);

  const animeResults: AniListMedia[] = animeData.Page.media || [];
  const mangaResults: AniListMedia[] = mangaData.Page.media || [];

  // Separate manga into manga and light novels based on format
  const manga: AniListMedia[] = [];
  const novels: AniListMedia[] = [];

  mangaResults.forEach((item: AniListMedia) => {
    if (item.format === 'NOVEL') {
      novels.push(item);
    } else {
      manga.push(item);
    }
  });

  return { anime: animeResults, manga, novels };
};

// Search for staff (directors, writers, artists, etc.)
export const searchStaff = async (search: string, page = 1, perPage = 10) => {
  const data = await fetchAniList(staffQuery, { search, page, perPage });
  return data.Page;
};

// Get staff by ID
export const getStaffById = async (id: number) => {
  const data = await fetchAniList(staffQuery, { id });
  return data.Page.staff?.[0] as AniListStaff | undefined;
};

// Search for studios
export const searchStudios = async (search: string, page = 1, perPage = 10) => {
  const data = await fetchAniList(studioQuery, { search, page, perPage });
  return data.Page;
};

// Get studio by ID
export const getStudioById = async (id: number) => {
  const data = await fetchAniList(studioQuery, { id });
  return data.Page.studios?.[0] as AniListStudio | undefined;
};

export const getAnimeByIdAniList = async (id: number) => {
  const data = await fetchAniList(animeQuery, { id, type: "ANIME" });
  return data.Page.media[0] as AniListMedia;
};

export const getMangaByIdAniList = async (id: number) => {
  const data = await fetchAniList(mediaQuery, { id, type: "MANGA" });
  return data.Page.media[0] as AniListMedia;
};

export const getMediaByIdAniList = async (id: number) => {
  // Try anime first
  let data = await fetchAniList(mediaQuery, { id });
  if (data.Page.media && data.Page.media.length > 0) {
    return data.Page.media[0] as AniListMedia;
  }
  return null;
};

export const getAnimeByGenre = async (genre: string, page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    type: "ANIME",
    genre,
    sort: ["SCORE_DESC"],
  });
  return data.Page;
};

export const getMangaByGenre = async (genre: string, page = 1, perPage = 25) => {
  const data = await fetchAniList(mediaQuery, {
    page,
    perPage,
    type: "MANGA",
    genre,
    sort: ["SCORE_DESC"],
  });
  return data.Page;
};

// Get trending manga (excludes novels)
export const getTrendingManga = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(mediaQuery, {
    page,
    perPage,
    type: "MANGA",
    format_in: ["MANGA", "ONE_SHOT"],
    sort: ["TRENDING_DESC"],
  });
  return data.Page;
};

// Get top manga (excludes novels)
export const getTopManga = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(mediaQuery, {
    page,
    perPage,
    type: "MANGA",
    format_in: ["MANGA", "ONE_SHOT"],
    sort: ["SCORE_DESC"],
  });
  return data.Page;
};

// Get popular manga
export const getPopularManga = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(mediaQuery, {
    page,
    perPage,
    type: "MANGA",
    format_in: ["MANGA", "ONE_SHOT"],
    sort: ["POPULARITY_DESC"],
  });
  return data.Page;
};

// Get trending light novels
export const getTrendingNovels = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(mediaQuery, {
    page,
    perPage,
    type: "MANGA",
    format: "NOVEL",
    sort: ["TRENDING_DESC"],
  });
  return data.Page;
};

// Get top light novels
export const getTopNovels = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(mediaQuery, {
    page,
    perPage,
    type: "MANGA",
    format: "NOVEL",
    sort: ["SCORE_DESC"],
  });
  return data.Page;
};

// Get popular light novels
export const getPopularNovels = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(mediaQuery, {
    page,
    perPage,
    type: "MANGA",
    format: "NOVEL",
    sort: ["POPULARITY_DESC"],
  });
  return data.Page;
};

// Convert AniList media to our internal format for compatibility
export const convertToAnimeData = (media: AniListMedia) => ({
  mal_id: media.idMal || media.id,
  anilist_id: media.id,
  title: media.title.romaji,
  title_english: media.title.english,
  title_native: media.title.native,
  mediaType: media.type,
  format: media.format,
  images: {
    jpg: {
      image_url: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium,
      large_image_url: media.coverImage.extraLarge || media.coverImage.large,
    },
    webp: {
      image_url: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium,
      large_image_url: media.coverImage.extraLarge || media.coverImage.large,
    },
  },
  score: media.averageScore ? media.averageScore / 10 : undefined,
  popularity: media.popularity,
  synopsis: media.description?.replace(/<[^>]*>/g, "") || undefined,
  genres: media.genres.map((g, i) => ({ mal_id: i, name: g })),
  type: media.format,
  episodes: media.episodes,
  chapters: media.chapters,
  volumes: media.volumes,
  status: media.status,
  season: media.season?.toLowerCase(),
  year: media.seasonYear,
  studios: media.studios?.nodes?.filter(s => s.isAnimationStudio).map((s, i) => ({ mal_id: i, name: s.name })) || [],
  trailer: media.trailer ? {
    youtube_id: media.trailer.site === "youtube" ? media.trailer.id : undefined,
    url: media.trailer.site === "youtube" ? `https://www.youtube.com/watch?v=${media.trailer.id}` : undefined,
  } : undefined,
  // AniList specific fields
  characters: media.characters?.nodes,
  staff: media.staff?.nodes,
  tags: media.tags,
  externalLinks: media.externalLinks,
  recommendations: media.recommendations?.nodes,
  relations: media.relations?.edges,
  streamingEpisodes: media.streamingEpisodes,
  bannerImage: media.bannerImage,
  nextAiringEpisode: media.nextAiringEpisode,
  startDate: media.startDate,
  endDate: media.endDate,
});

// Get streaming links for an anime
export const getStreamingLinks = (media: AniListMedia): StreamingLink[] => {
  const links: StreamingLink[] = [];
  
  // Add external links (Crunchyroll, Netflix, etc.)
  if (media.externalLinks) {
    const streamingSites = ["Crunchyroll", "Netflix", "Funimation", "Hulu", "Amazon Prime Video", "Disney Plus", "HIDIVE", "VRV", "AnimeLab", "Wakanim", "ADN"];
    const readingSites = ["MangaDex", "MangaPlus", "VIZ", "Shonen Jump", "Manga Plus", "Webtoon", "Tapas", "Comixology"];
    const allSites = [...streamingSites, ...readingSites];
    
    media.externalLinks.forEach(link => {
      if (allSites.some(site => link.site.toLowerCase().includes(site.toLowerCase()))) {
        links.push({
          site: link.site,
          url: link.url,
          icon: link.icon,
          color: link.color,
        });
      }
    });
  }
  
  // Add streaming episodes if available
  if (media.streamingEpisodes && media.streamingEpisodes.length > 0) {
    const sites = new Set<string>();
    media.streamingEpisodes.forEach(ep => {
      if (!sites.has(ep.site)) {
        sites.add(ep.site);
        links.push({
          site: ep.site,
          url: ep.url,
        });
      }
    });
  }
  
  return links;
};

// Get format-specific info for display
export const getFormatSpecificInfo = (media: AniListMedia) => {
  const isAnime = media.type === 'ANIME';
  const isManga = media.type === 'MANGA' && media.format !== 'NOVEL';
  const isNovel = media.format === 'NOVEL';

  const statusMap: Record<string, string> = {
    'FINISHED': 'Completed',
    'RELEASING': 'Ongoing',
    'NOT_YET_RELEASED': 'Upcoming',
    'CANCELLED': 'Cancelled',
    'HIATUS': 'On Hiatus',
  };

  return {
    isAnime,
    isManga,
    isNovel,
    status: statusMap[media.status] || media.status,
    // Anime specific
    episodes: media.episodes,
    nextEpisode: media.nextAiringEpisode,
    // Manga/Novel specific
    chapters: media.chapters,
    volumes: media.volumes,
    // Staff
    staff: media.staff?.nodes || [],
    // Studios (anime only)
    studios: media.studios?.nodes?.filter(s => s.isAnimationStudio) || [],
  };
};
