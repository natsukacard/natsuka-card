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
