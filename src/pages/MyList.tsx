import { useState, useEffect, useMemo, useCallback } from "react";
import { MyListItem, MediaCategory, CATEGORIES, GENRES_MAP } from "@/types/anime";
import { 
  getMyList, 
  getMyListByCategoryAndGenre, 
  removeFromMyList, 
  updateRank, 
  updateMyListItem,
  addToMyList,
  detectCategory
} from "@/lib/storage";
import { searchAllMedia, convertToAnimeData, AniListMedia } from "@/lib/anilist";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  List, Search, Star, Trash2, Edit3, Shuffle, Share2, 
  Tv, BookOpen, BookText, Globe, ChevronDown, Check, GripVertical,
  Plus, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_ICONS: Record<MediaCategory, React.ReactNode> = {
  'Anime': <Tv className="w-4 h-4" />,
  'Manga': <BookOpen className="w-4 h-4" />,
  'Light Novel': <BookText className="w-4 h-4" />,
  'Manhwa': <Globe className="w-4 h-4" />,
  'Manhua': <Globe className="w-4 h-4" />,
};

const MyList = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>('Anime');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AniListMedia[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userList, setUserList] = useState<MyListItem[]>([]);
  const [editingRank, setEditingRank] = useState<number | null>(null);
  const [newRankValue, setNewRankValue] = useState('');

  useEffect(() => {
    loadList();
  }, []);

  const loadList = () => {
    setUserList(getMyList());
  };

  const filteredList = useMemo(() => {
    return userList
      .filter(item => item.category === selectedCategory)
      .filter(item => selectedGenre === 'All' || item.genre === selectedGenre)
      .sort((a, b) => (a.userRank || 0) - (b.userRank || 0));
  }, [userList, selectedCategory, selectedGenre]);

  const handleCategoryChange = (category: MediaCategory) => {
    setSelectedCategory(category);
    setSelectedGenre('All');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchAllMedia(query, 1, 10);
      
      // Filter results based on selected category
      let filtered: AniListMedia[] = [];
      if (selectedCategory === 'Anime') {
        filtered = results.anime;
      } else if (selectedCategory === 'Manga') {
        filtered = results.manga.filter(m => m.format !== 'MANHWA' && m.format !== 'MANHUA');
      } else if (selectedCategory === 'Light Novel') {
        filtered = results.novels;
      } else if (selectedCategory === 'Manhwa') {
        filtered = results.manga.filter(m => m.format === 'MANHWA');
      } else if (selectedCategory === 'Manhua') {
        filtered = results.manga.filter(m => m.format === 'MANHUA');
      }
      
      setSearchResults(filtered);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToList = (item: AniListMedia) => {
    const converted = convertToAnimeData(item);
    const primaryGenre = item.genres?.[0] || 'All';
    
    // Check if already exists
    const exists = userList.find(i => i.anilist_id === item.id);
    if (exists) {
      toast.error(`"${item.title.english || item.title.romaji}" is already in your list!`);
      return;
    }

    addToMyList({
      ...converted,
      watchStatus: 'plan-to-watch',
      category: selectedCategory,
      genre: primaryGenre,
    });
    
    loadList();
    setSearchQuery('');
    setSearchResults([]);
    toast.success(`Added "${item.title.english || item.title.romaji}" to your list!`);
  };

  const handleRemoveFromList = (item: MyListItem) => {
    const id = item.anilist_id || item.mal_id;
    removeFromMyList(id);
    loadList();
    toast.success('Removed from list');
  };

  const handleUpdateRank = (item: MyListItem) => {
    const newRank = parseInt(newRankValue);
    if (isNaN(newRank) || newRank < 1 || newRank > filteredList.length) {
      toast.error(`Rank must be between 1 and ${filteredList.length}`);
      return;
    }
    
    const id = item.anilist_id || item.mal_id;
    updateRank(id, newRank, selectedCategory, selectedGenre);
    loadList();
    setEditingRank(null);
    setNewRankValue('');
  };

  const handleRandomPick = () => {
    if (filteredList.length === 0) {
      toast.error("Your list is empty! Add some titles first.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredList.length);
    const randomItem = filteredList[randomIndex];
    toast.success(`Random pick: ${randomItem.title_english || randomItem.title} (#${randomItem.userRank})!`);
  };

  const handleItemClick = (item: MyListItem) => {
    const id = item.anilist_id || item.mal_id;
    navigate(`/anime/${id}`);
  };

  const getCounts = () => {
    const counts: Record<MediaCategory, number> = {
      'Anime': 0,
      'Manga': 0,
      'Light Novel': 0,
      'Manhwa': 0,
      'Manhua': 0,
    };
    userList.forEach(item => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });
    return counts;
  };

  const counts = getCounts();

  const ListEntry = ({ item, index }: { item: MyListItem; index: number }) => {
    const isEditing = editingRank === item.anilist_id || editingRank === item.mal_id;
    const isTop3 = index < 3;

    return (
      <Card className={`mb-3 transition-all duration-200 border-l-4 ${isTop3 ? 'border-l-yellow-400' : 'border-l-primary'} hover:bg-muted/50`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 text-center">
              {isEditing ? (
                <Input
                  type="number"
                  value={newRankValue}
                  onChange={(e) => setNewRankValue(e.target.value)}
                  className="w-14 text-center h-8"
                  min="1"
                  max={filteredList.length}
                  autoFocus
                />
              ) : (
                <span className="text-2xl font-black text-primary">#{item.userRank}</span>
              )}
            </div>

            <div 
              className="w-16 h-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg"
              onClick={() => handleItemClick(item)}
            >
              <img
                src={item.images?.jpg?.image_url || item.images?.jpg?.large_image_url}
                alt={item.title}
                className="w-full h-full object-cover hover:scale-110 transition-transform"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 
                className="text-lg font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleItemClick(item)}
              >
                {item.title_english || item.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {CATEGORY_ICONS[item.category]}
                  <span className="ml-1">{item.category}</span>
                </Badge>
                {item.genre && item.genre !== 'All' && (
                  <Badge variant="outline" className="text-xs">{item.genre}</Badge>
                )}
                {item.score && (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400" />
                    {item.score.toFixed(1)}
                  </span>
                )}
              </div>
              {item.notes && (
                <p className="text-xs italic text-muted-foreground mt-1 truncate">
                  Note: {item.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateRank(item)}
                    className="text-green-500 hover:text-green-400"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingRank(null);
                      setNewRankValue('');
                    }}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingRank(item.anilist_id || item.mal_id);
                      setNewRankValue(String(item.userRank || 1));
                    }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFromList(item)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-foreground border-l-4 border-primary pl-4 flex items-center gap-3">
          <List className="w-8 h-8 text-primary" />
          My Personal Ranking List
        </h1>
        <p className="text-muted-foreground pl-5">
          Track and rank your favorite anime, manga, and light novels
        </p>
      </div>

      {/* Category Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">1. Select Content Type</h3>
        <div className="flex flex-wrap gap-3 mb-6">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => handleCategoryChange(cat)}
              className="gap-2"
            >
              {CATEGORY_ICONS[cat]}
              {cat}
              <Badge variant="secondary" className="ml-1">{counts[cat]}</Badge>
            </Button>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-4">2. Filter by Genre ({selectedCategory})</h3>
        <div className="flex flex-wrap gap-2">
          {GENRES_MAP[selectedCategory]?.map(genre => (
            <Button
              key={genre}
              variant={selectedGenre === genre ? "default" : "outline"}
              size="sm"
              onClick={() => handleGenreChange(genre)}
            >
              {genre}
            </Button>
          ))}
        </div>
      </Card>

      {/* Search and Add */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">3. Search & Add Titles</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search for ${selectedCategory} titles to add...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isSearching && (
          <div className="text-center py-4 text-muted-foreground">Searching...</div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.coverImage.medium}
                    alt={item.title.romaji}
                    className="w-10 h-14 object-cover rounded"
                  />
                  <div>
                    <span className="font-medium text-foreground">
                      {item.title.english || item.title.romaji}
                    </span>
                    {item.title.native && (
                      <span className="text-xs text-muted-foreground block">{item.title.native}</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddToList(item)}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchQuery && !isSearching && searchResults.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            No results found for "{searchQuery}"
          </p>
        )}
      </Card>

      {/* Cool Features */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleRandomPick} className="gap-2">
            <Shuffle className="w-4 h-4" />
            Random Pick
          </Button>
          <Button 
            variant="outline" 
            onClick={() => toast.success("Share link copied! (Coming soon)")}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share List
          </Button>
        </div>
      </Card>

      {/* User's List */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2 border-b-2 border-primary pb-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          Your Ranked List: {selectedGenre !== 'All' ? `${selectedGenre} ` : ''}{selectedCategory}
          <Badge variant="secondary" className="ml-2">{filteredList.length}</Badge>
        </h3>

        {filteredList.length > 0 ? (
          <div className="space-y-3">
            {filteredList.map((item, index) => (
              <ListEntry key={item.anilist_id || item.mal_id} item={item} index={index} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <List className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-foreground mb-2">Your list is empty</h4>
            <p className="text-muted-foreground">
              Start searching and adding titles above to build your {selectedCategory} ranking!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyList;
