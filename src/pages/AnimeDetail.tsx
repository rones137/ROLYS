import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAnimeByIdAniList, AniListAnime, getStreamingLinks, StreamingLink, convertToAnimeData } from "@/lib/anilist";
import { addToMyList, removeFromMyList, isInMyList } from "@/lib/storage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Star, Play, Plus, Check, Calendar, Clock, Tv, Users, Heart, ArrowLeft,
  ExternalLink, Youtube, Info, BookOpen, Film, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const AnimeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<AniListAnime | null>(null);
  const [loading, setLoading] = useState(true);
  const [inList, setInList] = useState(false);
  const [showStreamingDialog, setShowStreamingDialog] = useState(false);
  const [streamingLinks, setStreamingLinks] = useState<StreamingLink[]>([]);

  useEffect(() => {
    if (id) {
      loadAnime(parseInt(id));
    }
  }, [id]);

  const loadAnime = async (animeId: number) => {
    setLoading(true);
    try {
      const data = await getAnimeByIdAniList(animeId);
      setAnime(data);
      setInList(isInMyList(data.idMal || data.id));
      setStreamingLinks(getStreamingLinks(data));
    } catch (error) {
      console.error("Failed to load anime:", error);
      toast.error("Failed to load anime details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = () => {
    if (!anime) return;
    
    const animeData = convertToAnimeData(anime);
    
    if (inList) {
      removeFromMyList(animeData.mal_id);
      setInList(false);
      toast.success("Removed from My List");
    } else {
      addToMyList({
        ...animeData,
        addedAt: Date.now(),
        watchStatus: "plan-to-watch",
      });
      setInList(true);
      toast.success("Added to My List");
    }
  };

  const formatDate = (date: { year: number | null; month: number | null; day: number | null }) => {
    if (!date.year) return "TBA";
    const parts = [];
    if (date.month) parts.push(new Date(2000, date.month - 1).toLocaleString("default", { month: "short" }));
    if (date.day) parts.push(date.day);
    parts.push(date.year);
    return parts.join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RELEASING": return "bg-green-500";
      case "FINISHED": return "bg-blue-500";
      case "NOT_YET_RELEASED": return "bg-yellow-500";
      case "CANCELLED": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStreamingSiteIcon = (site: string) => {
    const lowerSite = site.toLowerCase();
    if (lowerSite.includes("crunchyroll")) return "🍥";
    if (lowerSite.includes("netflix")) return "🎬";
    if (lowerSite.includes("funimation")) return "⭐";
    if (lowerSite.includes("hulu")) return "📺";
    if (lowerSite.includes("amazon")) return "📦";
    if (lowerSite.includes("disney")) return "🏰";
    if (lowerSite.includes("hidive")) return "🎭";
    return "📺";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Info className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Anime not found</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Hero Section */}
      <div className="relative">
        {/* Banner */}
        {anime.bannerImage && (
          <div className="absolute inset-0 h-80 overflow-hidden rounded-xl">
            <img
              src={anime.bannerImage}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        )}

        <div className={cn("relative flex flex-col md:flex-row gap-8", anime.bannerImage && "pt-32")}>
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={anime.coverImage.extraLarge || anime.coverImage.large}
              alt={anime.title.romaji}
              className="w-64 rounded-xl shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-black text-foreground mb-2">
                {anime.title.english || anime.title.romaji}
              </h1>
              {anime.title.english && anime.title.romaji !== anime.title.english && (
                <p className="text-lg text-muted-foreground">{anime.title.romaji}</p>
              )}
              {anime.title.native && (
                <p className="text-sm text-muted-foreground">{anime.title.native}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4">
              {anime.averageScore && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Star className="w-6 h-6 fill-yellow-400" />
                  <span className="text-2xl font-bold">{(anime.averageScore / 10).toFixed(1)}</span>
                </div>
              )}
              <Badge className={getStatusColor(anime.status)}>
                {anime.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant="secondary">{anime.format}</Badge>
              {anime.episodes && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Tv className="w-4 h-4" />
                  {anime.episodes} episodes
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                {anime.popularity.toLocaleString()} fans
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {anime.genres.map(genre => (
                <Badge key={genre} variant="outline">{genre}</Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Dialog open={showStreamingDialog} onOpenChange={setShowStreamingDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Play className="w-5 h-5" /> Watch Now
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Where to Watch</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {streamingLinks.length > 0 ? (
                      streamingLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getStreamingSiteIcon(link.site)}</span>
                            <span className="font-medium">{link.site}</span>
                          </div>
                          <ExternalLink className="w-5 h-5 text-muted-foreground" />
                        </a>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Tv className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No streaming links available</p>
                        <p className="text-sm mt-2">Check back later or search on your favorite platform</p>
                      </div>
                    )}

                    {/* Search on popular platforms */}
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-3">Search on:</p>
                      <div className="flex flex-wrap gap-2">
                        {["Crunchyroll", "Netflix", "Funimation", "Hulu"].map(platform => (
                          <a
                            key={platform}
                            href={`https://www.google.com/search?q=${encodeURIComponent(`${anime.title.romaji} ${platform}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-full text-sm border border-border hover:bg-muted transition-colors"
                          >
                            {platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {anime.trailer && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${anime.trailer!.id}`, "_blank")}
                >
                  <Youtube className="w-5 h-5 mr-2" /> Trailer
                </Button>
              )}

              <Button variant="outline" size="lg" onClick={handleAddToList}>
                {inList ? (
                  <>
                    <Check className="w-5 h-5 mr-2" /> In List
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" /> Add to List
                  </>
                )}
              </Button>
            </div>

            {/* Synopsis */}
            {anime.description && (
              <div className="pt-4">
                <p className="text-muted-foreground leading-relaxed">
                  {anime.description.replace(/<[^>]*>/g, "")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="relations">Relations</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-sm text-muted-foreground mb-1">Format</div>
              <div className="font-semibold">{anime.format}</div>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-sm text-muted-foreground mb-1">Episodes</div>
              <div className="font-semibold">{anime.episodes || "TBA"}</div>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-sm text-muted-foreground mb-1">Season</div>
              <div className="font-semibold">
                {anime.season ? `${anime.season} ${anime.seasonYear}` : "N/A"}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-sm text-muted-foreground mb-1">Status</div>
              <div className="font-semibold">{anime.status.replace(/_/g, " ")}</div>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-sm text-muted-foreground mb-1">Start Date</div>
              <div className="font-semibold">{formatDate(anime.startDate)}</div>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-sm text-muted-foreground mb-1">End Date</div>
              <div className="font-semibold">{formatDate(anime.endDate)}</div>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-sm text-muted-foreground mb-1">Popularity</div>
              <div className="font-semibold">#{anime.popularity.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-sm text-muted-foreground mb-1">Studios</div>
              <div className="font-semibold">
                {anime.studios.nodes.filter(s => s.isAnimationStudio).map(s => s.name).join(", ") || "N/A"}
              </div>
            </div>
          </div>

          {/* Tags */}
          {anime.tags && anime.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {anime.tags.slice(0, 15).map(tag => (
                  <Badge key={tag.name} variant="secondary">
                    {tag.name} ({tag.rank}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Next Episode */}
          {anime.nextAiringEpisode && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="w-5 h-5" />
                <span className="font-bold">Episode {anime.nextAiringEpisode.episode}</span>
                <span>airing</span>
                <span className="font-bold">
                  {new Date(anime.nextAiringEpisode.airingAt * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="characters" className="pt-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {anime.characters?.nodes.map(character => (
                <div key={character.name.full} className="flex-shrink-0 w-32 text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-2">
                    <AvatarImage src={character.image.medium} />
                    <AvatarFallback>{character.name.full[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium truncate">{character.name.full}</p>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="staff" className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {anime.staff?.nodes.map(person => (
              <div key={person.name.full} className="p-4 rounded-lg bg-card border border-border">
                <p className="font-medium">{person.name.full}</p>
                <p className="text-sm text-muted-foreground">
                  {person.primaryOccupations?.slice(0, 2).join(", ")}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="relations" className="pt-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {anime.relations?.edges.map(relation => (
                <div
                  key={relation.node.id}
                  className="flex-shrink-0 w-40 cursor-pointer"
                  onClick={() => navigate(`/anime/${relation.node.id}`)}
                >
                  <img
                    src={relation.node.coverImage.medium}
                    alt={relation.node.title.romaji}
                    className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                  />
                  <Badge variant="secondary" className="mb-1 text-xs">
                    {relation.relationType.replace(/_/g, " ")}
                  </Badge>
                  <p className="text-sm font-medium truncate">{relation.node.title.romaji}</p>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recommendations" className="pt-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {anime.recommendations?.nodes
                .filter(r => r.mediaRecommendation)
                .map(rec => (
                  <div
                    key={rec.mediaRecommendation!.id}
                    className="flex-shrink-0 w-40 cursor-pointer"
                    onClick={() => navigate(`/anime/${rec.mediaRecommendation!.id}`)}
                  >
                    <img
                      src={rec.mediaRecommendation!.coverImage.medium}
                      alt={rec.mediaRecommendation!.title.romaji}
                      className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm font-medium truncate">
                      {rec.mediaRecommendation!.title.english || rec.mediaRecommendation!.title.romaji}
                    </p>
                    {rec.mediaRecommendation!.averageScore && (
                      <div className="flex items-center gap-1 text-sm text-yellow-400">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        {(rec.mediaRecommendation!.averageScore / 10).toFixed(1)}
                      </div>
                    )}
                  </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnimeDetail;