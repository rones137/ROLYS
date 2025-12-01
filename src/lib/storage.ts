import { MyListItem } from "@/types/anime";

const MY_LIST_KEY = "animeron_my_list";

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

export const addToMyList = (anime: MyListItem): void => {
  const list = getMyList();
  const exists = list.find(item => item.mal_id === anime.mal_id);
  
  if (!exists) {
    list.push({
      ...anime,
      addedAt: Date.now(),
    });
    saveMyList(list);
  }
};

export const removeFromMyList = (malId: number): void => {
  const list = getMyList();
  const filtered = list.filter(item => item.mal_id !== malId);
  saveMyList(filtered);
};

export const updateMyListItem = (malId: number, updates: Partial<MyListItem>): void => {
  const list = getMyList();
  const index = list.findIndex(item => item.mal_id === malId);
  
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveMyList(list);
  }
};

export const isInMyList = (malId: number): boolean => {
  const list = getMyList();
  return list.some(item => item.mal_id === malId);
};
