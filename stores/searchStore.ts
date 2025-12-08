import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchState {
  searchTerm: string;
  recentSearches: string[];
  filters: {
    setFilter?: string;
    rarityFilter?: string;
    sortBy: 'relevance' | 'name' | 'set' | 'rarity' | 'artist' | 'number';
    sortDirection: 'asc' | 'desc';
  };
  setSearchTerm: (term: string) => void;
  addRecentSearch: (term: string) => void;
  updateFilters: (filters: Partial<SearchState['filters']>) => void;
  clearFilters: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      searchTerm: '',
      recentSearches: [],
      filters: {
        sortBy: 'relevance',
        sortDirection: 'desc',
      },
      setSearchTerm: (term) => set({ searchTerm: term }),
      addRecentSearch: (term) => {
        const { recentSearches } = get();
        const filtered = recentSearches.filter((s) => s !== term);
        set({ recentSearches: [term, ...filtered].slice(0, 10) });
      },
      updateFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      clearFilters: () =>
        set({
          filters: {
            setFilter: undefined,
            rarityFilter: undefined,
            sortBy: 'relevance',
            sortDirection: 'desc',
          },
        }),
    }),
    { name: 'search-store' }
  )
);
