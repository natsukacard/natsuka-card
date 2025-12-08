import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SidebarState {
  searchOpened: boolean;
  selectedSlotIndex: number | null;
  openSearch: () => void;
  closeSearch: () => void;
  setSelectedSlotIndex: (index: number | null) => void;
}

export const useSidebarStore = create<SidebarState>()(
  devtools(
    (set) => ({
      searchOpened: false,
      selectedSlotIndex: null,
      openSearch: () => set({ searchOpened: true }),
      closeSearch: () => set({ searchOpened: false, selectedSlotIndex: null }),
      setSelectedSlotIndex: (index) => set({ selectedSlotIndex: index }),
    }),
    { name: 'sidebar-store' }
  )
);
