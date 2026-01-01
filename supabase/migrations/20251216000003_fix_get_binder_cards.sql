DROP FUNCTION IF EXISTS get_binder_cards(UUID);

CREATE OR REPLACE FUNCTION get_binder_cards(binder_id_param UUID)
RETURNS TABLE (
  id UUID,
  index BIGINT,
  quantity INTEGER,
  condition TEXT,
  graded TEXT,
  owned BOOLEAN,
  notes TEXT,
  pokemon_card_id TEXT,
  language TEXT,
  card_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.index,
    c.quantity,
    c.condition,
    c.graded,
    c.owned,
    c.notes,
    c.pokemon_card_id,
    c.language,
    CASE 
      WHEN c.language = 'en' THEN
        jsonb_build_object(
          'id', pc_en.id,
          'name', pc_en.name,
          'image_small', pc_en.image_small,
          'image_large', pc_en.image_large,
          'number', pc_en.number,
          'artist', pc_en.artist,
          'rarity', pc_en.rarity,
          'set', jsonb_build_object(
            'name', ps_en.name,
            'id', ps_en.id,
            'release_date', ps_en.release_date
          )
        )
      WHEN c.language = 'jp' THEN
        jsonb_build_object(
          'id', pc_jp.id,
          'name', pc_jp.name,
          'image_small', pc_jp.image_small,
          'image_large', pc_jp.image_large,
          'number', pc_jp.number,
          'artist', pc_jp.artist,
          'rarity', pc_jp.rarity,
          'set', jsonb_build_object(
            'name', ps_jp.name,
            'id', ps_jp.id,
            'release_date', ps_jp.release_date
          )
        )
      ELSE NULL
    END as card_data
  FROM cards c
  LEFT JOIN pokemon_cards pc_en ON c.pokemon_card_id = pc_en.id AND c.language = 'en'
  LEFT JOIN pokemon_sets ps_en ON pc_en.set_id = ps_en.id
  LEFT JOIN pokemon_cards_jp pc_jp ON c.pokemon_card_id = pc_jp.id AND c.language = 'jp'
  LEFT JOIN pokemon_sets_jp ps_jp ON pc_jp.set_id = ps_jp.id
  WHERE c.binder_id = binder_id_param
  ORDER BY c.index;
END;
$$ LANGUAGE plpgsql;
