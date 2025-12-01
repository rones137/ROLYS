import { AnimeData } from "@/types/anime";
import { Star, Plus, Check } from "lucide-react";
import { useState } from "react";
import { addToMyList, removeFromMyList, isInMyList } from "@/lib/storage";
import { toast } from "sonner";

interface AnimeCardProps {
  anime: AnimeData;
  onClick?: () => void;
  variant?: "default" | "compact";
}

export const AnimeCard = ({ anime, onClick, variant = "default" }: AnimeCardProps) => {
  const [inList, setInList] = useState(isInMyList(anime.mal_id));
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (inList) {
      removeFromMyList(anime.mal_id);
      setInList(false);
      toast.success("Removed from My List");
    } else {
      addToMyList({
        ...anime,
        addedAt: Date.now(),
        watchStatus: "plan-to-watch",
      });
      setInList(true);
      toast.success("Added to My List");
    }
  };

  const imageUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const title = anime.title_english || anime.title;
  const genre = anime.genres?.[0]?.name || anime.type || "Anime";

  if (variant === "compact") {
    return (
      <div
        className="group relative w-40 flex-shrink-0 cursor-pointer"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-xl bg-card aspect-[2/3] border border-border shadow-lg hover:shadow-glow-red transition-all duration-300 hover:scale-[1.03]">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <button
            onClick={handleAddToList}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary"
            aria-label={inList ? "Remove from list" : "Add to list"}
          >
            {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="mt-2 px-1">
          <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {title}
          </h4>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground truncate">{genre}</span>
            {anime.score && (
              <div className="flex items-center gap-1 text-xs font-bold text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" />
                {anime.score.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden border border-border shadow-lg hover:shadow-glow-red transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <button
          onClick={handleAddToList}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:scale-110"
          aria-label={inList ? "Remove from list" : "Add to list"}
        >
          {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {title}
        </h3>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{genre}</span>
          {anime.score && (
            <div className="flex items-center gap-1 font-bold text-yellow-400">
              <Star className="w-4 h-4 fill-yellow-400" />
              {anime.score.toFixed(1)}
            </div>
          )}
        </div>

        {anime.synopsis && isHovered && (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-3 animate-in fade-in duration-300">
            {anime.synopsis}
          </p>
        )}
      </div>
    </div>
  );
};
