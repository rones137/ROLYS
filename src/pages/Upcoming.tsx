import { useEffect, useState } from "react";
import { AnimeData } from "@/types/anime";
import { getSeasonUpcoming } from "@/lib/api";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { Calendar } from "lucide-react";

const Upcoming = () => {
  const [upcomingAnimes, setUpcomingAnimes] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getSeasonUpcoming();
        setUpcomingAnimes(result.data || []);
      } catch (error) {
        console.error("Failed to load upcoming anime:", error);
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
        <Calendar className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-4xl font-black text-foreground">Coming Soon</h1>
          <p className="text-muted-foreground">Upcoming anime releases</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {upcomingAnimes.map((anime) => (
          <AnimeCard key={anime.mal_id} anime={anime} variant="compact" />
        ))}
      </div>
    </div>
  );
};

export default Upcoming;
