import { useEffect, useState } from "react";
import { AnimeData } from "@/types/anime";
import { getTrendingAnime, getTopAnimeAniList, getCurrentSeasonAnime, getAnimeByGenre, convertToAnimeData, AniListAnime } from "@/lib/anilist";
import { HeroCarousel } from "@/components/anime/HeroCarousel";
import { AnimeCarousel } from "@/components/anime/AnimeCarousel";
import { Flame, TrendingUp, Sparkles, Swords, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [topAnimes, setTopAnimes] = useState<AnimeData[]>([]);
  const [trendingAnimes, setTrendingAnimes] = useState<AnimeData[]>([]);
  const [seasonAnimes, setSeasonAnimes] = useState<AnimeData[]>([]);
  const [actionAnimes, setActionAnimes] = useState<AnimeData[]>([]);
  const [romanceAnimes, setRomanceAnimes] = useState<AnimeData[]>([]);
  const [fantasyAnimes, setFantasyAnimes] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [trendingResult, topResult, seasonResult] = await Promise.all([
          getTrendingAnime(1, 10),
          getTopAnimeAniList(1, 25),
          getCurrentSeasonAnime(1, 20),
        ]);

        setTrendingAnimes((trendingResult.media || []).map((a: AniListAnime) => convertToAnimeData(a)));
        setTopAnimes((topResult.media || []).map((a: AniListAnime) => convertToAnimeData(a)));
        setSeasonAnimes((seasonResult.media || []).map((a: AniListAnime) => convertToAnimeData(a)));

        // Load genre-specific data
        const [actionResult, romanceResult, fantasyResult] = await Promise.all([
          getAnimeByGenre("Action", 1, 20),
          getAnimeByGenre("Romance", 1, 20),
          getAnimeByGenre("Fantasy", 1, 20),
        ]);

        setActionAnimes((actionResult.media || []).map((a: AniListAnime) => convertToAnimeData(a)));
        setRomanceAnimes((romanceResult.media || []).map((a: AniListAnime) => convertToAnimeData(a)));
        setFantasyAnimes((fantasyResult.media || []).map((a: AniListAnime) => convertToAnimeData(a)));

      } catch (error) {
        console.error("Failed to load anime data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAnimeClick = (anime: AnimeData) => {
    const id = (anime as any).anilist_id || anime.mal_id;
    navigate(`/anime/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xl text-muted-foreground">Loading amazing anime...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      {trendingAnimes.length > 0 && (
        <HeroCarousel animes={trendingAnimes.slice(0, 5)} onAnimeClick={handleAnimeClick} />
      )}

      {/* Content Sections */}
      <div className="space-y-12">
        {seasonAnimes.length > 0 && (
          <AnimeCarousel
            title="Currently Airing"
            animes={seasonAnimes}
            icon={<Flame className="w-7 h-7" />}
            onAnimeClick={handleAnimeClick}
          />
        )}

        {topAnimes.length > 0 && (
          <AnimeCarousel
            title="Top Rated Anime"
            animes={topAnimes}
            icon={<TrendingUp className="w-7 h-7" />}
            onAnimeClick={handleAnimeClick}
          />
        )}

        {actionAnimes.length > 0 && (
          <AnimeCarousel
            title="Action & Adventure"
            animes={actionAnimes}
            icon={<Swords className="w-7 h-7" />}
            onAnimeClick={handleAnimeClick}
          />
        )}

        {fantasyAnimes.length > 0 && (
          <AnimeCarousel
            title="Fantasy Worlds"
            animes={fantasyAnimes}
            icon={<Sparkles className="w-7 h-7" />}
            onAnimeClick={handleAnimeClick}
          />
        )}

        {romanceAnimes.length > 0 && (
          <AnimeCarousel
            title="Romance & Drama"
            animes={romanceAnimes}
            icon={<Heart className="w-7 h-7" />}
            onAnimeClick={handleAnimeClick}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
