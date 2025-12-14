import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStaffById, AniListStaff } from "@/lib/anilist";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User, Calendar, MapPin, Film, BookOpen, Tv } from "lucide-react";
import { toast } from "sonner";

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<AniListStaff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaff = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getStaffById(parseInt(id));
        setStaff(data || null);
      } catch (error) {
        console.error("Failed to load staff:", error);
        toast.error("Failed to load staff information");
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-foreground mb-4">Person not found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const formatDate = (date: { year: number | null; month: number | null; day: number | null }) => {
    if (!date.year) return null;
    const parts = [];
    if (date.month) parts.push(new Date(2000, date.month - 1).toLocaleString('default', { month: 'long' }));
    if (date.day) parts.push(date.day + ',');
    parts.push(date.year);
    return parts.join(' ');
  };

  // Separate works by type
  const animeWorks = staff.staffMedia?.edges?.filter(e => e.node.type === 'ANIME') || [];
  const mangaWorks = staff.staffMedia?.edges?.filter(e => e.node.type === 'MANGA' && e.node.format !== 'NOVEL') || [];
  const novelWorks = staff.staffMedia?.edges?.filter(e => e.node.format === 'NOVEL') || [];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <img
          src={staff.image.large}
          alt={staff.name.full}
          className="w-48 h-64 rounded-xl object-cover shadow-elevated border-2 border-border"
        />

        <div className="flex-1">
          <h1 className="text-4xl font-black text-foreground mb-2">{staff.name.full}</h1>
          
          {staff.name.native && (
            <p className="text-xl text-muted-foreground mb-4">{staff.name.native}</p>
          )}

          {staff.primaryOccupations && staff.primaryOccupations.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {staff.primaryOccupations.map((occ, idx) => (
                <Badge key={idx} variant="secondary">{occ}</Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            {staff.dateOfBirth && formatDate(staff.dateOfBirth) && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Born: {formatDate(staff.dateOfBirth)}</span>
              </div>
            )}
            {staff.age && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Age: {staff.age}</span>
              </div>
            )}
            {staff.homeTown && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{staff.homeTown}</span>
              </div>
            )}
          </div>

          {staff.yearsActive && staff.yearsActive.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Active: {staff.yearsActive[0]} - {staff.yearsActive[1] || 'Present'}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {staff.description && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">About</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {staff.description.replace(/<[^>]*>/g, "").replace(/~!.*?!~/g, "")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Works */}
      <Tabs defaultValue="anime" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="anime" className="gap-2">
            <Tv className="w-4 h-4" />
            Anime ({animeWorks.length})
          </TabsTrigger>
          <TabsTrigger value="manga" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Manga ({mangaWorks.length})
          </TabsTrigger>
          <TabsTrigger value="novels" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Light Novels ({novelWorks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anime">
          {animeWorks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {animeWorks.map((work, idx) => (
                <Card 
                  key={idx}
                  className="overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                  onClick={() => navigate(`/anime/${work.node.id}`)}
                >
                  <img
                    src={work.node.coverImage?.medium || '/placeholder.svg'}
                    alt={work.node.title.romaji}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {work.node.title.english || work.node.title.romaji}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{work.staffRole}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No anime works found</p>
          )}
        </TabsContent>

        <TabsContent value="manga">
          {mangaWorks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mangaWorks.map((work, idx) => (
                <Card 
                  key={idx}
                  className="overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                  onClick={() => navigate(`/manga/${work.node.id}`)}
                >
                  <img
                    src={work.node.coverImage?.medium || '/placeholder.svg'}
                    alt={work.node.title.romaji}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {work.node.title.english || work.node.title.romaji}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{work.staffRole}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No manga works found</p>
          )}
        </TabsContent>

        <TabsContent value="novels">
          {novelWorks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {novelWorks.map((work, idx) => (
                <Card 
                  key={idx}
                  className="overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                  onClick={() => navigate(`/novel/${work.node.id}`)}
                >
                  <img
                    src={work.node.coverImage?.medium || '/placeholder.svg'}
                    alt={work.node.title.romaji}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {work.node.title.english || work.node.title.romaji}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{work.staffRole}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No light novel works found</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffDetail;
