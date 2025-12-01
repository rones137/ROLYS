import { useState, useEffect, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface SearchResult {
  anilistId: number;
  episode: number | string;
  time: string;
  similarity: string;
  video: string;
  titleRomaji: string;
  watchLink: string;
}

const Lookup = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageURL, setImageURL] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageURL(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageURL("");
    }
  }, [imageFile]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const searchAnime = async (file: File) => {
    setLoading(true);
    setError("");
    setResult(null);

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("https://api.trace.moe/search?anilistInfo=true", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        const bestMatch = data.result?.[0];

        if (!bestMatch || bestMatch.similarity < 0.8) {
          setError("No close match found. Similarity is too low (requires > 80%).");
          setLoading(false);
          return;
        }

        setResult({
          anilistId: bestMatch.anilist.id,
          episode: bestMatch.episode,
          time: formatTime(bestMatch.from),
          similarity: (bestMatch.similarity * 100).toFixed(2),
          video: bestMatch.video,
          titleRomaji: bestMatch.anilist.title?.romaji || "Unknown Title",
          watchLink: `https://anilist.co/anime/${bestMatch.anilist.id}`,
        });

        toast.success("Match found!");
        setLoading(false);
        return;
      } catch (e: any) {
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error("Anime Search Error:", e);
          setError(`Search failed after multiple retries: ${e.message}`);
        }
      } finally {
        attempt++;
      }
    }

    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setImageFile(file);
    searchAnime(file);
  };

  const handleClear = () => {
    setImageFile(null);
    setImageURL("");
    setResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-foreground border-l-4 border-primary pl-4">
          Anime Scene Lookup
        </h1>
        <p className="text-muted-foreground pl-5">
          Upload a screenshot to find which anime it's from (powered by trace.moe)
        </p>
      </div>

      {/* Upload Area */}
      <Card className="p-8 border-2 border-dashed border-border hover:border-primary transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="imageUpload"
          disabled={loading}
        />
        
        <label
          htmlFor="imageUpload"
          className={`flex flex-col items-center justify-center gap-4 cursor-pointer ${
            loading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Camera className="w-16 h-16 text-primary" />
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-1">
              {loading ? "Analyzing..." : imageURL ? "Image Selected - Click to Change" : "Click or Drag to Upload"}
            </p>
            <p className="text-sm text-muted-foreground">
              Upload an anime screenshot to identify the series and episode
            </p>
          </div>
        </label>

        {imageURL && !loading && (
          <div className="mt-6 relative">
            <img
              src={imageURL}
              alt="Uploaded Scene"
              className="w-full max-h-96 object-contain rounded-lg border border-border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleClear}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Searching anime database...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-destructive/10 border-destructive">
          <p className="text-destructive font-medium">{error}</p>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <Card className="p-8 border-l-4 border-primary">
          <h2 className="text-2xl font-bold text-foreground mb-6">Match Found!</h2>
          
          {/* Video Preview */}
          <video
            src={result.video}
            controls
            autoPlay
            loop
            muted
            className="w-full rounded-lg mb-6 shadow-elevated"
          />

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Anime Title</p>
              <p className="text-lg font-bold text-foreground">{result.titleRomaji}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Episode</p>
              <p className="text-lg font-semibold text-foreground">{result.episode || "Unknown"}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
              <p className="text-lg font-semibold text-foreground">{result.time}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Match Confidence</p>
              <p className="text-lg font-bold text-primary">{result.similarity}%</p>
            </div>
          </div>

          <Button asChild className="w-full bg-gradient-primary hover:opacity-90">
            <a href={result.watchLink} target="_blank" rel="noopener noreferrer">
              View on AniList
            </a>
          </Button>
        </Card>
      )}
    </div>
  );
};

export default Lookup;
