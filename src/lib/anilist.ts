// AniList API Integration
const ANILIST_URL = "https://graphql.anilist.co";

export interface AniListAnime {
  id: number;
  idMal: number | null;
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
  status: string;
  season: string | null;
  seasonYear: number | null;
  format: string;
  genres: string[];
  tags: Array<{ name: string; rank: number }>;
  studios: { nodes: Array<{ name: string; isAnimationStudio: boolean }> };
  staff: { nodes: Array<{ name: { full: string }; primaryOccupations: string[] }> };
  characters: { nodes: Array<{ name: { full: string }; image: { medium: string } }> };
  trailer: { id: string; site: string } | null;
  externalLinks: Array<{ url: string; site: string; icon: string | null; color: string | null }>;
  recommendations: { nodes: Array<{ mediaRecommendation: AniListAnime | null }> };
  relations: { edges: Array<{ relationType: string; node: { id: number; title: { romaji: string }; coverImage: { medium: string } } }> };
  startDate: { year: number | null; month: number | null; day: number | null };
  endDate: { year: number | null; month: number | null; day: number | null };
  nextAiringEpisode: { airingAt: number; episode: number } | null;
  streamingEpisodes: Array<{ title: string; thumbnail: string; url: string; site: string }>;
}

export interface StreamingLink {
  site: string;
  url: string;
  icon?: string | null;
  color?: string | null;
}

const animeQuery = `
query ($id: Int, $search: String, $page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $format: MediaFormat, $genre: String) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    media(id: $id, search: $search, type: ANIME, sort: $sort, season: $season, seasonYear: $seasonYear, status: $status, format: $format, genre: $genre) {
      id
      idMal
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
          name {
            full
          }
          primaryOccupations
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
            title {
              romaji
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
    sort: ["TRENDING_DESC"],
  });
  return data.Page;
};

export const getTopAnimeAniList = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    sort: ["SCORE_DESC"],
  });
  return data.Page;
};

export const getPopularAnime = async (page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
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
    status: "NOT_YET_RELEASED",
    sort: ["POPULARITY_DESC"],
  });
  return data.Page;
};

export const searchAnimeAniList = async (search: string, page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    search,
  });
  return data.Page;
};

export const getAnimeByIdAniList = async (id: number) => {
  const data = await fetchAniList(animeQuery, { id });
  return data.Page.media[0] as AniListAnime;
};

export const getAnimeByGenre = async (genre: string, page = 1, perPage = 25) => {
  const data = await fetchAniList(animeQuery, {
    page,
    perPage,
    genre,
    sort: ["SCORE_DESC"],
  });
  return data.Page;
};

// Convert AniList anime to our internal format for compatibility
export const convertToAnimeData = (anime: AniListAnime) => ({
  mal_id: anime.idMal || anime.id,
  anilist_id: anime.id,
  title: anime.title.romaji,
  title_english: anime.title.english,
  images: {
    jpg: {
      image_url: anime.coverImage.medium,
      large_image_url: anime.coverImage.large || anime.coverImage.extraLarge,
    },
    webp: {
      image_url: anime.coverImage.medium,
      large_image_url: anime.coverImage.large || anime.coverImage.extraLarge,
    },
  },
  score: anime.averageScore ? anime.averageScore / 10 : undefined,
  popularity: anime.popularity,
  synopsis: anime.description?.replace(/<[^>]*>/g, "") || undefined,
  genres: anime.genres.map((g, i) => ({ mal_id: i, name: g })),
  type: anime.format,
  episodes: anime.episodes,
  status: anime.status,
  season: anime.season?.toLowerCase(),
  year: anime.seasonYear,
  studios: anime.studios.nodes.filter(s => s.isAnimationStudio).map((s, i) => ({ mal_id: i, name: s.name })),
  trailer: anime.trailer ? {
    youtube_id: anime.trailer.site === "youtube" ? anime.trailer.id : undefined,
    url: anime.trailer.site === "youtube" ? `https://www.youtube.com/watch?v=${anime.trailer.id}` : undefined,
  } : undefined,
  // AniList specific fields
  characters: anime.characters?.nodes,
  staff: anime.staff?.nodes,
  tags: anime.tags,
  externalLinks: anime.externalLinks,
  recommendations: anime.recommendations?.nodes,
  relations: anime.relations?.edges,
  streamingEpisodes: anime.streamingEpisodes,
  bannerImage: anime.bannerImage,
  nextAiringEpisode: anime.nextAiringEpisode,
});

// Get streaming links for an anime
export const getStreamingLinks = (anime: AniListAnime): StreamingLink[] => {
  const links: StreamingLink[] = [];
  
  // Add external links (Crunchyroll, Netflix, etc.)
  if (anime.externalLinks) {
    const streamingSites = ["Crunchyroll", "Netflix", "Funimation", "Hulu", "Amazon Prime Video", "Disney Plus", "HIDIVE", "VRV", "AnimeLab", "Wakanim", "ADN"];
    
    anime.externalLinks.forEach(link => {
      if (streamingSites.some(site => link.site.toLowerCase().includes(site.toLowerCase()))) {
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
  if (anime.streamingEpisodes && anime.streamingEpisodes.length > 0) {
    const sites = new Set<string>();
    anime.streamingEpisodes.forEach(ep => {
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