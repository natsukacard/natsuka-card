CREATE OR REPLACE FUNCTION "public"."search_cards_jp"("search_term" "text", "set_filter" "text" DEFAULT NULL::"text", "rarity_filter" "text" DEFAULT NULL::"text", "sort_by" "text" DEFAULT 'relevance'::"text", "sort_direction" "text" DEFAULT 'desc'::"text") RETURNS TABLE("id" "text", "name" "text", "image_small" "text", "image_large" "text", "set_name" "text", "card_number" "text", "rarity" "text", "artist" "text", "match_type" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  search_parts TEXT[];
  term1 TEXT := '';
  term2 TEXT := '';
  term3 TEXT := '';
  final_set TEXT := '';
  final_card TEXT := '';
  final_artist TEXT := '';
  where_parts TEXT[] := ARRAY[]::TEXT[];
  where_clause TEXT := '';
BEGIN
  IF search_term !~ ',' THEN
    RETURN QUERY
    SELECT
      pc.id::TEXT, pc.name, pc.image_small, pc.image_large,
      COALESCE(ps.name, '') as set_name,
      COALESCE(pc.number, '') as card_number,
      COALESCE(pc.rarity, '') as rarity,
      COALESCE(pc.artist, '') as artist,
      CASE
        WHEN pc.name ILIKE search_term THEN 'exact'
        WHEN pc.name ILIKE search_term || '%' THEN 'starts_with'
        WHEN ps.name ILIKE search_term OR ps.name ILIKE '%' || search_term || '%' THEN 'set_match'
        WHEN pc.name ILIKE '%' || search_term || '%' THEN 'contains'
        ELSE 'fuzzy'
      END as match_type
    FROM pokemon_cards_jp pc
    LEFT JOIN pokemon_sets_jp ps ON pc.set_id = ps.id
    WHERE
      (
        pc.name ILIKE '%' || search_term || '%' OR
        ps.name ILIKE '%' || search_term || '%'
      )
      AND (set_filter IS NULL OR ps.name ILIKE '%' || set_filter || '%')
      AND (rarity_filter IS NULL OR pc.rarity ILIKE '%' || rarity_filter || '%')
    ORDER BY
      CASE 
        WHEN sort_by = 'relevance' THEN
          CASE
            WHEN pc.name ILIKE search_term THEN 1
            WHEN pc.name ILIKE search_term || '%' THEN 2
            WHEN ps.name ILIKE search_term OR ps.name ILIKE '%' || search_term || '%' THEN 2.5
            WHEN pc.name ILIKE '%' || search_term || '%' THEN 4
            ELSE 5
          END
      END ASC,
      CASE 
        WHEN sort_by = 'name' AND sort_direction = 'asc' THEN pc.name
      END ASC,
      CASE 
        WHEN sort_by = 'name' AND sort_direction = 'desc' THEN pc.name
      END DESC,
      CASE 
        WHEN sort_by = 'set' AND sort_direction = 'asc' THEN ps.name
      END ASC,
      CASE 
        WHEN sort_by = 'set' AND sort_direction = 'desc' THEN ps.name
      END DESC,
      CASE 
        WHEN sort_by = 'number' AND sort_direction = 'asc' THEN LPAD(pc.number, 10, '0')
      END ASC,
      CASE 
        WHEN sort_by = 'number' AND sort_direction = 'desc' THEN LPAD(pc.number, 10, '0')
      END DESC,
      CASE 
        WHEN sort_by = 'rarity' AND sort_direction = 'asc' THEN pc.rarity
      END ASC,
      CASE 
        WHEN sort_by = 'rarity' AND sort_direction = 'desc' THEN pc.rarity
      END DESC,
      CASE 
        WHEN sort_by = 'artist' AND sort_direction = 'asc' THEN pc.artist
      END ASC,
      CASE 
        WHEN sort_by = 'artist' AND sort_direction = 'desc' THEN pc.artist
      END DESC,
      pc.name ASC;
    RETURN;
  END IF;

  search_parts := string_to_array(search_term, ',');
  term1 := trim(search_parts[1]);
  term2 := trim(search_parts[2]);
  IF array_length(search_parts, 1) >= 3 THEN
    term3 := trim(search_parts[3]);
  END IF;

  IF EXISTS(
    SELECT 1 FROM pokemon_cards_jp pc
    LEFT JOIN pokemon_sets_jp ps ON pc.set_id = ps.id
    WHERE pc.name ILIKE '%' || term2 || '%' 
    AND ps.name ILIKE '%' || term1 || '%'
  ) THEN
    final_set := term1;
    final_card := term2;
  ELSIF EXISTS(
    SELECT 1 FROM pokemon_cards_jp pc
    LEFT JOIN pokemon_sets_jp ps ON pc.set_id = ps.id
    WHERE pc.name ILIKE '%' || term1 || '%' 
    AND ps.name ILIKE '%' || term2 || '%'
  ) THEN
    final_set := term2;
    final_card := term1;
  ELSIF EXISTS(
    SELECT 1 FROM pokemon_cards_jp pc
    WHERE pc.name ILIKE '%' || term1 || '%' 
    AND pc.artist ILIKE '%' || term2 || '%'
  ) THEN
    final_card := term1;
    final_artist := term2;
  ELSIF EXISTS(
    SELECT 1 FROM pokemon_cards_jp pc
    WHERE pc.name ILIKE '%' || term2 || '%' 
    AND pc.artist ILIKE '%' || term1 || '%'
  ) THEN
    final_card := term2;
    final_artist := term1;
  ELSE
    final_set := term1;
    final_card := term2;
  END IF;

  IF term3 != '' THEN
    final_artist := term3;
  END IF;

  where_parts := ARRAY['1=1'];

  IF final_card != '' THEN
    where_parts := array_append(where_parts, format('pc.name ILIKE %L', '%' || final_card || '%'));
  END IF;

  IF final_set != '' THEN
    where_parts := array_append(where_parts, format('ps.name ILIKE %L', '%' || final_set || '%'));
  END IF;

  IF final_artist != '' THEN
    where_parts := array_append(where_parts, format('pc.artist ILIKE %L', '%' || final_artist || '%'));
  END IF;

  IF rarity_filter IS NOT NULL THEN
    where_parts := array_append(where_parts, format('pc.rarity ILIKE %L', '%' || rarity_filter || '%'));
  END IF;

  where_clause := array_to_string(where_parts, ' AND ');

  RETURN QUERY EXECUTE format('
    SELECT
      pc.id::TEXT, pc.name, pc.image_small, pc.image_large,
      COALESCE(ps.name, '''') as set_name,
      COALESCE(pc.number, '''') as card_number,
      COALESCE(pc.rarity, '''') as rarity,
      COALESCE(pc.artist, '''') as artist,
      ''multi_match'' as match_type
    FROM pokemon_cards_jp pc
    LEFT JOIN pokemon_sets_jp ps ON pc.set_id = ps.id
    WHERE %s
    ORDER BY
      CASE 
        WHEN %L = ''relevance'' THEN
          CASE
            WHEN pc.name ILIKE %L THEN 1
            WHEN pc.name ILIKE %L THEN 2
            ELSE 3
          END
      END ASC,
      CASE 
        WHEN %L = ''name'' AND %L = ''asc'' THEN pc.name
      END ASC,
      CASE 
        WHEN %L = ''name'' AND %L = ''desc'' THEN pc.name
      END DESC,
      CASE 
        WHEN %L = ''set'' AND %L = ''asc'' THEN ps.name
      END ASC,
      CASE 
        WHEN %L = ''set'' AND %L = ''desc'' THEN ps.name
      END DESC,
      CASE 
        WHEN %L = ''number'' AND %L = ''asc'' THEN LPAD(pc.number, 10, ''0'')
      END ASC,
      CASE 
        WHEN %L = ''number'' AND %L = ''desc'' THEN LPAD(pc.number, 10, ''0'')
      END DESC,
      CASE 
        WHEN %L = ''rarity'' AND %L = ''asc'' THEN pc.rarity
      END ASC,
      CASE 
        WHEN %L = ''rarity'' AND %L = ''desc'' THEN pc.rarity
      END DESC,
      CASE 
        WHEN %L = ''artist'' AND %L = ''asc'' THEN pc.artist
      END ASC,
      CASE 
        WHEN %L = ''artist'' AND %L = ''desc'' THEN pc.artist
      END DESC,
      pc.name ASC',
    where_clause,
    sort_by, final_card, final_card || '%',
    sort_by, sort_direction,
    sort_by, sort_direction,
    sort_by, sort_direction,
    sort_by, sort_direction,
    sort_by, sort_direction,
    sort_by, sort_direction,
    sort_by, sort_direction,
    sort_by, sort_direction,
    sort_by, sort_direction,
    sort_by, sort_direction
  );
END;
$$;
