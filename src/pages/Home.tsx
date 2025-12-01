import { useEffect, useState } from "react";
import { AnimeData } from "@/types/anime";
import { getTopAnime, getSeasonNow, getAnimeByGenre, GENRES } from "@/lib/api";
import { HeroCarousel } from "@/components/anime/HeroCarousel";
import { AnimeCarousel } from "@/components/anime/AnimeCarousel";
import { Flame, TrendingUp, Sparkles, Swords, Heart, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [topAnimes, setTopAnimes] = useState<AnimeData[]>([]);
  const [seasonAnimes, setSeasonAnimes] = useState<AnimeData[]>([]);
  const [actionAnimes, setActionAnimes] = useState<AnimeData[]>([]);
  const [romanceAnimes, setRomanceAnimes] = useState<AnimeData[]>([]);
  const [fantasyAnimes, setFantasyAnimes] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load data in parallel with slight delays to respect rate limits
        const [topResult, seasonResult] = await Promise.all([
          getTopAnime(1),
          getSeasonNow(),
        ]);

        setTopAnimes(topResult.data || []);
        setSeasonAnimes(seasonResult.data || []);

        // Load genre-specific data with delays
        setTimeout(async () => {
          const actionResult = await getAnimeByGenre(GENRES.ACTION);
          setActionAnimes(actionResult.data || []);
        }, 500);

        setTimeout(async () => {
          const romanceResult = await getAnimeByGenre(GENRES.ROMANCE);
          setRomanceAnimes(romanceResult.data || []);
        }, 1000);

        setTimeout(async () => {
          const fantasyResult = await getAnimeByGenre(GENRES.FANTASY);
          setFantasyAnimes(fantasyResult.data || []);
        }, 1500);

      } catch (error) {
        console.error("Failed to load anime data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAnimeClick = (anime: AnimeData) => {
    // Navigate to a detail page (to be implemented)
    console.log("Clicked anime:", anime);
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
      {topAnimes.length > 0 && (
        <HeroCarousel animes={topAnimes.slice(0, 5)} onAnimeClick={handleAnimeClick} />
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
            animes={topAnimes.slice(5, 30)}
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
