export type Card = {
  id: string;
  index: number;
  pokemon_cards: {
    image_small: string | null;
    image_large: string | null;
    name: string;
  } | null;
};

export type Binder = {
  id: string;
  name: string;
  type: string;
  cover_image_url?: string | null;
  is_private: boolean;
  page_rows: number;
  page_columns: number;
  cards: Card[] | null;
};

// Component prop interfaces
export interface BinderGridProps {
  binder: Binder;
  currentPage: number;
  isOwner: boolean;
  onSlotClick: (index: number) => void;
  isDragging: boolean;
  activeCard: Card | null;
  previewSlot: number | null;
  onDeleteCard?: (cardId: string, index: number) => void;
  onInsertBefore?: (index: number) => void;
  onInsertAfter?: (index: number) => void;
  onDeleteEmptySlot?: (index: number) => void;
}

// API and mutation types
export interface UpdateCardPositionsValues {
  binderId: string;
  cards: { id: string; index: number }[];
}

export interface CardSearchResult {
  id: string;
  name: string;
  set?: {
    name: string;
    id: string;
  };
  number?: string;
  rarity?: string;
  images?: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    prices?: {
      holofoil?: {
        market?: number;
      };
      normal?: {
        market?: number;
      };
    };
  };
}

export interface PokemonTCGApiResponse {
  data: CardSearchResult[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface QueryResult<T> {
  data: T | null;
  error: SupabaseError | null;
}

// Supabase mutation context types
export interface MutationContext {
  previousBinder?: Binder;
  optimisticCard?: Card;
}

// Generic response type for API calls
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: SupabaseError;
}
