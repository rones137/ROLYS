import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAllMedia, searchStaff, AniListMedia, AniListStaff, SearchResult, getFormatSpecificInfo, getStreamingLinks } from "@/lib/anilist";
import { Loader2, Search as SearchIcon, Tv, BookOpen, BookText, User, Star, Calendar, Play, Library } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResult>({ anime: [], manga: [], novels: [] });
  const [staffResults, setStaffResults] = useState<AniListStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (query) {
      setLoading(true);
      Promise.all([
        searchAllMedia(query),
        searchStaff(query)
      ]).then(([mediaResults, staff]) => {
        setResults(mediaResults);
        setStaffResults(staff);
      }).finally(() => setLoading(false));
    }
  }, [query]);

  const getMediaRoute = (item: AniListMedia) => {
    if (item.type === 'ANIME') return `/anime/${item.id}`;
    if (item.format === 'NOVEL') return `/novel/${item.id}`;
    return `/manga/${item.id}`;
  };

  const MediaCard = ({ item }: { item: AniListMedia }) => {
    const info = getFormatSpecificInfo(item);
    const links = getStreamingLinks(item);
    const isAnime = item.type === 'ANIME';
    const isNovel = item.format === 'NOVEL';
    const isManga = item.type === 'MANGA' && item.format !== 'NOVEL';

    return (
      <Card 
        className="cursor-pointer hover:shadow-glow-red hover:ring-1 ring-primary/50 transition-all overflow-hidden group"
        onClick={() => navigate(getMediaRoute(item))}
      >
        <CardContent className="p-0 flex gap-4">
          <img 
            src={item.coverImage.medium} 
            alt={item.title.romaji} 
            className="w-28 h-40 object-cover flex-shrink-0 group-hover:scale-105 transition-transform" 
          />
          <div className="py-3 pr-4 flex-1 flex flex-col">
            <div className="flex gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className={
                isAnime ? "bg-blue-500/20 text-blue-400" : 
                isManga ? "bg-green-500/20 text-green-400" : 
                "bg-purple-500/20 text-purple-400"
              }>
                {isAnime ? 'Anime' : isManga ? 'Manga' : 'Light Novel'}
              </Badge>
              <Badge variant="outline" className="text-xs">{info.status}</Badge>
            </div>
            
            <h3 className="font-bold line-clamp-1 text-foreground">{item.title.english || item.title.romaji}</h3>
            {item.title.native && (
              <p className="text-xs text-muted-foreground line-clamp-1">{item.title.native}</p>
            )}

            {/* Format-specific info */}
            <div className="mt-auto pt-2 space-y-1 text-xs text-muted-foreground">
              {isAnime && (
                <>
                  {item.episodes && (
                    <div className="flex items-center gap-1">
                      <Tv className="w-3 h-3" />
                      <span>{item.episodes} Episodes</span>
                    </div>
                  )}
                  {info.studios.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>Studio: {info.studios[0]?.name}</span>
                    </div>
                  )}
                </>
              )}
              
              {(isManga || isNovel) && (
                <>
                  {item.chapters && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{item.chapters} Chapters</span>
                    </div>
                  )}
                  {item.volumes && (
                    <div className="flex items-center gap-1">
                      <Library className="w-3 h-3" />
                      <span>{item.volumes} Volumes</span>
                    </div>
                  )}
                </>
              )}
              
              {item.averageScore && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span>{item.averageScore}%</span>
                </div>
              )}
            </div>

            {/* Action button */}
            {links.length > 0 && (
              <Button 
                size="sm" 
                variant="ghost"
                className="mt-2 w-fit text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(links[0].url, '_blank');
                }}
              >
                <Play className="w-3 h-3 mr-1 fill-current" />
                {isAnime ? 'Watch Now' : 'Read Now'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const StaffCard = ({ staff }: { staff: AniListStaff }) => (
    <Card 
      className="cursor-pointer hover:shadow-glow-red hover:ring-1 ring-primary/50 transition-all overflow-hidden"
      onClick={() => navigate(`/staff/${staff.id}`)}
    >
      <CardContent className="p-0 flex gap-4">
        <img 
          src={staff.image.medium} 
          alt={staff.name.full} 
          className="w-20 h-28 object-cover flex-shrink-0" 
        />
        <div className="py-3 pr-4 flex-1">
          <Badge variant="secondary" className="mb-2 bg-orange-500/20 text-orange-400">
            <User className="w-3 h-3 mr-1" /> Creator
          </Badge>
          <h3 className="font-bold line-clamp-1">{staff.name.full}</h3>
          {staff.name.native && (
            <p className="text-xs text-muted-foreground">{staff.name.native}</p>
          )}
          {staff.primaryOccupations && staff.primaryOccupations.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {staff.primaryOccupations.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const total = results.anime.length + results.manga.length + results.novels.length + staffResults.length;

  if (!query) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <SearchIcon className="w-24 h-24 text-muted-foreground mb-6" />
      <h2 className="text-3xl font-bold mb-3">Search for Content</h2>
      <p className="text-muted-foreground max-w-md">
        Search anime, manga, light novels, creators, directors, and artists in English or Japanese.
      </p>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Searching...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black border-l-4 border-primary pl-4">Search Results</h1>
        <p className="text-muted-foreground pl-5 mt-1">{total} results for "{query}"</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="all">All ({total})</TabsTrigger>
          <TabsTrigger value="anime">
            <Tv className="w-4 h-4 mr-1" />Anime ({results.anime.length})
          </TabsTrigger>
          <TabsTrigger value="manga">
            <BookOpen className="w-4 h-4 mr-1" />Manga ({results.manga.length})
          </TabsTrigger>
          <TabsTrigger value="novels">
            <BookText className="w-4 h-4 mr-1" />Light Novels ({results.novels.length})
          </TabsTrigger>
          <TabsTrigger value="creators">
            <User className="w-4 h-4 mr-1" />Creators ({staffResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="grid gap-4 md:grid-cols-2">
          {staffResults.slice(0, 4).map(staff => <StaffCard key={`staff-${staff.id}`} staff={staff} />)}
          {[...results.anime, ...results.manga, ...results.novels].map(item => (
            <MediaCard key={`media-${item.id}`} item={item} />
          ))}
          {total === 0 && (
            <p className="text-muted-foreground col-span-2 text-center py-12">
              No results found for "{query}"
            </p>
          )}
        </TabsContent>

        <TabsContent value="anime" className="grid gap-4 md:grid-cols-2">
          {results.anime.map(item => <MediaCard key={item.id} item={item} />)}
          {results.anime.length === 0 && (
            <p className="text-muted-foreground col-span-2 text-center py-12">
              No anime found for "{query}"
            </p>
          )}
        </TabsContent>

        <TabsContent value="manga" className="grid gap-4 md:grid-cols-2">
          {results.manga.map(item => <MediaCard key={item.id} item={item} />)}
          {results.manga.length === 0 && (
            <p className="text-muted-foreground col-span-2 text-center py-12">
              No manga found for "{query}"
            </p>
          )}
        </TabsContent>

        <TabsContent value="novels" className="grid gap-4 md:grid-cols-2">
          {results.novels.map(item => <MediaCard key={item.id} item={item} />)}
          {results.novels.length === 0 && (
            <p className="text-muted-foreground col-span-2 text-center py-12">
              No light novels found for "{query}"
            </p>
          )}
        </TabsContent>

        <TabsContent value="creators" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staffResults.map(staff => <StaffCard key={staff.id} staff={staff} />)}
          {staffResults.length === 0 && (
            <p className="text-muted-foreground col-span-3 text-center py-12">
              No creators found for "{query}"
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Search;
