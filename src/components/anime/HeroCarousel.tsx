import { AnimeData } from "@/types/anime";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToMyList, isInMyList, removeFromMyList } from "@/lib/storage";
import { toast } from "sonner";

interface HeroCarouselProps {
  animes: AnimeData[];
  onAnimeClick?: (anime: AnimeData) => void;
}

export const HeroCarousel = ({ animes, onAnimeClick }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inList, setInList] = useState(false);

  const currentAnime = animes[currentIndex];

  useEffect(() => {
    if (currentAnime) {
      setInList(isInMyList(currentAnime.mal_id));
    }
  }, [currentAnime]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % animes.length);
  }, [animes.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length);
  }, [animes.length]);

  useEffect(() => {
    if (animes.length <= 1) return;
    
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, [nextSlide, animes.length]);

  const handleToggleList = () => {
    if (!currentAnime) return;

    if (inList) {
      removeFromMyList(currentAnime.mal_id);
      setInList(false);
      toast.success("Removed from My List");
    } else {
      addToMyList({
        ...currentAnime,
        addedAt: Date.now(),
        watchStatus: "plan-to-watch",
      });
      setInList(true);
      toast.success("Added to My List");
    }
  };

  if (!animes || animes.length === 0) {
    return null;
  }

  if (!currentAnime) return null;

  const imageUrl = currentAnime.images?.jpg?.large_image_url || currentAnime.images?.jpg?.image_url;
  const title = currentAnime.title_english || currentAnime.title;

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-elevated mb-12 group">
      {/* Background Image with Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/60" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end p-12 max-w-7xl mx-auto">
        <div className="max-w-2xl space-y-6">
          {currentAnime.genres && currentAnime.genres.length > 0 && (
            <div className="flex items-center gap-2">
              {currentAnime.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre.mal_id}
                  className="px-3 py-1 bg-primary/20 backdrop-blur-sm text-primary text-sm font-semibold rounded-full border border-primary/30"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-6xl font-black text-foreground leading-tight drop-shadow-2xl">
            {title}
          </h1>

          {currentAnime.synopsis && (
            <p className="text-lg text-foreground/90 line-clamp-3 drop-shadow-lg max-w-xl">
              {currentAnime.synopsis}
            </p>
          )}

          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={() => onAnimeClick?.(currentAnime)}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-full shadow-glow-red"
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Watch Now
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleToggleList}
              className="bg-background/80 backdrop-blur-sm border-2 border-border hover:border-primary font-semibold px-6 py-6 rounded-full"
            >
              {inList ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  In My List
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Add to List
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      {animes.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background/60 backdrop-blur-sm hover:bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background/60 backdrop-blur-sm hover:bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {animes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-12 bg-primary"
                    : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
