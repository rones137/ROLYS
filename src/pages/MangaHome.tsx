import { useEffect, useState } from "react";
import { AnimeData } from "@/types/anime";
import { getTrendingManga, getTopManga, getPopularManga, getMangaByGenre, convertToAnimeData, AniListMedia } from "@/lib/anilist";
import { HeroCarousel } from "@/components/anime/HeroCarousel";
import { AnimeCarousel } from "@/components/anime/AnimeCarousel";
import { Flame, TrendingUp, Sparkles, Swords, Heart, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MangaHome = () => {
  const navigate = useNavigate();
  const [topManga, setTopManga] = useState<AnimeData[]>([]);
  const [trendingManga, setTrendingManga] = useState<AnimeData[]>([]);
  const [popularManga, setPopularManga] = useState<AnimeData[]>([]);
  const [actionManga, setActionManga] = useState<AnimeData[]>([]);
  const [romanceManga, setRomanceManga] = useState<AnimeData[]>([]);
  const [fantasyManga, setFantasyManga] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [trendingResult, topResult, popularResult] = await Promise.all([
          getTrendingManga(1, 10),
          getTopManga(1, 25),
          getPopularManga(1, 20),
        ]);

        setTrendingManga((trendingResult.media || []).map((a: AniListMedia) => convertToAnimeData(a)));
        setTopManga((topResult.media || []).map((a: AniListMedia) => convertToAnimeData(a)));
        setPopularManga((popularResult.media || []).map((a: AniListMedia) => convertToAnimeData(a)));

        // Load genre-specific data
        const [actionResult, romanceResult, fantasyResult] = await Promise.all([
          getMangaByGenre("Action", 1, 20),
          getMangaByGenre("Romance", 1, 20),
          getMangaByGenre("Fantasy", 1, 20),
        ]);

        // Filter out novels from genre results
        const filterManga = (media: AniListMedia[]) => 
          media.filter(m => m.format !== 'NOVEL').map(a => convertToAnimeData(a));

        setActionManga(filterManga(actionResult.media || []));
        setRomanceManga(filterManga(romanceResult.media || []));
        setFantasyManga(filterManga(fantasyResult.media || []));

      } catch (error) {
        console.error("Failed to load manga data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleMangaClick = (manga: AnimeData) => {
    const id = (manga as any).anilist_id || manga.mal_id;
    navigate(`/manga/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xl text-muted-foreground">Loading amazing manga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      {trendingManga.length > 0 && (
        <HeroCarousel 
          animes={trendingManga.slice(0, 5)} 
          onAnimeClick={handleMangaClick}
          mediaType="manga"
        />
      )}

      {/* Content Sections */}
      <div className="space-y-12">
        {popularManga.length > 0 && (
          <AnimeCarousel
            title="Popular Manga"
            animes={popularManga}
            icon={<BookOpen className="w-7 h-7" />}
            onAnimeClick={handleMangaClick}
          />
        )}

        {topManga.length > 0 && (
          <AnimeCarousel
            title="Top Rated Manga"
            animes={topManga}
            icon={<TrendingUp className="w-7 h-7" />}
            onAnimeClick={handleMangaClick}
          />
        )}

        {actionManga.length > 0 && (
          <AnimeCarousel
            title="Action Manga"
            animes={actionManga}
            icon={<Swords className="w-7 h-7" />}
            onAnimeClick={handleMangaClick}
          />
        )}

        {fantasyManga.length > 0 && (
          <AnimeCarousel
            title="Fantasy Manga"
            animes={fantasyManga}
            icon={<Sparkles className="w-7 h-7" />}
            onAnimeClick={handleMangaClick}
          />
        )}

        {romanceManga.length > 0 && (
          <AnimeCarousel
            title="Romance Manga"
            animes={romanceManga}
            icon={<Heart className="w-7 h-7" />}
            onAnimeClick={handleMangaClick}
          />
        )}
      </div>
    </div>
  );
};

export default MangaHome;
