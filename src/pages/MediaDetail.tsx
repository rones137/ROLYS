import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMediaByIdAniList, AniListMedia, getStreamingLinks, getFormatSpecificInfo } from "@/lib/anilist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Plus, Check, Star, Calendar, BookOpen, Film, Users, 
  ExternalLink, Clock, Volume2, ChevronRight, Tv, Library
} from "lucide-react";
import { addToMyList, isInMyList, removeFromMyList } from "@/lib/storage";
import { toast } from "sonner";

interface MediaDetailProps {
  mediaType?: 'anime' | 'manga' | 'novel';
}

const MediaDetail = ({ mediaType: propMediaType }: MediaDetailProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState<AniListMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [inList, setInList] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getMediaByIdAniList(parseInt(id));
        setMedia(data);
        if (data) {
          setInList(isInMyList(data.id));
        }
      } catch (error) {
        console.error("Failed to load media:", error);
        toast.error("Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, [id]);

  const handleToggleList = () => {
    if (!media) return;

    if (inList) {
      removeFromMyList(media.id);
      setInList(false);
      toast.success("Removed from My List");
    } else {
      const info = getFormatSpecificInfo(media);
      const category = info.isAnime ? 'Anime' : info.isManga ? 'Manga' : 'Light Novel';
      
      addToMyList({
        mal_id: media.idMal || media.id,
        anilist_id: media.id,
        title: media.title.romaji,
        title_english: media.title.english,
        images: {
          jpg: {
            image_url: media.coverImage.medium,
            large_image_url: media.coverImage.large,
          },
          webp: {
            image_url: media.coverImage.medium,
            large_image_url: media.coverImage.large,
          },
        },
        synopsis: media.description?.replace(/<[^>]*>/g, "") || undefined,
        genres: media.genres.map((g, i) => ({ mal_id: i, name: g })),
        score: media.averageScore ? media.averageScore / 10 : undefined,
        episodes: media.episodes,
        chapters: media.chapters,
        volumes: media.volumes,
        watchStatus: "plan-to-watch",
        category,
        genre: media.genres[0] || 'All',
      });
      setInList(true);
      toast.success("Added to My List");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-foreground mb-4">Content not found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const info = getFormatSpecificInfo(media);
  const streamingLinks = getStreamingLinks(media);
  const title = media.title.english || media.title.romaji;
  const bannerImage = media.bannerImage || media.coverImage.extraLarge;

  const formatDate = (date: { year: number | null; month: number | null; day: number | null }) => {
    if (!date.year) return null;
    const parts = [];
    if (date.month) parts.push(new Date(2000, date.month - 1).toLocaleString('default', { month: 'short' }));
    if (date.day) parts.push(date.day);
    parts.push(date.year);
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen -mt-8 -mx-4">
      {/* Hero Banner */}
      <div className="relative h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        </div>

        <div className="relative h-full container mx-auto px-4 flex items-end pb-8">
          <div className="flex gap-6">
            {/* Cover Image */}
            <img
              src={media.coverImage.large}
              alt={title}
              className="w-48 h-72 rounded-xl shadow-elevated object-cover border-2 border-border"
            />

            {/* Info */}
            <div className="flex-1 pb-4">
              {/* Format Badge */}
              <div className="flex gap-2 mb-3">
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {info.isAnime ? 'ANIME' : info.isManga ? 'MANGA' : 'LIGHT NOVEL'}
                </Badge>
                <Badge variant="outline">{info.status}</Badge>
                {media.format && <Badge variant="outline">{media.format}</Badge>}
              </div>

              <h1 className="text-4xl font-black text-foreground mb-2">{title}</h1>
              
              {media.title.native && (
                <p className="text-lg text-muted-foreground mb-4">{media.title.native}</p>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {media.averageScore && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-foreground">{media.averageScore}%</span>
                  </div>
                )}
                
                {info.isAnime && media.episodes && (
                  <div className="flex items-center gap-1">
                    <Tv className="w-4 h-4" />
                    <span>{media.episodes} Episodes</span>
                  </div>
                )}

                {(info.isManga || info.isNovel) && media.chapters && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{media.chapters} Chapters</span>
                  </div>
                )}

                {(info.isManga || info.isNovel) && media.volumes && (
                  <div className="flex items-center gap-1">
                    <Library className="w-4 h-4" />
                    <span>{media.volumes} Volumes</span>
                  </div>
                )}

                {media.startDate && formatDate(media.startDate) && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(media.startDate)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {streamingLinks.length > 0 && (
                  <Button 
                    onClick={() => window.open(streamingLinks[0].url, '_blank')}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    {info.isAnime ? 'Watch Now' : 'Read Now'}
                  </Button>
                )}

                <Button variant="outline" onClick={handleToggleList}>
                  {inList ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      In My List
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to List
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="characters">Characters</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            {streamingLinks.length > 0 && (
              <TabsTrigger value="where">
                {info.isAnime ? 'Where to Watch' : 'Where to Read'}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Synopsis */}
            {media.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Synopsis</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {media.description.replace(/<[^>]*>/g, "")}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Info Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Format</span>
                      <span className="text-foreground">{media.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-foreground">{info.status}</span>
                    </div>
                    {info.isAnime && media.episodes && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Episodes</span>
                        <span className="text-foreground">{media.episodes}</span>
                      </div>
                    )}
                    {(info.isManga || info.isNovel) && media.chapters && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Chapters</span>
                        <span className="text-foreground">{media.chapters}</span>
                      </div>
                    )}
                    {(info.isManga || info.isNovel) && media.volumes && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volumes</span>
                        <span className="text-foreground">{media.volumes}</span>
                      </div>
                    )}
                    {media.startDate && formatDate(media.startDate) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date</span>
                        <span className="text-foreground">{formatDate(media.startDate)}</span>
                      </div>
                    )}
                    {media.endDate && formatDate(media.endDate) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date</span>
                        <span className="text-foreground">{formatDate(media.endDate)}</span>
                      </div>
                    )}
                    {info.isAnime && info.studios.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Studio</span>
                        <span className="text-foreground">{info.studios.map(s => s.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Genres */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Genres & Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {media.genres.map((genre, idx) => (
                      <Badge key={idx} variant="secondary">{genre}</Badge>
                    ))}
                  </div>
                  {media.tags && media.tags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {media.tags.slice(0, 10).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Related Media */}
            {media.relations && media.relations.edges && media.relations.edges.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Related</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {media.relations.edges.slice(0, 8).map((rel, idx) => (
                      <div 
                        key={idx}
                        className="cursor-pointer group"
                        onClick={() => {
                          const type = rel.node.type === 'ANIME' ? 'anime' : 
                            rel.node.format === 'NOVEL' ? 'novel' : 'manga';
                          navigate(`/${type}/${rel.node.id}`);
                        }}
                      >
                        <img
                          src={rel.node.coverImage.medium}
                          alt={rel.node.title.romaji}
                          className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all"
                        />
                        <p className="text-sm text-foreground mt-2 line-clamp-2">
                          {rel.node.title.english || rel.node.title.romaji}
                        </p>
                        <p className="text-xs text-muted-foreground">{rel.relationType}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="characters">
            {media.characters && media.characters.nodes && media.characters.nodes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {media.characters.nodes.map((char, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <img
                      src={char.image.medium}
                      alt={char.name.full}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-foreground truncate">{char.name.full}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">No character information available</p>
            )}
          </TabsContent>

          <TabsContent value="staff">
            {media.staff && media.staff.nodes && media.staff.nodes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {media.staff.nodes.map((person, idx) => (
                  <Card 
                    key={idx} 
                    className="overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                    onClick={() => navigate(`/staff/${person.id}`)}
                  >
                    <img
                      src={person.image?.medium || '/placeholder.svg'}
                      alt={person.name.full}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-foreground truncate">{person.name.full}</p>
                      {person.primaryOccupations && person.primaryOccupations.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {person.primaryOccupations[0]}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">No staff information available</p>
            )}
          </TabsContent>

          <TabsContent value="where">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streamingLinks.map((link, idx) => (
                <Card key={idx} className="hover:ring-2 ring-primary transition-all">
                  <CardContent className="p-4">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium text-foreground">{link.site}</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MediaDetail;
