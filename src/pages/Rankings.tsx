import { useEffect, useState } from "react";
import { AnimeData } from "@/types/anime";
import { getTopAnime } from "@/lib/api";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { Trophy, Star } from "lucide-react";

const Rankings = () => {
  const [topAnimes, setTopAnimes] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getTopAnime(1);
        setTopAnimes(result.data || []);
      } catch (error) {
        console.error("Failed to load rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
            <div className="absolute -top-3 -left-3 z-10 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center font-black text-lg shadow-glow-red">
              {index + 1}
            </div>
            <AnimeCard anime={anime} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rankings;
