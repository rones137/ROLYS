import { useEffect, useState } from "react";
import { AnimeData } from "@/types/anime";
import { getTrendingNovels, getTopNovels, getPopularNovels, getMangaByGenre, convertToAnimeData, AniListMedia } from "@/lib/anilist";
import { HeroCarousel } from "@/components/anime/HeroCarousel";
import { AnimeCarousel } from "@/components/anime/AnimeCarousel";
import { TrendingUp, Sparkles, Swords, Heart, BookOpen, Feather } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NovelHome = () => {
  const navigate = useNavigate();
  const [topNovels, setTopNovels] = useState<AnimeData[]>([]);
  const [trendingNovels, setTrendingNovels] = useState<AnimeData[]>([]);
  const [popularNovels, setPopularNovels] = useState<AnimeData[]>([]);
  const [actionNovels, setActionNovels] = useState<AnimeData[]>([]);
  const [romanceNovels, setRomanceNovels] = useState<AnimeData[]>([]);
  const [fantasyNovels, setFantasyNovels] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [trendingResult, topResult, popularResult] = await Promise.all([
          getTrendingNovels(1, 10),
          getTopNovels(1, 25),
          getPopularNovels(1, 20),
        ]);

        setTrendingNovels((trendingResult.media || []).map((a: AniListMedia) => convertToAnimeData(a)));
        setTopNovels((topResult.media || []).map((a: AniListMedia) => convertToAnimeData(a)));
        setPopularNovels((popularResult.media || []).map((a: AniListMedia) => convertToAnimeData(a)));

        // Load genre-specific data
        const [actionResult, romanceResult, fantasyResult] = await Promise.all([
          getMangaByGenre("Action", 1, 20),
          getMangaByGenre("Romance", 1, 20),
          getMangaByGenre("Fantasy", 1, 20),
        ]);

        // Filter to only novels
        const filterNovels = (media: AniListMedia[]) => 
          media.filter(m => m.format === 'NOVEL').map(a => convertToAnimeData(a));

        setActionNovels(filterNovels(actionResult.media || []));
        setRomanceNovels(filterNovels(romanceResult.media || []));
        setFantasyNovels(filterNovels(fantasyResult.media || []));

      } catch (error) {
        console.error("Failed to load novel data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleNovelClick = (novel: AnimeData) => {
    const id = (novel as any).anilist_id || novel.mal_id;
    navigate(`/novel/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xl text-muted-foreground">Loading light novels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      {trendingNovels.length > 0 && (
        <HeroCarousel 
          animes={trendingNovels.slice(0, 5)} 
          onAnimeClick={handleNovelClick}
          mediaType="novel"
        />
      )}

      {/* Content Sections */}
      <div className="space-y-12">
        {popularNovels.length > 0 && (
          <AnimeCarousel
            title="Popular Light Novels"
            animes={popularNovels}
            icon={<Feather className="w-7 h-7" />}
            onAnimeClick={handleNovelClick}
          />
        )}

        {topNovels.length > 0 && (
          <AnimeCarousel
            title="Top Rated Light Novels"
            animes={topNovels}
            icon={<TrendingUp className="w-7 h-7" />}
            onAnimeClick={handleNovelClick}
          />
        )}

        {actionNovels.length > 0 && (
          <AnimeCarousel
            title="Action Light Novels"
            animes={actionNovels}
            icon={<Swords className="w-7 h-7" />}
            onAnimeClick={handleNovelClick}
          />
        )}

        {fantasyNovels.length > 0 && (
          <AnimeCarousel
            title="Fantasy Light Novels"
            animes={fantasyNovels}
            icon={<Sparkles className="w-7 h-7" />}
            onAnimeClick={handleNovelClick}
          />
        )}

        {romanceNovels.length > 0 && (
          <AnimeCarousel
            title="Romance Light Novels"
            animes={romanceNovels}
            icon={<Heart className="w-7 h-7" />}
            onAnimeClick={handleNovelClick}
          />
        )}
      </div>
    </div>
  );
};

export default NovelHome;
