export type Card = {
  id: string;
  index: number;
  pokemon_cards: {
    id: string;
    name: string;
    image_small: string | null;
    image_large: string | null;
    number?: string | null;
    rarity?: string | null;
    artist?: string | null;
    pokemon_sets?: {
      name: string;
      id: string;
      tcgplayer_group_id?: number | null;
    } | null;
    tcgplayer_product_id?: number | null;
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

// TCGPlayer / TCGCSV
export interface TCGPlayerProduct {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl?: string;
  categoryId?: number;
  groupId?: number;
  url?: string;
  modifiedOn?: string;
  imageCount?: number;
  presaleInfo?: {
    isPresale: boolean;
    releasedOn: string | null;
    note: string | null;
  };
  extendedData: Array<{
    name: string;
    displayName: string;
    value: string;
  }>;
}

export interface TCGPlayerPricing {
  productId: number;
  lowPrice: number | null;
  midPrice: number | null;
  highPrice: number | null;
  marketPrice: number | null;
  directLowPrice: number | null;
  subTypeName?: string;
}

export interface TCGPlayerCategory {
  categoryId: number;
  name: string;
  displayName: string;
  seoCategoryName: string;
  sealedLabel: string;
  nonSealedLabel: string;
  conditionGuideUrl: string;
  isScannable: boolean;
  popularity: number;
}

export interface TCGPlayerGroup {
  groupId: number;
  name: string;
  abbreviation: string;
  isSupplemental: boolean;
  publishedOn: string;
  modifiedOn: string;
  categoryId: number;
}

export interface TCGCSVApiResponse<T> {
  success: boolean;
  errors: string[];
  results: T[];
}

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
