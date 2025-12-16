

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "stripe";


ALTER SCHEMA "stripe" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "undefined";


ALTER SCHEMA "undefined" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'open',
    'paid',
    'uncollectible',
    'void',
    'deleted'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."pricing_plan_interval" AS ENUM (
    'day',
    'week',
    'month',
    'year'
);


ALTER TYPE "public"."pricing_plan_interval" OWNER TO "postgres";


CREATE TYPE "public"."pricing_tiers" AS ENUM (
    'graduated',
    'volume'
);


ALTER TYPE "public"."pricing_tiers" OWNER TO "postgres";


CREATE TYPE "public"."pricing_type" AS ENUM (
    'one_time',
    'recurring'
);


ALTER TYPE "public"."pricing_type" OWNER TO "postgres";


CREATE TYPE "public"."subscription_schedule_status" AS ENUM (
    'not_started',
    'active',
    'completed',
    'released',
    'canceled'
);


ALTER TYPE "public"."subscription_schedule_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'trialing',
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid',
    'paused'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_card_and_shift"("p_binder_id" "uuid", "p_pokemon_card_id" "text", "p_target_index" integer) RETURNS TABLE("success" boolean, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_user_id uuid := auth.uid(); -- Get current user
  binder_owner_id uuid;
BEGIN
  -- *** Re-added explicit ownership check for debugging ***
  -- This will now explicitly check ownership before attempting the insert.
  -- RLS policies on binders_test will apply to this SELECT.
  SELECT user_id INTO binder_owner_id FROM public.binders_test WHERE id = p_binder_id; -- Checks binders_test
  IF binder_owner_id IS NULL THEN
    -- If this error occurs, the binder doesn't exist or RLS prevents selecting it.
    RETURN QUERY SELECT false, '[TEST Debug] Binder not found or RLS denied SELECT on binders_test.';
    RETURN;
  END IF;
  -- Check against the actual logged-in user
  IF binder_owner_id != current_user_id THEN
     -- If this error occurs, the user calling the function does not own the binder.
     RETURN QUERY SELECT false, '[TEST Debug] Permission denied on TEST binder (User ID mismatch).';
     RETURN;
  END IF;

  -- Ensure target index is not negative
  IF p_target_index < 0 THEN
      RETURN QUERY SELECT false, '[TEST] Target index cannot be negative.';
      RETURN;
  END IF;

  -- Step 1: Shift existing items in the target TEST binder to make space
  -- RLS UPDATE policy on cards_test will be checked here
  UPDATE public.cards_test -- Target TEST table
  SET index = index + 1
  WHERE binder_id = p_binder_id AND index >= p_target_index;

  -- Step 2: Insert the new card entry into the TEST table at the target index
  -- RLS INSERT policy on cards_test will be checked here
  INSERT INTO public.cards_test (binder_id, pokemon_card_id, index) -- Target TEST table
  VALUES (p_binder_id, p_pokemon_card_id, p_target_index);

  -- Return success
  RETURN QUERY SELECT true, 'Card/Slot added successfully to TEST table.';

EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING '[TEST] add_card_and_shift failed: Unique constraint violation. %', SQLERRM;
    RETURN QUERY SELECT false, '[TEST] Failed to add card/slot: Slot index might already be taken or another constraint failed.';
  WHEN others THEN
    RAISE WARNING '[TEST] add_card_and_shift failed: %', SQLERRM;
    RETURN QUERY SELECT false, '[TEST] Failed to add card/slot: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."add_card_and_shift"("p_binder_id" "uuid", "p_pokemon_card_id" "text", "p_target_index" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_card_slot_and_shift"("p_card_slot_id" "uuid") RETURNS TABLE("success" boolean, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  deleted_binder_id uuid;
  deleted_index int;
  current_user_id uuid := auth.uid();
  binder_owner_id uuid;
  rows_affected int;
BEGIN
  -- Step 1: Get the binder_id and index of the card being deleted from TEST table
  -- RLS SELECT policy on cards_test will apply here
  SELECT binder_id, index INTO deleted_binder_id, deleted_index
  FROM public.cards_test -- Target TEST table
  WHERE id = p_card_slot_id;

  IF deleted_binder_id IS NULL THEN
    RETURN QUERY SELECT false, 'TEST Card slot not found or permission denied.';
    RETURN;
  END IF;

  -- Optional: Explicit check against binders_test table owner (Uncomment if needed)
  /*
  SELECT user_id INTO binder_owner_id FROM public.binders_test WHERE id = deleted_binder_id; -- Checks binders_test
  IF binder_owner_id IS NULL OR binder_owner_id != current_user_id THEN
     RETURN QUERY SELECT false, 'Permission denied on TEST binder.';
     RETURN;
  END IF;
  */

  -- Step 2: Delete the specified card slot from TEST table
  -- RLS DELETE policy on cards_test will apply here
  DELETE FROM public.cards_test WHERE id = p_card_slot_id; -- Target TEST table

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  IF rows_affected = 0 THEN
      RETURN QUERY SELECT false, 'Failed to remove slot, likely due to permissions.';
      RETURN;
  END IF;

  -- Step 3: Shift remaining items in the same TEST binder to fill the gap
  -- RLS UPDATE policy on cards_test will apply here
  UPDATE public.cards_test -- Target TEST table
  SET index = index - 1
  WHERE binder_id = deleted_binder_id AND index > deleted_index;

  RETURN QUERY SELECT true, 'TEST Card slot removed successfully.';

EXCEPTION
  WHEN others THEN
    RAISE WARNING '[TEST] delete_card_slot_and_shift failed: %', SQLERRM;
    RETURN QUERY SELECT false, '[TEST] Failed to remove card slot: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."delete_card_slot_and_shift"("p_card_slot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_pokemon_sets"() RETURNS TABLE("search_name" "text", "display_name" "text", "image" "text", "release_date" "date")
    LANGUAGE "sql" STABLE
    AS $$
  select id as search_name, name as display_name, image_logo as image, release_date::date
  from pokemon_sets
  order by release_date
$$;


ALTER FUNCTION "public"."get_all_pokemon_sets"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_distinct_artists"() RETURNS TABLE("search_name" "text")
    LANGUAGE "sql"
    AS $$SELECT DISTINCT artist FROM pokemon_cards;$$;


ALTER FUNCTION "public"."get_distinct_artists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_distinct_card_names"() RETURNS TABLE("search_name" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select distinct name as card_name
  from pokemon_cards
  order by card_name;
$$;


ALTER FUNCTION "public"."get_distinct_card_names"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_distinct_pokemon_subjects"() RETURNS TABLE("search_name" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select distinct unnest(subjects) as search_name
  from pokemon_cards
  where supertype = 'Pokémon'
  order by search_name;
$$;


ALTER FUNCTION "public"."get_distinct_pokemon_subjects"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_distinct_rarities"() RETURNS TABLE("search_name" "text")
    LANGUAGE "sql"
    AS $$SELECT DISTINCT rarity FROM pokemon_cards;$$;


ALTER FUNCTION "public"."get_distinct_rarities"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_card_from_slot"("p_card_slot_id" "uuid") RETURNS TABLE("success" boolean, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_binder_id uuid;
  binder_owner_id uuid;
  rows_affected int;
BEGIN
  -- Get binder_id for potential explicit check from TEST table
  -- RLS SELECT policy on cards_test will apply here
  SELECT binder_id INTO target_binder_id FROM public.cards_test WHERE id = p_card_slot_id; -- Target TEST table

  IF target_binder_id IS NULL THEN
      RETURN QUERY SELECT false, 'TEST Card slot not found or permission denied.';
      RETURN;
  END IF;

  -- Optional: Explicit check against binders_test table owner (Uncomment if needed)
  /*
  SELECT user_id INTO binder_owner_id FROM public.binders_test WHERE id = target_binder_id; -- Checks binders_test
  IF binder_owner_id IS NULL OR binder_owner_id != current_user_id THEN
     RETURN QUERY SELECT false, 'Permission denied on TEST binder.';
     RETURN;
  END IF;
  */

  -- Update the card slot in the TEST table, setting pokemon_card_id to NULL
  -- RLS UPDATE policy on cards_test will apply here
  UPDATE public.cards_test -- Target TEST table
  SET pokemon_card_id = NULL
  WHERE id = p_card_slot_id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  IF rows_affected = 0 THEN
      RETURN QUERY SELECT false, 'Failed to remove card, likely due to permissions.';
      RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Card removed from TEST slot successfully.';

EXCEPTION
  WHEN not_null_violation THEN
      RAISE WARNING '[TEST] remove_card_from_slot failed: Cannot set pokemon_card_id to NULL. %', SQLERRM;
      RETURN QUERY SELECT false, '[TEST] Failed to remove card: Column cannot be empty.';
  WHEN others THEN
    RAISE WARNING '[TEST] remove_card_from_slot failed: %', SQLERRM;
    RETURN QUERY SELECT false, '[TEST] Failed to remove card from slot: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."remove_card_from_slot"("p_card_slot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_cards"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  binder_owner_id UUID;
BEGIN
  -- Check if the user owns the binder
  SELECT user_id INTO binder_owner_id FROM binders WHERE id = p_binder_id;
  IF binder_owner_id IS NULL OR binder_owner_id != p_user_id THEN
    RAISE EXCEPTION 'User does not own the binder or binder not found';
  END IF;

  -- Temporarily remove the dragged card from the sequence
  UPDATE cards
  SET index = -1
  WHERE id = p_dragged_card_id AND binder_id = p_binder_id;

  -- Shift cards between the old and new positions
  IF p_dragged_position < p_target_position THEN
    -- Moving down: shift cards between old and new position up
    UPDATE cards
    SET index = index - 1
    WHERE binder_id = p_binder_id
      AND index > p_dragged_position
      AND index <= p_target_position;
  ELSE
    -- Moving up: shift cards between new and old position down
    UPDATE cards
    SET index = index + 1
    WHERE binder_id = p_binder_id
      AND index >= p_target_position
      AND index < p_dragged_position;
  END IF;

  -- Place the dragged card in the target position
  UPDATE cards
  SET index = p_target_position
  WHERE id = p_dragged_card_id AND binder_id = p_binder_id;

END;
$$;


ALTER FUNCTION "public"."reorder_cards"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_cards_optimized"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  dragged_card RECORD;
  target_card RECORD;
BEGIN
  -- Verify user owns the binder
  IF NOT EXISTS (
    SELECT 1
    FROM binders
    WHERE id = p_binder_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User does not own binder %', p_binder_id;
  END IF;

  -- Get the card being moved
  SELECT * INTO dragged_card
  FROM cards
  WHERE id = p_dragged_card_id AND binder_id = p_binder_id;

  IF dragged_card IS NULL THEN
    RAISE EXCEPTION 'Dragged card % not found in binder %', p_dragged_card_id, p_binder_id;
  END IF;

  -- Get the card at the target position
  SELECT * INTO target_card
  FROM cards
  WHERE binder_id = p_binder_id AND index = p_target_position;

  -- Case 1: Target position is empty
  IF target_card IS NULL THEN
    UPDATE cards
    SET index = p_target_position
    WHERE id = p_dragged_card_id;
  -- Case 2: Target position has a card - swap positions
  ELSE
    -- Use a temporary position to avoid constraint conflicts
    UPDATE cards
    SET index = -1
    WHERE id = p_dragged_card_id;

    UPDATE cards
    SET index = p_dragged_position
    WHERE id = target_card.id;

    UPDATE cards
    SET index = p_target_position
    WHERE id = p_dragged_card_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."reorder_cards_optimized"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_cards"("search_term" "text", "set_filter" "text" DEFAULT NULL::"text", "rarity_filter" "text" DEFAULT NULL::"text", "sort_by" "text" DEFAULT 'relevance'::"text", "sort_direction" "text" DEFAULT 'desc'::"text") RETURNS TABLE("id" "text", "name" "text", "image_small" "text", "image_large" "text", "set_name" "text", "card_number" "text", "rarity" "text", "artist" "text", "match_type" "text")
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
  -- CASE 1: No comma - original logic
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
        WHEN pc.search_vector @@ plainto_tsquery('english', search_term) THEN 'fts'
        WHEN pc.name ILIKE '%' || search_term || '%' THEN 'contains'
        ELSE 'fuzzy'
      END as match_type
    FROM pokemon_cards pc
    LEFT JOIN pokemon_sets ps ON pc.set_id = ps.id
    WHERE
      (
        pc.search_vector @@ plainto_tsquery('english', search_term) OR
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
            WHEN pc.search_vector @@ plainto_tsquery('english', search_term) THEN
              3 - ts_rank(pc.search_vector, plainto_tsquery('english', search_term))
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

  -- CASE 2: Has comma - simple detection logic
  search_parts := string_to_array(search_term, ',');
  term1 := trim(search_parts[1]);
  term2 := trim(search_parts[2]);
  IF array_length(search_parts, 1) >= 3 THEN
    term3 := trim(search_parts[3]);
  END IF;

  -- Simple detection: try both orders for the first two terms
  -- Check if term1 as set, term2 as card works
  IF EXISTS(
    SELECT 1 FROM pokemon_cards pc
    LEFT JOIN pokemon_sets ps ON pc.set_id = ps.id
    WHERE pc.name ILIKE '%' || term2 || '%' 
    AND ps.name ILIKE '%' || term1 || '%'
  ) THEN
    final_set := term1;
    final_card := term2;
  -- Check if term2 as set, term1 as card works
  ELSIF EXISTS(
    SELECT 1 FROM pokemon_cards pc
    LEFT JOIN pokemon_sets ps ON pc.set_id = ps.id
    WHERE pc.name ILIKE '%' || term1 || '%' 
    AND ps.name ILIKE '%' || term2 || '%'
  ) THEN
    final_set := term2;
    final_card := term1;
  -- Check if term1 is card name and term2 is artist
  ELSIF EXISTS(
    SELECT 1 FROM pokemon_cards pc
    WHERE pc.name ILIKE '%' || term1 || '%' 
    AND pc.artist ILIKE '%' || term2 || '%'
  ) THEN
    final_card := term1;
    final_artist := term2;
  -- Check if term2 is card name and term1 is artist  
  ELSIF EXISTS(
    SELECT 1 FROM pokemon_cards pc
    WHERE pc.name ILIKE '%' || term2 || '%' 
    AND pc.artist ILIKE '%' || term1 || '%'
  ) THEN
    final_card := term2;
    final_artist := term1;
  ELSE
    -- Fallback to original order
    final_set := term1;
    final_card := term2;
  END IF;

  -- Handle third term if present
  IF term3 != '' THEN
    final_artist := term3;
  END IF;

  -- Build WHERE clause
  where_parts := ARRAY['1=1']; -- Start with always true condition

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
    FROM pokemon_cards pc
    LEFT JOIN pokemon_sets ps ON pc.set_id = ps.id
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


ALTER FUNCTION "public"."search_cards"("search_term" "text", "set_filter" "text", "rarity_filter" "text", "sort_by" "text", "sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_cards_with_sets"("search_term" "text", "limit_count" integer DEFAULT 18, "sort_by" "text" DEFAULT 'name'::"text", "sort_direction" "text" DEFAULT 'asc'::"text") RETURNS TABLE("id" "text", "name" "text", "image_small" "text", "number" "text", "release_date" "date")
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    order_clause text;
    search_pattern text; -- Variable for the search pattern
BEGIN
    -- Validate sort_by parameter to prevent SQL injection
    IF sort_by NOT IN ('name', 'release_date', 'number') THEN
        sort_by := 'name'; -- Default to name if invalid
    END IF;

    -- Validate sort_direction
    IF sort_direction NOT IN ('asc', 'desc') THEN
        sort_direction := 'asc'; -- Default to asc if invalid
    END IF;

    -- Build the ORDER BY clause dynamically based on validated input
    order_clause := format(
        'ORDER BY %I.%I %s',
        CASE sort_by
            WHEN 'release_date' THEN 'ps' -- Alias for pokemon_sets
            ELSE 'pc' -- Alias for pokemon_cards (name, number)
        END,
        sort_by,
        sort_direction
    );

    -- *** FIX: Create the 'starts with' search pattern ***
    search_pattern := search_term || '%'; -- Append wildcard only at the end

    -- Execute the main query with JOIN, WHERE, ORDER BY, and LIMIT
    RETURN QUERY EXECUTE format(
        'SELECT
            pc.id,
            pc.name,
            pc.image_small,
            pc.number,
            ps.release_date
        FROM
            public.pokemon_cards pc -- Alias pc
        INNER JOIN
            public.pokemon_sets ps -- Alias ps
        ON
            pc.set_id = ps.id -- Adjust join columns if needed (pc.set_id = ps.id)
        WHERE
            pc.name ILIKE $1 -- Use parameter $1 for the search pattern
        %s -- Inject the sanitized ORDER BY clause
        LIMIT $2', -- Use parameter $2 for limit_count
        order_clause
    )
    USING search_pattern, limit_count; -- Pass the new pattern and limit safely

END;
$_$;


ALTER FUNCTION "public"."search_cards_with_sets"("search_term" "text", "limit_count" integer, "sort_by" "text", "sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_card_fts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN 
  NEW.fts = (
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.set_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.artist, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.rarity, '')), 'D') 
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_card_fts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_card_slots_order"("p_binder_id" "uuid", "p_entries" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  entry jsonb;
  current_user_id uuid := auth.uid();
  binder_owner_id uuid;
  rows_affected int; -- Variable to check affected rows
BEGIN
  -- Optional: Verify Ownership against binders_test (Uncomment if needed, RLS policy should handle this)
  /*
  SELECT user_id INTO binder_owner_id FROM public.binders_test WHERE id = p_binder_id;
  IF binder_owner_id IS NULL OR binder_owner_id != current_user_id THEN
    RAISE EXCEPTION '[TEST] Permission denied to update order for binder %.', p_binder_id;
  END IF;
  */

  RAISE NOTICE '[TEST update_card_slots_order] Processing % entries for binder %', jsonb_array_length(p_entries), p_binder_id;

  -- Loop through the JSON array and update each card's index in the TEST cards table
  -- RLS UPDATE policy on cards_test will be checked here for each row updated
  FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    -- Log the entry being processed
    RAISE NOTICE '[TEST update_card_slots_order] Updating slot ID % to index %', entry->>'id', entry->>'index';

    UPDATE public.cards_test -- Target TEST table
    SET "index" = (entry->>'index')::integer -- Cast index from JSON text to integer
    WHERE
        id = (entry->>'id')::uuid -- Cast ID from JSON text to UUID
      AND
        binder_id = p_binder_id; -- Ensure we only update cards within the specified TEST binder

    -- Check if the UPDATE actually affected a row (important for RLS debugging)
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    IF rows_affected = 0 THEN
        RAISE WARNING '[TEST update_card_slots_order] UPDATE for slot ID % did not affect any rows. RLS policy might have prevented it, or ID/binder_id mismatch.', entry->>'id';
    ELSE
         RAISE NOTICE '[TEST update_card_slots_order] Successfully updated slot ID %.', entry->>'id';
    END IF;

  END LOOP;

  RAISE NOTICE '[TEST update_card_slots_order] Finished processing entries for binder %', p_binder_id;

EXCEPTION
    WHEN others THEN
        RAISE WARNING '[TEST] update_card_slots_order failed: %', SQLERRM;
        RAISE; -- Re-raise the original error
END;
$$;


ALTER FUNCTION "public"."update_card_slots_order"("p_binder_id" "uuid", "p_entries" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pokemon_cards_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.rarity, '') || ' ' || 
    COALESCE(NEW.artist, '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_pokemon_cards_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_cards_with_entries"("_cards" "jsonb", "_owned" boolean) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Upsert cards into the "cards" table
  INSERT INTO cards (id, pokemon_card_id, index, binder_id)
  SELECT id::UUID, pokemon_card_id, index, binder_id::UUID
  FROM jsonb_to_recordset(_cards) 
  AS t(id TEXT, pokemon_card_id TEXT, index INT, binder_id TEXT)
  ON CONFLICT (id) DO UPDATE 
  SET index = EXCLUDED.index, binder_id = EXCLUDED.binder_id;

  -- Insert default entries into "card_entries" if missing
  INSERT INTO card_entries (card_id, owned)
  SELECT id::UUID, _owned  -- Convert "id" to UUID for card_entries
  FROM jsonb_to_recordset(_cards)
  AS t(id TEXT)
  WHERE NOT EXISTS (
  SELECT 1 FROM card_entries ce WHERE ce.card_id = t.id::UUID
);
END;$$;


ALTER FUNCTION "public"."upsert_cards_with_entries"("_cards" "jsonb", "_owned" boolean) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."binders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "page_rows" smallint DEFAULT '3'::smallint NOT NULL,
    "page_columns" smallint DEFAULT '3'::smallint NOT NULL,
    "total_pages" smallint DEFAULT '46'::smallint NOT NULL,
    "type" "text" DEFAULT 'collection'::"text" NOT NULL,
    "type_name" "text",
    "show_owned" boolean,
    "is_private" boolean DEFAULT false,
    "order" integer DEFAULT 0
);


ALTER TABLE "public"."binders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_corrections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pokemon_card_id" "text",
    "suggested_by" "text",
    "missing_fields" "jsonb",
    "note" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "rejection_reason" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_by" "text",
    "reviewed_at" timestamp without time zone
);


ALTER TABLE "public"."card_corrections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "card_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quantity" integer DEFAULT 1,
    "condition" "text",
    "variant" "text",
    "owned" boolean DEFAULT false,
    "notes" "text",
    "price" numeric,
    "graded_by" "text",
    "grade" smallint
);


ALTER TABLE "public"."card_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_prices" (
    "product_id" bigint NOT NULL,
    "market_price" real,
    "card_name" "text" NOT NULL,
    "set_name" "text" NOT NULL,
    "subtype_name" "text",
    "url" "text",
    "last_updated" timestamp with time zone NOT NULL,
    "card_number" "text"
);


ALTER TABLE "public"."card_prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submitted_by" "text",
    "card_name" "text" NOT NULL,
    "set_name" "text",
    "card_number" "text",
    "rarity" "text",
    "language" "text" DEFAULT 'en'::"text",
    "img_url" "text",
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "rejection_reason" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_by" "text",
    "reviewed_at" timestamp without time zone,
    "artist" "text",
    "variant" "text",
    "set_id" "text",
    "subjects" "text"[],
    "cameos" "text"[]
);


ALTER TABLE "public"."card_submissions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."card_submissions"."subjects" IS 'main subjects in card';



COMMENT ON COLUMN "public"."card_submissions"."cameos" IS 'side characters that cameo in the card';



CREATE TABLE IF NOT EXISTS "public"."cards" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pokemon_card_id" "text" NOT NULL,
    "index" bigint NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "binder_id" "uuid",
    "fts" "tsvector",
    "condition" "text",
    "graded" "text" DEFAULT 'none'::"text" NOT NULL,
    "quantity" integer NOT NULL,
    "owned" boolean,
    "notes" "text",
    CONSTRAINT "reasonable_index_range" CHECK ((("index" >= 0) AND ("index" < 1000000)))
);


ALTER TABLE "public"."cards" OWNER TO "postgres";


COMMENT ON TABLE "public"."cards" IS 'table with card ids';



COMMENT ON COLUMN "public"."cards"."id" IS 'supabase id';



COMMENT ON COLUMN "public"."cards"."graded" IS 'none / psa / tag / cgc / black beckett / other grading';



CREATE TABLE IF NOT EXISTS "public"."pokemon_cards" (
    "id" "text" NOT NULL,
    "set_id" "text",
    "name" "text",
    "supertype" "text",
    "number" "text",
    "artist" "text",
    "rarity" "text",
    "flavor_text" "text",
    "image_small" "text",
    "image_large" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "types" "text"[],
    "subjects" "text"[],
    "subtypes" "text"[],
    "number_prefix" "text",
    "number_number" integer,
    "variants" "jsonb",
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" DEFAULT ''::"text",
    "cameos" "text"[],
    "language" "text",
    "last_updated" "date",
    "search_vector" "tsvector"
);


ALTER TABLE "public"."pokemon_cards" OWNER TO "postgres";


COMMENT ON COLUMN "public"."pokemon_cards"."uuid" IS 'uuid';



CREATE TABLE IF NOT EXISTS "public"."pokemon_sets" (
    "id" "text" NOT NULL,
    "name" "text",
    "series" "text",
    "printed_total" bigint,
    "total" bigint,
    "ptcgo_code" "text",
    "release_date" "date",
    "image_logo" "text",
    "image_symbol" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "language" "text" DEFAULT 'english'::"text" NOT NULL,
    "tcgplayer_group_id" integer
);


ALTER TABLE "public"."pokemon_sets" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."cards_search_view" AS
 SELECT "pc"."id",
    "pc"."name",
    "pc"."artist",
    "pc"."rarity",
    "pc"."subtypes",
    "pc"."number" AS "card_number",
    "ps"."name" AS "set_name",
    "ps"."release_date",
    ((("setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("pc"."name", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("ps"."name", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("pc"."artist", ''::"text")), 'C'::"char")) || "setweight"("to_tsvector"('"english"'::"regconfig", ((COALESCE("pc"."rarity", ''::"text") || ' '::"text") || COALESCE("array_to_string"("pc"."subtypes", ' '::"text"), ''::"text"))), 'D'::"char")) AS "search_vector"
   FROM ("public"."pokemon_cards" "pc"
     JOIN "public"."pokemon_sets" "ps" ON (("pc"."set_id" = "ps"."id")))
  WITH NO DATA;


ALTER TABLE "public"."cards_search_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "email" "text",
    "subject" "text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contact_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'pending_confirmation'::"text" NOT NULL,
    "signup_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confirmation_token" "text",
    "confirmed_at" timestamp with time zone,
    "last_email_sent_at" timestamp with time zone
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."pokemon_cards_search_view" AS
 SELECT "c"."id",
    "c"."name",
    "c"."number" AS "card_number",
    "c"."artist",
    "c"."rarity",
    "c"."image_small",
    "s"."name" AS "set_name",
    "to_tsvector"('"english"'::"regconfig", ((((((((COALESCE("c"."name", ''::"text") || ' '::"text") || COALESCE("c"."number", ''::"text")) || ' '::"text") || COALESCE("c"."artist", ''::"text")) || ' '::"text") || COALESCE("c"."rarity", ''::"text")) || ' '::"text") || COALESCE("s"."name", ''::"text"))) AS "fts"
   FROM ("public"."pokemon_cards" "c"
     JOIN "public"."pokemon_sets" "s" ON (("c"."set_id" = "s"."id")))
  WITH NO DATA;


ALTER TABLE "public"."pokemon_cards_search_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pokemon_raw_api_cards" (
    "id" "text" NOT NULL,
    "set_id" "text",
    "name" "text",
    "supertype" "text",
    "number" "text",
    "artist" "text",
    "rarity" "text",
    "flavor_text" "text",
    "image_small" "text",
    "image_large" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "types" "text"[],
    "subjects" "text"[],
    "subtypes" "text"[],
    "number_prefix" "text",
    "number_number" integer,
    "variants" "jsonb",
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" DEFAULT ''::"text",
    "cameos" "text"[],
    "language" "text"
);


ALTER TABLE "public"."pokemon_raw_api_cards" OWNER TO "postgres";


COMMENT ON TABLE "public"."pokemon_raw_api_cards" IS 'This is a duplicate of pokemon_cards';



COMMENT ON COLUMN "public"."pokemon_raw_api_cards"."uuid" IS 'uuid';



CREATE TABLE IF NOT EXISTS "public"."pokemon_raw_cards_jp" (
    "id" "text" NOT NULL,
    "set_id" "text",
    "name" "text",
    "supertype" "text",
    "number" "text",
    "artist" "text",
    "rarity" "text",
    "flavor_text" "text",
    "image_small" "text",
    "image_large" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "types" "text"[],
    "subjects" "text"[],
    "subtypes" "text"[],
    "number_prefix" "text",
    "number_number" integer,
    "variants" "jsonb",
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" DEFAULT ''::"text",
    "cameos" "text"[],
    "language" "text"
);


ALTER TABLE "public"."pokemon_raw_cards_jp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pokemon_sets_jp" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "series" "text",
    "prnted_total" bigint,
    "total" bigint,
    "release_date" "date",
    "image_logo" "text",
    "image_symbol" "text",
    "status" "text"
);


ALTER TABLE "public"."pokemon_sets_jp" OWNER TO "postgres";


COMMENT ON COLUMN "public"."pokemon_sets_jp"."status" IS 'completion status';



CREATE TABLE IF NOT EXISTS "public"."rules" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "product_id" "text" NOT NULL
);


ALTER TABLE "public"."rules" OWNER TO "postgres";


ALTER TABLE "public"."rules" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."rules_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."subscription_schedules" (
    "id" "text" NOT NULL,
    "object" "text",
    "application" "text",
    "canceled_at" integer,
    "completed_at" integer,
    "created" integer NOT NULL,
    "current_phase" "jsonb",
    "customer" "text" NOT NULL,
    "default_settings" "jsonb",
    "end_behavior" "text",
    "livemode" boolean NOT NULL,
    "metadata" "jsonb" NOT NULL,
    "phases" "jsonb" NOT NULL,
    "released_at" integer,
    "released_subscription" "text",
    "status" "public"."subscription_schedule_status" NOT NULL,
    "subscription" "text",
    "test_clock" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "public"."subscription_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "username" "text",
    "avatar_url" "text",
    "is_premium" boolean DEFAULT false,
    "is_public" boolean DEFAULT true,
    "subscription_status" "text" DEFAULT 'free'::"text",
    "stripe_customer_id" "text",
    "plan_type" "text" DEFAULT 'free'::"text",
    CONSTRAINT "username_length" CHECK (("char_length"("username") >= 3))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "billing_address" "jsonb",
    "payment_method" "jsonb"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."active_entitlements" (
    "id" "text" NOT NULL,
    "object" "text",
    "livemode" boolean,
    "feature" "text",
    "customer" "text",
    "lookup_key" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."active_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."charges" (
    "id" "text" NOT NULL,
    "object" "text",
    "paid" boolean,
    "order" "text",
    "amount" bigint,
    "review" "text",
    "source" "jsonb",
    "status" "text",
    "created" integer,
    "dispute" "text",
    "invoice" "text",
    "outcome" "jsonb",
    "refunds" "jsonb",
    "updated" integer,
    "captured" boolean,
    "currency" "text",
    "customer" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "refunded" boolean,
    "shipping" "jsonb",
    "application" "text",
    "description" "text",
    "destination" "text",
    "failure_code" "text",
    "on_behalf_of" "text",
    "fraud_details" "jsonb",
    "receipt_email" "text",
    "payment_intent" "text",
    "receipt_number" "text",
    "transfer_group" "text",
    "amount_refunded" bigint,
    "application_fee" "text",
    "failure_message" "text",
    "source_transfer" "text",
    "balance_transaction" "text",
    "statement_descriptor" "text",
    "payment_method_details" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."checkout_session_line_items" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount_discount" integer,
    "amount_subtotal" integer,
    "amount_tax" integer,
    "amount_total" integer,
    "currency" "text",
    "description" "text",
    "price" "text",
    "quantity" integer,
    "checkout_session" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."checkout_session_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."checkout_sessions" (
    "id" "text" NOT NULL,
    "object" "text",
    "adaptive_pricing" "jsonb",
    "after_expiration" "jsonb",
    "allow_promotion_codes" boolean,
    "amount_subtotal" integer,
    "amount_total" integer,
    "automatic_tax" "jsonb",
    "billing_address_collection" "text",
    "cancel_url" "text",
    "client_reference_id" "text",
    "client_secret" "text",
    "collected_information" "jsonb",
    "consent" "jsonb",
    "consent_collection" "jsonb",
    "created" integer,
    "currency" "text",
    "currency_conversion" "jsonb",
    "custom_fields" "jsonb",
    "custom_text" "jsonb",
    "customer" "text",
    "customer_creation" "text",
    "customer_details" "jsonb",
    "customer_email" "text",
    "discounts" "jsonb",
    "expires_at" integer,
    "invoice" "text",
    "invoice_creation" "jsonb",
    "livemode" boolean,
    "locale" "text",
    "metadata" "jsonb",
    "mode" "text",
    "optional_items" "jsonb",
    "payment_intent" "text",
    "payment_link" "text",
    "payment_method_collection" "text",
    "payment_method_configuration_details" "jsonb",
    "payment_method_options" "jsonb",
    "payment_method_types" "jsonb",
    "payment_status" "text",
    "permissions" "jsonb",
    "phone_number_collection" "jsonb",
    "presentment_details" "jsonb",
    "recovered_from" "text",
    "redirect_on_completion" "text",
    "return_url" "text",
    "saved_payment_method_options" "jsonb",
    "setup_intent" "text",
    "shipping_address_collection" "jsonb",
    "shipping_cost" "jsonb",
    "shipping_details" "jsonb",
    "shipping_options" "jsonb",
    "status" "text",
    "submit_type" "text",
    "subscription" "text",
    "success_url" "text",
    "tax_id_collection" "jsonb",
    "total_details" "jsonb",
    "ui_mode" "text",
    "url" "text",
    "wallet_options" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."checkout_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."coupons" (
    "id" "text" NOT NULL,
    "object" "text",
    "name" "text",
    "valid" boolean,
    "created" integer,
    "updated" integer,
    "currency" "text",
    "duration" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "redeem_by" integer,
    "amount_off" bigint,
    "percent_off" double precision,
    "times_redeemed" bigint,
    "max_redemptions" bigint,
    "duration_in_months" bigint,
    "percent_off_precise" double precision,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."credit_notes" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" integer,
    "amount_shipping" integer,
    "created" integer,
    "currency" "text",
    "customer" "text",
    "customer_balance_transaction" "text",
    "discount_amount" integer,
    "discount_amounts" "jsonb",
    "invoice" "text",
    "lines" "jsonb",
    "livemode" boolean,
    "memo" "text",
    "metadata" "jsonb",
    "number" "text",
    "out_of_band_amount" integer,
    "pdf" "text",
    "reason" "text",
    "refund" "text",
    "shipping_cost" "jsonb",
    "status" "text",
    "subtotal" integer,
    "subtotal_excluding_tax" integer,
    "tax_amounts" "jsonb",
    "total" integer,
    "total_excluding_tax" integer,
    "type" "text",
    "voided_at" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."credit_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."customers" (
    "id" "text" NOT NULL,
    "object" "text",
    "address" "jsonb",
    "description" "text",
    "email" "text",
    "metadata" "jsonb",
    "name" "text",
    "phone" "text",
    "shipping" "jsonb",
    "balance" integer,
    "created" integer,
    "currency" "text",
    "default_source" "text",
    "delinquent" boolean,
    "discount" "jsonb",
    "invoice_prefix" "text",
    "invoice_settings" "jsonb",
    "livemode" boolean,
    "next_invoice_sequence" integer,
    "preferred_locales" "jsonb",
    "tax_exempt" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."disputes" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" bigint,
    "charge" "text",
    "reason" "text",
    "status" "text",
    "created" integer,
    "updated" integer,
    "currency" "text",
    "evidence" "jsonb",
    "livemode" boolean,
    "metadata" "jsonb",
    "evidence_details" "jsonb",
    "balance_transactions" "jsonb",
    "is_charge_refundable" boolean,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "payment_intent" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."early_fraud_warnings" (
    "id" "text" NOT NULL,
    "object" "text",
    "actionable" boolean,
    "charge" "text",
    "created" integer,
    "fraud_type" "text",
    "livemode" boolean,
    "payment_intent" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."early_fraud_warnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."events" (
    "id" "text" NOT NULL,
    "object" "text",
    "data" "jsonb",
    "type" "text",
    "created" integer,
    "request" "text",
    "updated" integer,
    "livemode" boolean,
    "api_version" "text",
    "pending_webhooks" bigint,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."features" (
    "id" "text" NOT NULL,
    "object" "text",
    "livemode" boolean,
    "name" "text",
    "lookup_key" "text",
    "active" boolean,
    "metadata" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."invoices" (
    "id" "text" NOT NULL,
    "object" "text",
    "auto_advance" boolean,
    "collection_method" "text",
    "currency" "text",
    "description" "text",
    "hosted_invoice_url" "text",
    "lines" "jsonb",
    "metadata" "jsonb",
    "period_end" integer,
    "period_start" integer,
    "status" "public"."invoice_status",
    "total" bigint,
    "account_country" "text",
    "account_name" "text",
    "account_tax_ids" "jsonb",
    "amount_due" bigint,
    "amount_paid" bigint,
    "amount_remaining" bigint,
    "application_fee_amount" bigint,
    "attempt_count" integer,
    "attempted" boolean,
    "billing_reason" "text",
    "created" integer,
    "custom_fields" "jsonb",
    "customer_address" "jsonb",
    "customer_email" "text",
    "customer_name" "text",
    "customer_phone" "text",
    "customer_shipping" "jsonb",
    "customer_tax_exempt" "text",
    "customer_tax_ids" "jsonb",
    "default_tax_rates" "jsonb",
    "discount" "jsonb",
    "discounts" "jsonb",
    "due_date" integer,
    "ending_balance" integer,
    "footer" "text",
    "invoice_pdf" "text",
    "last_finalization_error" "jsonb",
    "livemode" boolean,
    "next_payment_attempt" integer,
    "number" "text",
    "paid" boolean,
    "payment_settings" "jsonb",
    "post_payment_credit_notes_amount" integer,
    "pre_payment_credit_notes_amount" integer,
    "receipt_number" "text",
    "starting_balance" integer,
    "statement_descriptor" "text",
    "status_transitions" "jsonb",
    "subtotal" integer,
    "tax" integer,
    "total_discount_amounts" "jsonb",
    "total_tax_amounts" "jsonb",
    "transfer_data" "jsonb",
    "webhooks_delivered_at" integer,
    "customer" "text",
    "subscription" "text",
    "payment_intent" "text",
    "default_payment_method" "text",
    "default_source" "text",
    "on_behalf_of" "text",
    "charge" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "stripe"."migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."payment_intents" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" integer,
    "amount_capturable" integer,
    "amount_details" "jsonb",
    "amount_received" integer,
    "application" "text",
    "application_fee_amount" integer,
    "automatic_payment_methods" "text",
    "canceled_at" integer,
    "cancellation_reason" "text",
    "capture_method" "text",
    "client_secret" "text",
    "confirmation_method" "text",
    "created" integer,
    "currency" "text",
    "customer" "text",
    "description" "text",
    "invoice" "text",
    "last_payment_error" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "next_action" "text",
    "on_behalf_of" "text",
    "payment_method" "text",
    "payment_method_options" "jsonb",
    "payment_method_types" "jsonb",
    "processing" "text",
    "receipt_email" "text",
    "review" "text",
    "setup_future_usage" "text",
    "shipping" "jsonb",
    "statement_descriptor" "text",
    "statement_descriptor_suffix" "text",
    "status" "text",
    "transfer_data" "jsonb",
    "transfer_group" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."payment_intents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."payment_methods" (
    "id" "text" NOT NULL,
    "object" "text",
    "created" integer,
    "customer" "text",
    "type" "text",
    "billing_details" "jsonb",
    "metadata" "jsonb",
    "card" "jsonb",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."payouts" (
    "id" "text" NOT NULL,
    "object" "text",
    "date" "text",
    "type" "text",
    "amount" bigint,
    "method" "text",
    "status" "text",
    "created" integer,
    "updated" integer,
    "currency" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "automatic" boolean,
    "recipient" "text",
    "description" "text",
    "destination" "text",
    "source_type" "text",
    "arrival_date" "text",
    "bank_account" "jsonb",
    "failure_code" "text",
    "transfer_group" "text",
    "amount_reversed" bigint,
    "failure_message" "text",
    "source_transaction" "text",
    "balance_transaction" "text",
    "statement_descriptor" "text",
    "statement_description" "text",
    "failure_balance_transaction" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."plans" (
    "id" "text" NOT NULL,
    "object" "text",
    "active" boolean,
    "amount" bigint,
    "created" integer,
    "product" "text",
    "currency" "text",
    "interval" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "nickname" "text",
    "tiers_mode" "text",
    "usage_type" "text",
    "billing_scheme" "text",
    "interval_count" bigint,
    "aggregate_usage" "text",
    "transform_usage" "text",
    "trial_period_days" bigint,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."prices" (
    "id" "text" NOT NULL,
    "object" "text",
    "active" boolean,
    "currency" "text",
    "metadata" "jsonb",
    "nickname" "text",
    "recurring" "jsonb",
    "type" "public"."pricing_type",
    "unit_amount" integer,
    "billing_scheme" "text",
    "created" integer,
    "livemode" boolean,
    "lookup_key" "text",
    "tiers_mode" "public"."pricing_tiers",
    "transform_quantity" "jsonb",
    "unit_amount_decimal" "text",
    "product" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."products" (
    "id" "text" NOT NULL,
    "object" "text",
    "active" boolean,
    "description" "text",
    "metadata" "jsonb",
    "name" "text",
    "created" integer,
    "images" "jsonb",
    "livemode" boolean,
    "package_dimensions" "jsonb",
    "shippable" boolean,
    "statement_descriptor" "text",
    "unit_label" "text",
    "updated" integer,
    "url" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "marketing_features" "jsonb",
    "default_price" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."products_archive" (
    "id" "text",
    "object" "text",
    "active" boolean,
    "description" "text",
    "metadata" "jsonb",
    "name" "text",
    "created" integer,
    "images" "jsonb",
    "livemode" boolean,
    "package_dimensions" "jsonb",
    "shippable" boolean,
    "statement_descriptor" "text",
    "unit_label" "text",
    "updated" integer,
    "url" "text",
    "updated_at" timestamp with time zone,
    "marketing_features" "jsonb",
    "default_price" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."products_archive" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."refunds" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" integer,
    "balance_transaction" "text",
    "charge" "text",
    "created" integer,
    "currency" "text",
    "destination_details" "jsonb",
    "metadata" "jsonb",
    "payment_intent" "text",
    "reason" "text",
    "receipt_number" "text",
    "source_transfer_reversal" "text",
    "status" "text",
    "transfer_reversal" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."refunds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."reviews" (
    "id" "text" NOT NULL,
    "object" "text",
    "billing_zip" "text",
    "charge" "text",
    "created" integer,
    "closed_reason" "text",
    "livemode" boolean,
    "ip_address" "text",
    "ip_address_location" "jsonb",
    "open" boolean,
    "opened_reason" "text",
    "payment_intent" "text",
    "reason" "text",
    "session" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."setup_intents" (
    "id" "text" NOT NULL,
    "object" "text",
    "created" integer,
    "customer" "text",
    "description" "text",
    "payment_method" "text",
    "status" "text",
    "usage" "text",
    "cancellation_reason" "text",
    "latest_attempt" "text",
    "mandate" "text",
    "single_use_mandate" "text",
    "on_behalf_of" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."setup_intents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."subscription_items" (
    "id" "text" NOT NULL,
    "object" "text",
    "billing_thresholds" "jsonb",
    "created" integer,
    "deleted" boolean,
    "metadata" "jsonb",
    "quantity" integer,
    "price" "text",
    "subscription" "text",
    "tax_rates" "jsonb",
    "current_period_end" integer,
    "current_period_start" integer,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."subscription_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."subscriptions" (
    "id" "text" NOT NULL,
    "object" "text",
    "cancel_at_period_end" boolean,
    "current_period_end" integer,
    "current_period_start" integer,
    "default_payment_method" "text",
    "items" "jsonb",
    "metadata" "jsonb",
    "pending_setup_intent" "text",
    "pending_update" "jsonb",
    "status" "public"."subscription_status",
    "application_fee_percent" double precision,
    "billing_cycle_anchor" integer,
    "billing_thresholds" "jsonb",
    "cancel_at" integer,
    "canceled_at" integer,
    "collection_method" "text",
    "created" integer,
    "days_until_due" integer,
    "default_source" "text",
    "default_tax_rates" "jsonb",
    "discount" "jsonb",
    "ended_at" integer,
    "livemode" boolean,
    "next_pending_invoice_item_invoice" integer,
    "pause_collection" "jsonb",
    "pending_invoice_item_interval" "jsonb",
    "start_date" integer,
    "transfer_data" "jsonb",
    "trial_end" "jsonb",
    "trial_start" "jsonb",
    "schedule" "text",
    "customer" "text",
    "latest_invoice" "text",
    "plan" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."tax_ids" (
    "id" "text" NOT NULL,
    "object" "text",
    "country" "text",
    "customer" "text",
    "type" "text",
    "value" "text",
    "created" integer NOT NULL,
    "livemode" boolean,
    "owner" "jsonb",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."tax_ids" OWNER TO "postgres";


ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "binder_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."binders"
    ADD CONSTRAINT "binders_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."binders"
    ADD CONSTRAINT "binders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_corrections"
    ADD CONSTRAINT "card_corrections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_entries"
    ADD CONSTRAINT "card_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_prices"
    ADD CONSTRAINT "card_prices_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."card_submissions"
    ADD CONSTRAINT "card_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_submissions"
    ADD CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pokemon_sets"
    ADD CONSTRAINT "pokemon_cards_duplicate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pokemon_cards"
    ADD CONSTRAINT "pokemon_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pokemon_cards"
    ADD CONSTRAINT "pokemon_cards_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."pokemon_raw_api_cards"
    ADD CONSTRAINT "pokemon_raw_api_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pokemon_raw_api_cards"
    ADD CONSTRAINT "pokemon_raw_api_cards_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."pokemon_raw_cards_jp"
    ADD CONSTRAINT "pokemon_raw_cards_jp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pokemon_raw_cards_jp"
    ADD CONSTRAINT "pokemon_raw_cards_jp_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."pokemon_sets_jp"
    ADD CONSTRAINT "pokemon_sets_jp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_product_id_key" UNIQUE ("product_id");



ALTER TABLE ONLY "public"."subscription_schedules"
    ADD CONSTRAINT "subscription_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "unique_username" UNIQUE ("username");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profile_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."active_entitlements"
    ADD CONSTRAINT "active_entitlements_lookup_key_key" UNIQUE ("lookup_key");



ALTER TABLE ONLY "stripe"."active_entitlements"
    ADD CONSTRAINT "active_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."charges"
    ADD CONSTRAINT "charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."checkout_session_line_items"
    ADD CONSTRAINT "checkout_session_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."credit_notes"
    ADD CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."early_fraud_warnings"
    ADD CONSTRAINT "early_fraud_warnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."features"
    ADD CONSTRAINT "features_lookup_key_key" UNIQUE ("lookup_key");



ALTER TABLE ONLY "stripe"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "stripe"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."payment_intents"
    ADD CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."prices"
    ADD CONSTRAINT "prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."refunds"
    ADD CONSTRAINT "refunds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."setup_intents"
    ADD CONSTRAINT "setup_intents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."subscription_items"
    ADD CONSTRAINT "subscription_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."tax_ids"
    ADD CONSTRAINT "tax_ids_pkey" PRIMARY KEY ("id");



CREATE INDEX "cards_fts_idx" ON "public"."cards" USING "gin" ("fts");



CREATE INDEX "idx_binder_user_id" ON "public"."binders" USING "btree" ("user_id");



CREATE INDEX "idx_cards_search_view_artist" ON "public"."cards_search_view" USING "btree" ("artist");



CREATE UNIQUE INDEX "idx_cards_search_view_id" ON "public"."cards_search_view" USING "btree" ("id");



CREATE INDEX "idx_cards_search_view_rarity" ON "public"."cards_search_view" USING "btree" ("rarity");



CREATE INDEX "idx_cards_search_view_set_name" ON "public"."cards_search_view" USING "btree" ("set_name");



CREATE INDEX "idx_cards_search_view_vector" ON "public"."cards_search_view" USING "gin" ("search_vector");



CREATE INDEX "idx_pokemon_cards_number_sort" ON "public"."pokemon_cards" USING "btree" ("number_prefix", "number_number");



CREATE INDEX "idx_pokemon_cards_search_vector" ON "public"."pokemon_cards" USING "gin" ("search_vector");



CREATE INDEX "pokemon_cards_search_view_fts_idx" ON "public"."pokemon_cards_search_view" USING "gin" ("fts");



CREATE INDEX "pokemon_raw_api_cards_number_prefix_number_number_idx" ON "public"."pokemon_raw_api_cards" USING "btree" ("number_prefix", "number_number");



CREATE INDEX "stripe_active_entitlements_customer_idx" ON "stripe"."active_entitlements" USING "btree" ("customer");



CREATE INDEX "stripe_active_entitlements_feature_idx" ON "stripe"."active_entitlements" USING "btree" ("feature");



CREATE INDEX "stripe_checkout_session_line_items_price_idx" ON "stripe"."checkout_session_line_items" USING "btree" ("price");



CREATE INDEX "stripe_checkout_session_line_items_session_idx" ON "stripe"."checkout_session_line_items" USING "btree" ("checkout_session");



CREATE INDEX "stripe_checkout_sessions_customer_idx" ON "stripe"."checkout_sessions" USING "btree" ("customer");



CREATE INDEX "stripe_checkout_sessions_invoice_idx" ON "stripe"."checkout_sessions" USING "btree" ("invoice");



CREATE INDEX "stripe_checkout_sessions_payment_intent_idx" ON "stripe"."checkout_sessions" USING "btree" ("payment_intent");



CREATE INDEX "stripe_checkout_sessions_subscription_idx" ON "stripe"."checkout_sessions" USING "btree" ("subscription");



CREATE INDEX "stripe_credit_notes_customer_idx" ON "stripe"."credit_notes" USING "btree" ("customer");



CREATE INDEX "stripe_credit_notes_invoice_idx" ON "stripe"."credit_notes" USING "btree" ("invoice");



CREATE INDEX "stripe_dispute_created_idx" ON "stripe"."disputes" USING "btree" ("created");



CREATE INDEX "stripe_early_fraud_warnings_charge_idx" ON "stripe"."early_fraud_warnings" USING "btree" ("charge");



CREATE INDEX "stripe_early_fraud_warnings_payment_intent_idx" ON "stripe"."early_fraud_warnings" USING "btree" ("payment_intent");



CREATE INDEX "stripe_invoices_customer_idx" ON "stripe"."invoices" USING "btree" ("customer");



CREATE INDEX "stripe_invoices_subscription_idx" ON "stripe"."invoices" USING "btree" ("subscription");



CREATE INDEX "stripe_payment_intents_customer_idx" ON "stripe"."payment_intents" USING "btree" ("customer");



CREATE INDEX "stripe_payment_intents_invoice_idx" ON "stripe"."payment_intents" USING "btree" ("invoice");



CREATE INDEX "stripe_payment_methods_customer_idx" ON "stripe"."payment_methods" USING "btree" ("customer");



CREATE INDEX "stripe_refunds_charge_idx" ON "stripe"."refunds" USING "btree" ("charge");



CREATE INDEX "stripe_refunds_payment_intent_idx" ON "stripe"."refunds" USING "btree" ("payment_intent");



CREATE INDEX "stripe_reviews_charge_idx" ON "stripe"."reviews" USING "btree" ("charge");



CREATE INDEX "stripe_reviews_payment_intent_idx" ON "stripe"."reviews" USING "btree" ("payment_intent");



CREATE INDEX "stripe_setup_intents_customer_idx" ON "stripe"."setup_intents" USING "btree" ("customer");



CREATE INDEX "stripe_tax_ids_customer_idx" ON "stripe"."tax_ids" USING "btree" ("customer");



CREATE OR REPLACE TRIGGER "trigger_pokemon_cards_search_vector" BEFORE INSERT OR UPDATE ON "public"."pokemon_cards" FOR EACH ROW EXECUTE FUNCTION "public"."update_pokemon_cards_search_vector"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."active_entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."charges" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."checkout_session_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."checkout_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."coupons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."disputes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."early_fraud_warnings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."features" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."payouts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."prices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."refunds" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."binders"
    ADD CONSTRAINT "binders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_corrections"
    ADD CONSTRAINT "card_corrections_pokemon_card_id_fkey" FOREIGN KEY ("pokemon_card_id") REFERENCES "public"."pokemon_cards"("id");



ALTER TABLE ONLY "public"."card_entries"
    ADD CONSTRAINT "card_details_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pokemon_card_id_fkey" FOREIGN KEY ("pokemon_card_id") REFERENCES "public"."pokemon_cards"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pokemon_cards"
    ADD CONSTRAINT "pokemon_cards_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."pokemon_sets"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pokemon_raw_api_cards"
    ADD CONSTRAINT "pokemon_raw_api_cards_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."pokemon_sets"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pokemon_raw_cards_jp"
    ADD CONSTRAINT "pokemon_raw_cards_jp_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."pokemon_sets_jp"("id");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "stripe"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profile_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "stripe"."checkout_session_line_items"
    ADD CONSTRAINT "checkout_session_line_items_checkout_session_fkey" FOREIGN KEY ("checkout_session") REFERENCES "stripe"."checkout_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "stripe"."checkout_session_line_items"
    ADD CONSTRAINT "checkout_session_line_items_price_fkey" FOREIGN KEY ("price") REFERENCES "stripe"."prices"("id") ON DELETE CASCADE;



CREATE POLICY "Allow All Users to Insert (Write)" ON "public"."contact_submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow Only Admins to Delete" ON "public"."contact_submissions" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text"))::boolean = true)));



CREATE POLICY "Allow Only Admins to Read (Select)" ON "public"."contact_submissions" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text"))::boolean = true)));



CREATE POLICY "Allow Only Admins to Update" ON "public"."contact_submissions" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text"))::boolean = true))) WITH CHECK ((("email" IS NOT NULL) AND ("email" <> ''::"text")));



CREATE POLICY "Allow admin all access" ON "public"."pokemon_raw_api_cards" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Allow all based on user.id" ON "public"."cards" USING ((EXISTS ( SELECT 1
   FROM "public"."binders"
  WHERE (("binders"."id" = "cards"."binder_id") AND ("binders"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."binders"
  WHERE (("binders"."id" = "cards"."binder_id") AND ("binders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow everyone to read" ON "public"."cards" FOR SELECT USING (true);



CREATE POLICY "Allow users to manage their own binders" ON "public"."binders" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allows inserts for admins" ON "public"."pokemon_cards" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Can update own user data." ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Can view own user data." ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Enable all for admin" ON "public"."card_corrections" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Enable all for users based on user_id" ON "public"."card_entries" USING ((EXISTS ( SELECT 1
   FROM ("public"."cards"
     JOIN "public"."binders" ON (("binders"."id" = "cards"."binder_id")))
  WHERE (("cards"."id" = "card_entries"."card_id") AND ("binders"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."cards"
     JOIN "public"."binders" ON (("binders"."id" = "cards"."binder_id")))
  WHERE (("cards"."id" = "card_entries"."card_id") AND ("binders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."card_corrections" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."card_submissions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."card_entries" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."pokemon_cards" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."pokemon_sets" FOR SELECT USING (true);



CREATE POLICY "Enable read access for the general public" ON "public"."binders" FOR SELECT USING (true);



CREATE POLICY "Enable read for authenticated users only" ON "public"."card_submissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for admins" ON "public"."pokemon_cards" FOR UPDATE USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Enable update for admins only" ON "public"."card_submissions" FOR UPDATE USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Users can insert cards into their own binders" ON "public"."cards" FOR INSERT WITH CHECK (("auth"."uid"() = ( SELECT "binders"."user_id"
   FROM "public"."binders"
  WHERE ("binders"."id" = "cards"."binder_id"))));



CREATE POLICY "Users can insert their own profile." ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile." ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile or public profiles" ON "public"."user_profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR ("is_public" = true)));



ALTER TABLE "public"."binders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card_corrections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pokemon_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pokemon_raw_api_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pokemon_raw_cards_jp" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pokemon_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pokemon_sets_jp" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









































































































































































































GRANT ALL ON FUNCTION "public"."add_card_and_shift"("p_binder_id" "uuid", "p_pokemon_card_id" "text", "p_target_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_card_and_shift"("p_binder_id" "uuid", "p_pokemon_card_id" "text", "p_target_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_card_and_shift"("p_binder_id" "uuid", "p_pokemon_card_id" "text", "p_target_index" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_card_slot_and_shift"("p_card_slot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_card_slot_and_shift"("p_card_slot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_card_slot_and_shift"("p_card_slot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_pokemon_sets"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_pokemon_sets"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_pokemon_sets"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_distinct_artists"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_distinct_artists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_distinct_artists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_distinct_card_names"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_distinct_card_names"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_distinct_card_names"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_distinct_pokemon_subjects"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_distinct_pokemon_subjects"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_distinct_pokemon_subjects"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_distinct_rarities"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_distinct_rarities"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_distinct_rarities"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_card_from_slot"("p_card_slot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_card_from_slot"("p_card_slot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_card_from_slot"("p_card_slot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reorder_cards"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_cards"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_cards"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reorder_cards_optimized"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_cards_optimized"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_cards_optimized"("p_binder_id" "uuid", "p_dragged_card_id" "uuid", "p_dragged_position" integer, "p_target_position" integer, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_cards"("search_term" "text", "set_filter" "text", "rarity_filter" "text", "sort_by" "text", "sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_cards"("search_term" "text", "set_filter" "text", "rarity_filter" "text", "sort_by" "text", "sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_cards"("search_term" "text", "set_filter" "text", "rarity_filter" "text", "sort_by" "text", "sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_cards_with_sets"("search_term" "text", "limit_count" integer, "sort_by" "text", "sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_cards_with_sets"("search_term" "text", "limit_count" integer, "sort_by" "text", "sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_cards_with_sets"("search_term" "text", "limit_count" integer, "sort_by" "text", "sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_card_fts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_card_fts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_card_fts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_card_slots_order"("p_binder_id" "uuid", "p_entries" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_card_slots_order"("p_binder_id" "uuid", "p_entries" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_card_slots_order"("p_binder_id" "uuid", "p_entries" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pokemon_cards_search_vector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pokemon_cards_search_vector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pokemon_cards_search_vector"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_cards_with_entries"("_cards" "jsonb", "_owned" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_cards_with_entries"("_cards" "jsonb", "_owned" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_cards_with_entries"("_cards" "jsonb", "_owned" boolean) TO "service_role";
























GRANT ALL ON TABLE "public"."binders" TO "anon";
GRANT ALL ON TABLE "public"."binders" TO "authenticated";
GRANT ALL ON TABLE "public"."binders" TO "service_role";



GRANT ALL ON TABLE "public"."card_corrections" TO "anon";
GRANT ALL ON TABLE "public"."card_corrections" TO "authenticated";
GRANT ALL ON TABLE "public"."card_corrections" TO "service_role";



GRANT ALL ON TABLE "public"."card_entries" TO "anon";
GRANT ALL ON TABLE "public"."card_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."card_entries" TO "service_role";



GRANT ALL ON TABLE "public"."card_prices" TO "anon";
GRANT ALL ON TABLE "public"."card_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."card_prices" TO "service_role";



GRANT ALL ON TABLE "public"."card_submissions" TO "anon";
GRANT ALL ON TABLE "public"."card_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."card_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT ALL ON TABLE "public"."pokemon_cards" TO "anon";
GRANT ALL ON TABLE "public"."pokemon_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."pokemon_cards" TO "service_role";



GRANT ALL ON TABLE "public"."pokemon_sets" TO "anon";
GRANT ALL ON TABLE "public"."pokemon_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."pokemon_sets" TO "service_role";



GRANT ALL ON TABLE "public"."cards_search_view" TO "anon";
GRANT ALL ON TABLE "public"."cards_search_view" TO "authenticated";
GRANT ALL ON TABLE "public"."cards_search_view" TO "service_role";



GRANT ALL ON TABLE "public"."contact_submissions" TO "anon";
GRANT ALL ON TABLE "public"."contact_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."pokemon_cards_search_view" TO "anon";
GRANT ALL ON TABLE "public"."pokemon_cards_search_view" TO "authenticated";
GRANT ALL ON TABLE "public"."pokemon_cards_search_view" TO "service_role";



GRANT ALL ON TABLE "public"."pokemon_raw_api_cards" TO "anon";
GRANT ALL ON TABLE "public"."pokemon_raw_api_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."pokemon_raw_api_cards" TO "service_role";



GRANT ALL ON TABLE "public"."pokemon_raw_cards_jp" TO "anon";
GRANT ALL ON TABLE "public"."pokemon_raw_cards_jp" TO "authenticated";
GRANT ALL ON TABLE "public"."pokemon_raw_cards_jp" TO "service_role";



GRANT ALL ON TABLE "public"."pokemon_sets_jp" TO "anon";
GRANT ALL ON TABLE "public"."pokemon_sets_jp" TO "authenticated";
GRANT ALL ON TABLE "public"."pokemon_sets_jp" TO "service_role";



GRANT ALL ON TABLE "public"."rules" TO "anon";
GRANT ALL ON TABLE "public"."rules" TO "authenticated";
GRANT ALL ON TABLE "public"."rules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rules_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_schedules" TO "anon";
GRANT ALL ON TABLE "public"."subscription_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "stripe"."active_entitlements" TO "anon";
GRANT ALL ON TABLE "stripe"."active_entitlements" TO "authenticated";
GRANT ALL ON TABLE "stripe"."active_entitlements" TO "service_role";



GRANT ALL ON TABLE "stripe"."charges" TO "anon";
GRANT ALL ON TABLE "stripe"."charges" TO "authenticated";
GRANT ALL ON TABLE "stripe"."charges" TO "service_role";



GRANT ALL ON TABLE "stripe"."checkout_session_line_items" TO "anon";
GRANT ALL ON TABLE "stripe"."checkout_session_line_items" TO "authenticated";
GRANT ALL ON TABLE "stripe"."checkout_session_line_items" TO "service_role";



GRANT ALL ON TABLE "stripe"."checkout_sessions" TO "anon";
GRANT ALL ON TABLE "stripe"."checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "stripe"."checkout_sessions" TO "service_role";



GRANT ALL ON TABLE "stripe"."coupons" TO "anon";
GRANT ALL ON TABLE "stripe"."coupons" TO "authenticated";
GRANT ALL ON TABLE "stripe"."coupons" TO "service_role";



GRANT ALL ON TABLE "stripe"."credit_notes" TO "anon";
GRANT ALL ON TABLE "stripe"."credit_notes" TO "authenticated";
GRANT ALL ON TABLE "stripe"."credit_notes" TO "service_role";



GRANT ALL ON TABLE "stripe"."customers" TO "anon";
GRANT ALL ON TABLE "stripe"."customers" TO "authenticated";
GRANT ALL ON TABLE "stripe"."customers" TO "service_role";



GRANT ALL ON TABLE "stripe"."disputes" TO "anon";
GRANT ALL ON TABLE "stripe"."disputes" TO "authenticated";
GRANT ALL ON TABLE "stripe"."disputes" TO "service_role";



GRANT ALL ON TABLE "stripe"."early_fraud_warnings" TO "anon";
GRANT ALL ON TABLE "stripe"."early_fraud_warnings" TO "authenticated";
GRANT ALL ON TABLE "stripe"."early_fraud_warnings" TO "service_role";



GRANT ALL ON TABLE "stripe"."events" TO "anon";
GRANT ALL ON TABLE "stripe"."events" TO "authenticated";
GRANT ALL ON TABLE "stripe"."events" TO "service_role";



GRANT ALL ON TABLE "stripe"."features" TO "anon";
GRANT ALL ON TABLE "stripe"."features" TO "authenticated";
GRANT ALL ON TABLE "stripe"."features" TO "service_role";



GRANT ALL ON TABLE "stripe"."invoices" TO "anon";
GRANT ALL ON TABLE "stripe"."invoices" TO "authenticated";
GRANT ALL ON TABLE "stripe"."invoices" TO "service_role";



GRANT ALL ON TABLE "stripe"."migrations" TO "anon";
GRANT ALL ON TABLE "stripe"."migrations" TO "authenticated";
GRANT ALL ON TABLE "stripe"."migrations" TO "service_role";



GRANT ALL ON TABLE "stripe"."payment_intents" TO "anon";
GRANT ALL ON TABLE "stripe"."payment_intents" TO "authenticated";
GRANT ALL ON TABLE "stripe"."payment_intents" TO "service_role";



GRANT ALL ON TABLE "stripe"."payment_methods" TO "anon";
GRANT ALL ON TABLE "stripe"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "stripe"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "stripe"."payouts" TO "anon";
GRANT ALL ON TABLE "stripe"."payouts" TO "authenticated";
GRANT ALL ON TABLE "stripe"."payouts" TO "service_role";



GRANT ALL ON TABLE "stripe"."plans" TO "anon";
GRANT ALL ON TABLE "stripe"."plans" TO "authenticated";
GRANT ALL ON TABLE "stripe"."plans" TO "service_role";



GRANT ALL ON TABLE "stripe"."prices" TO "anon";
GRANT ALL ON TABLE "stripe"."prices" TO "authenticated";
GRANT ALL ON TABLE "stripe"."prices" TO "service_role";



GRANT ALL ON TABLE "stripe"."products" TO "anon";
GRANT ALL ON TABLE "stripe"."products" TO "authenticated";
GRANT ALL ON TABLE "stripe"."products" TO "service_role";



GRANT ALL ON TABLE "stripe"."refunds" TO "anon";
GRANT ALL ON TABLE "stripe"."refunds" TO "authenticated";
GRANT ALL ON TABLE "stripe"."refunds" TO "service_role";



GRANT ALL ON TABLE "stripe"."reviews" TO "anon";
GRANT ALL ON TABLE "stripe"."reviews" TO "authenticated";
GRANT ALL ON TABLE "stripe"."reviews" TO "service_role";



GRANT ALL ON TABLE "stripe"."setup_intents" TO "anon";
GRANT ALL ON TABLE "stripe"."setup_intents" TO "authenticated";
GRANT ALL ON TABLE "stripe"."setup_intents" TO "service_role";



GRANT ALL ON TABLE "stripe"."subscription_items" TO "anon";
GRANT ALL ON TABLE "stripe"."subscription_items" TO "authenticated";
GRANT ALL ON TABLE "stripe"."subscription_items" TO "service_role";



GRANT ALL ON TABLE "stripe"."subscriptions" TO "anon";
GRANT ALL ON TABLE "stripe"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "stripe"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "stripe"."tax_ids" TO "anon";
GRANT ALL ON TABLE "stripe"."tax_ids" TO "authenticated";
GRANT ALL ON TABLE "stripe"."tax_ids" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


  create policy "Give users access to own folder 19iw4cb_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'binder-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



  create policy "Give users access to own folder 19iw4cb_1"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'binder-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



  create policy "Give users access to own folder 19iw4cb_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'binder-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



  create policy "Give users access to own folder 19iw4cb_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'binder-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



