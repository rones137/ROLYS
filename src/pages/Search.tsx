import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnimeData } from "@/types/anime";
import { searchAnimeAniList, convertToAnimeData, AniListAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { Search as SearchIcon } from "lucide-react";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await searchAnimeAniList(query, 1, 30);
        setResults((result.media || []).map((a: AniListAnime) => convertToAnimeData(a)));
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [query]);

  const handleAnimeClick = (anime: AnimeData) => {
    const id = (anime as any).anilist_id || anime.mal_id;
    navigate(`/anime/${id}`);
  };

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <SearchIcon className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-3">Start Searching</h2>
        <p className="text-muted-foreground">Use the search bar above to find anime</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-foreground border-l-4 border-primary pl-4 mb-2">
          Search Results
        </h1>
        <p className="text-muted-foreground pl-5">
          {results.length} results for "{query}"
        </p>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16">
          <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">
            No results found for "{query}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {results.map((anime) => (
            <AnimeCard 
              key={anime.mal_id} 
              anime={anime} 
              variant="compact"
              onClick={() => handleAnimeClick(anime)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
