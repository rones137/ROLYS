import { MyListItem, MediaCategory } from "@/types/anime";

const MY_LIST_KEY = "animerunch_my_list";

export const getMyList = (): MyListItem[] => {
  try {
    const stored = localStorage.getItem(MY_LIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load my list:", error);
    return [];
  }
};

export const saveMyList = (list: MyListItem[]): void => {
  try {
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
  } catch (error) {
    console.error("Failed to save my list:", error);
  }
};

export const addToMyList = (item: Omit<MyListItem, 'addedAt' | 'userRank'>, category?: MediaCategory): void => {
  const list = getMyList();
  const itemCategory = category || detectCategory(item);
  const exists = list.find(i => i.anilist_id === item.anilist_id || i.mal_id === item.mal_id);
  
  if (!exists) {
    // Calculate rank for this category and genre
    const sameCategory = list.filter(i => i.category === itemCategory && i.genre === (item.genre || 'All'));
    const maxRank = sameCategory.length > 0 ? Math.max(...sameCategory.map(i => i.userRank || 0)) : 0;
    
    list.push({
      ...item,
      addedAt: Date.now(),
      category: itemCategory,
      userRank: maxRank + 1,
    });
    saveMyList(list);
  }
};

export const removeFromMyList = (id: number): void => {
  const list = getMyList();
  const filtered = list.filter(item => item.anilist_id !== id && item.mal_id !== id);
  saveMyList(filtered);
};

export const updateMyListItem = (id: number, updates: Partial<MyListItem>): void => {
  const list = getMyList();
  const index = list.findIndex(item => item.anilist_id === id || item.mal_id === id);
  
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveMyList(list);
  }
};

export const isInMyList = (id: number): boolean => {
  const list = getMyList();
  return list.some(item => item.anilist_id === id || item.mal_id === id);
};

export const getMyListByCategory = (category: MediaCategory): MyListItem[] => {
  const list = getMyList();
  return list.filter(item => item.category === category);
};

export const getMyListByCategoryAndGenre = (category: MediaCategory, genre: string): MyListItem[] => {
  const list = getMyList();
  if (genre === 'All') {
    return list.filter(item => item.category === category);
  }
  return list.filter(item => item.category === category && item.genre === genre);
};

export const updateRank = (id: number, newRank: number, category: MediaCategory, genre: string): void => {
  const list = getMyList();
  const categoryList = list.filter(item => 
    item.category === category && 
    (genre === 'All' || item.genre === genre)
  ).sort((a, b) => (a.userRank || 0) - (b.userRank || 0));
  
  const itemIndex = categoryList.findIndex(item => item.anilist_id === id || item.mal_id === id);
  if (itemIndex === -1) return;
  
  const [movedItem] = categoryList.splice(itemIndex, 1);
  categoryList.splice(newRank - 1, 0, movedItem);
  
  // Re-assign ranks
  categoryList.forEach((item, index) => {
    const fullListIndex = list.findIndex(i => i.anilist_id === item.anilist_id || i.mal_id === item.mal_id);
    if (fullListIndex !== -1) {
      list[fullListIndex].userRank = index + 1;
    }
  });
  
  saveMyList(list);
};

export const reorderList = (sourceIndex: number, destinationIndex: number, category: MediaCategory, genre: string): void => {
  if (sourceIndex === destinationIndex) return;
  
  const list = getMyList();
  const categoryList = list.filter(item => 
    item.category === category && 
    (genre === 'All' || item.genre === genre)
  ).sort((a, b) => (a.userRank || 0) - (b.userRank || 0));
  
  const [removed] = categoryList.splice(sourceIndex, 1);
  categoryList.splice(destinationIndex, 0, removed);
  
  // Re-assign ranks
  categoryList.forEach((item, index) => {
    const fullListIndex = list.findIndex(i => i.anilist_id === item.anilist_id || i.mal_id === item.mal_id);
    if (fullListIndex !== -1) {
      list[fullListIndex].userRank = index + 1;
    }
  });
  
  saveMyList(list);
};

// Detect category from media type/format
export const detectCategory = (item: Partial<MyListItem>): MediaCategory => {
  const type = item.type?.toUpperCase() || '';
  const mediaType = item.mediaType?.toUpperCase() || '';
  
  if (mediaType === 'ANIME' || ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'].includes(type)) {
    return 'Anime';
  }
  
  if (type === 'NOVEL') {
    return 'Light Novel';
  }
  
  if (type === 'MANHWA') {
    return 'Manhwa';
  }
  
  if (type === 'MANHUA') {
    return 'Manhua';
  }
  
  return 'Manga';
};
