import { useEffect, useState } from "react";
import { AnimeData } from "@/types/anime";
import { getTrendingAnime, convertToAnimeData, AniListAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Trending = () => {
  const navigate = useNavigate();
  const [trendingAnimes, setTrendingAnimes] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getTrendingAnime(1, 30);
        setTrendingAnimes((result.media || []).map((a: AniListAnime) => convertToAnimeData(a)));
      } catch (error) {
        console.error("Failed to load trending anime:", error);
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
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <TrendingUp className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-4xl font-black text-foreground">Trending Now</h1>
          <p className="text-muted-foreground">Most popular anime right now</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {trendingAnimes.map((anime) => (
          <AnimeCard 
            key={anime.mal_id} 
            anime={anime} 
            variant="compact" 
            onClick={() => handleAnimeClick(anime)}
          />
        ))}
      </div>
    </div>
  );
};

export default Trending;
