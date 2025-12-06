import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAllMedia, AniListMedia, SearchResult } from "@/lib/anilist";
import { Loader2, Search as SearchIcon, Tv, BookOpen, BookText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResult>({ anime: [], manga: [], novels: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (query) {
      setLoading(true);
      searchAllMedia(query).then(setResults).finally(() => setLoading(false));
    }
  }, [query]);

  const MediaCard = ({ item }: { item: AniListMedia }) => (
    <Card className="cursor-pointer hover:shadow-glow-red transition-all" onClick={() => navigate(`/anime/${item.id}`)}>
      <CardContent className="p-0 flex gap-4">
        <img src={item.coverImage.medium} alt={item.title.romaji} className="w-24 h-36 object-cover rounded-l-lg" />
        <div className="py-3 pr-4 flex-1">
          <Badge variant="secondary" className="mb-2">
            {item.type === 'ANIME' ? 'Anime' : item.format === 'NOVEL' ? 'Light Novel' : 'Manga'}
          </Badge>
          <h3 className="font-bold line-clamp-1">{item.title.english || item.title.romaji}</h3>
          {item.title.native && <p className="text-xs text-muted-foreground">{item.title.native}</p>}
        </div>
      </CardContent>
    </Card>
  );

  const total = results.anime.length + results.manga.length + results.novels.length;

  if (!query) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <SearchIcon className="w-24 h-24 text-muted-foreground mb-6" />
      <h2 className="text-3xl font-bold mb-3">Search for Content</h2>
      <p className="text-muted-foreground">Search anime, manga, light novels in English or Japanese.</p>
    </div>
  );

  if (loading) return <div className="flex justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black border-l-4 border-primary pl-4">Search Results</h1>
      <p className="text-muted-foreground pl-5">{total} results for "{query}"</p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({total})</TabsTrigger>
          <TabsTrigger value="anime"><Tv className="w-4 h-4 mr-1" />Anime ({results.anime.length})</TabsTrigger>
          <TabsTrigger value="manga"><BookOpen className="w-4 h-4 mr-1" />Manga ({results.manga.length})</TabsTrigger>
          <TabsTrigger value="novels"><BookText className="w-4 h-4 mr-1" />Novels ({results.novels.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="grid gap-4 md:grid-cols-2">
          {[...results.anime, ...results.manga, ...results.novels].map(item => <MediaCard key={item.id} item={item} />)}
        </TabsContent>
        <TabsContent value="anime" className="grid gap-4 md:grid-cols-2">
          {results.anime.map(item => <MediaCard key={item.id} item={item} />)}
        </TabsContent>
        <TabsContent value="manga" className="grid gap-4 md:grid-cols-2">
          {results.manga.map(item => <MediaCard key={item.id} item={item} />)}
        </TabsContent>
        <TabsContent value="novels" className="grid gap-4 md:grid-cols-2">
          {results.novels.map(item => <MediaCard key={item.id} item={item} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Search;
