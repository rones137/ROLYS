import { useEffect, useState } from "react";
import { AnimeData } from "@/types/anime";
import { getTopAnimeAniList, convertToAnimeData, AniListAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Rankings = () => {
  const navigate = useNavigate();
  const [topAnimes, setTopAnimes] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getTopAnimeAniList(1, 25);
        setTopAnimes((result.media || []).map((a: AniListAnime) => convertToAnimeData(a)));
      } catch (error) {
        console.error("Failed to load rankings:", error);
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
        <Trophy className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-4xl font-black text-foreground">Top Ranked Anime</h1>
          <p className="text-muted-foreground">Highest rated anime of all time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {topAnimes.map((anime, index) => (
          <div key={anime.mal_id} className="relative">
            <div className="absolute -top-3 -left-3 z-10 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center font-black text-lg shadow-glow-red text-primary-foreground">
              {index + 1}
            </div>
            <AnimeCard anime={anime} onClick={() => handleAnimeClick(anime)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rankings;
