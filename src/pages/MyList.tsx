import { useState, useEffect } from "react";
import { MyListItem } from "@/types/anime";
import { getMyList, updateMyListItem, removeFromMyList } from "@/lib/storage";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MyList = () => {
  const navigate = useNavigate();
  const [myList, setMyList] = useState<MyListItem[]>([]);
  const [filter, setFilter] = useState<"all" | "watching" | "completed" | "plan-to-watch" | "dropped">("all");

  useEffect(() => {
    loadList();
  }, []);

  const loadList = () => {
    const list = getMyList();
    setMyList(list);
  };

  const handleAnimeClick = (anime: MyListItem) => {
    const id = (anime as any).anilist_id || anime.mal_id;
    navigate(`/anime/${id}`);
  };

  const filteredList = filter === "all" 
    ? myList 
    : myList.filter(item => item.watchStatus === filter);

  const counts = {
    all: myList.length,
    watching: myList.filter(i => i.watchStatus === "watching").length,
    completed: myList.filter(i => i.watchStatus === "completed").length,
    "plan-to-watch": myList.filter(i => i.watchStatus === "plan-to-watch").length,
    dropped: myList.filter(i => i.watchStatus === "dropped").length,
  };

  if (myList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <List className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-3">Your List is Empty</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Start adding anime to your list to keep track of what you're watching, planning to watch, or have completed!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-foreground border-l-4 border-primary pl-4">
          My Anime List
        </h1>
        <p className="text-muted-foreground pl-5">
          {myList.length} {myList.length === 1 ? "anime" : "animes"} in your collection
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-muted/50">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="watching" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Watching ({counts.watching})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Completed ({counts.completed})
          </TabsTrigger>
          <TabsTrigger value="plan-to-watch" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Plan to Watch ({counts["plan-to-watch"]})
          </TabsTrigger>
          <TabsTrigger value="dropped" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Dropped ({counts.dropped})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            No anime in this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredList.map((anime) => (
            <AnimeCard 
              key={anime.mal_id} 
              anime={anime} 
              onClick={() => handleAnimeClick(anime)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyList;
