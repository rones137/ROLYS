import { AnimeData } from "@/types/anime";
import { AnimeCard } from "./AnimeCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

interface AnimeCarouselProps {
  title: string;
  animes: AnimeData[];
  icon?: React.ReactNode;
  onAnimeClick?: (anime: AnimeData) => void;
}

export const AnimeCarousel = ({ title, animes, icon, onAnimeClick }: AnimeCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    
    const scrollAmount = direction === "left" ? -600 : 600;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    
    // Update button visibility after scroll
    setTimeout(checkScrollButtons, 300);
  };

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
  };

  if (!animes || animes.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 relative group">
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className="text-primary">{icon}</div>}
        <h2 className="text-3xl font-bold text-foreground border-l-4 border-primary pl-4">
          {title}
        </h2>
      </div>

      {showLeftButton && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-background/90 backdrop-blur-sm hover:bg-primary rounded-r-xl text-foreground hover:text-primary-foreground shadow-elevated opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {showRightButton && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-background/90 backdrop-blur-sm hover:bg-primary rounded-l-xl text-foreground hover:text-primary-foreground shadow-elevated opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide py-4 snap-x snap-mandatory"
        onScroll={checkScrollButtons}
      >
        {animes.map((anime) => (
          <div key={anime.mal_id} className="snap-start w-[180px] flex-shrink-0">
            <AnimeCard
              anime={anime}
              variant="compact"
              onClick={() => onAnimeClick?.(anime)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
