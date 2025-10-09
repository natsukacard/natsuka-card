import {
  useSearchPokemonCards,
  type SearchFilters,
  type SortDirection,
  type SortOption,
} from '@/lib/cards/queries.client';
import { useDraggable } from '@dnd-kit/core';
import {
  AspectRatio,
  Autocomplete,
  Button,
  Collapse,
  Drawer,
  Group,
  Image,
  Loader,
  NumberInput,
  Pagination,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';

interface CardSearchSidebarProps {
  opened: boolean;
  onClose: () => void;
  onCardClick?: (card: SearchResult) => void;
  onCardSelect?: (pokemonCardId: string) => void;
}

type SearchResult = {
  id: string;
  name: string;
  image_small: string;
  image_large: string;
  set_name: string;
  card_number: string;
  rarity: string;
  match_type: string;
  artist: string;
};

function SearchResultCard({
  card,
  onCardClick,
  onCardSelect,
}: {
  card: SearchResult;
  onCardClick?: (card: SearchResult) => void;
  onCardSelect?: (pokemonCardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `search-${card.id}`,
      data: {
        type: 'search-result',
        pokemonCardId: card.id,
        card: card,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
        cursor: 'grabbing',
      }
    : {
        cursor: 'grab',
      };

  const imageUrl = card.image_large || card.image_small;

  const handleClick = () => {
    if (!isDragging) {
      onCardClick?.(card);
      onCardSelect?.(card.id);
    }
  };

  return (
    <div className="relative transition-all duration-200">
      <Paper
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={style}
        radius="md"
        className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-50' : ''
        }`}
        p="xs"
        onClick={handleClick}
      >
        <AspectRatio ratio={63 / 88} mb="xs">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={card.name}
              fit="contain"
              className="rounded-sm"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-sm">
              <Text size="xs" c="dimmed">
                no image
              </Text>
            </div>
          )}
        </AspectRatio>

        <div className="space-y-1">
          <Text size="xs" fw={500} lineClamp={1}>
            {card.name}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            #{card.card_number}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {card.set_name}
          </Text>
          {card.artist && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {card.artist}
            </Text>
          )}
          <Text size="xs" c="blue" fw={500}>
            {card.rarity}
          </Text>
        </div>
      </Paper>
    </div>
  );
}

export function CardSearchSidebar({
  opened,
  onClose,
  onCardClick,
  onCardSelect,
}: CardSearchSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false);
  const [jumpToPage, setJumpToPage] = useState<number | string>(''); // Added for jump functionality

  // Filter and sort states
  const [filters, setFilters] = useState<SearchFilters>({
    setFilter: undefined,
    rarityFilter: undefined,
    sortBy: 'relevance',
    sortDirection: 'desc',
  });

  const { data: searchResults, isLoading } = useSearchPokemonCards(
    debouncedSearchTerm,
    filters
  );

  const results: SearchResult[] = useMemo(
    () => searchResults || [],
    [searchResults]
  );

  const CARDS_PER_PAGE = 9;
  const totalPages = Math.ceil(results.length / CARDS_PER_PAGE);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    return results.slice(startIndex, endIndex);
  }, [results, currentPage]);

  // Jump to page handler (matching BinderPagination)
  const handleJumpToPage = () => {
    const pageNum = Number(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpToPage('');
    }
  };

  const suggestions = useMemo(() => {
    if (!debouncedSearchTerm) return [];

    const uniqueItems = new Set<string>();
    const allSuggestions: string[] = [];

    // Add card names
    results.forEach((card) => {
      if (
        card.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) &&
        !uniqueItems.has(card.name)
      ) {
        uniqueItems.add(card.name);
        allSuggestions.push(card.name);
      }
    });

    // Add set names
    results.forEach((card) => {
      if (
        card.set_name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) &&
        !uniqueItems.has(card.set_name)
      ) {
        uniqueItems.add(card.set_name);
        allSuggestions.push(card.set_name);
      }
    });

    return allSuggestions.slice(0, 10);
  }, [results, debouncedSearchTerm]);

  // Get unique values for filter dropdowns
  const uniqueSets = useMemo(() => {
    const sets = [...new Set(results.map((card) => card.set_name))].sort();
    return sets.map((set) => ({ value: set, label: set }));
  }, [results]);

  const uniqueRarities = useMemo(() => {
    const rarities = [...new Set(results.map((card) => card.rarity))]
      .filter(Boolean)
      .sort();
    return rarities.map((rarity) => ({ value: rarity, label: rarity }));
  }, [results]);

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'name', label: 'Name' },
    { value: 'set', label: 'Set' },
    { value: 'number', label: 'Card Number' },
    { value: 'rarity', label: 'Rarity' },
    { value: 'artist', label: 'Artist' },
    { value: 'release_date', label: 'Release Date' },
  ];

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | null | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      setFilter: undefined,
      rarityFilter: undefined,
      sortBy: 'relevance',
      sortDirection: 'desc',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.setFilter || filters.rarityFilter;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Calculate showing text (matching BinderPagination)
  const startCard = (currentPage - 1) * CARDS_PER_PAGE + 1;
  const endCard = Math.min(startCard + CARDS_PER_PAGE - 1, results.length);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="search for cards"
      position="right"
      size="lg"
      lockScroll={false}
      withOverlay={true}
      padding="md"
      closeOnClickOutside={true}
      styles={{
        content: {
          boxShadow: 'none',
          borderLeft: '1px solid #f7f7f7',
        },
        overlay: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <div className="space-y-4 h-full flex flex-col">
        <Autocomplete
          label="search by name, set, number, artist, or rarity"
          placeholder="type to search..."
          value={searchTerm}
          onChange={setSearchTerm}
          data={suggestions}
          leftSection={<IconSearch size={16} />}
          rightSection={isLoading ? <Loader size="1rem" /> : null}
          limit={10}
          maxDropdownHeight={200}
        />

        {/* Filter Controls */}
        <Group justify="space-between">
          <Button
            variant="light"
            size="xs"
            leftSection={<IconFilter size={14} />}
            onClick={toggleFilters}
            color={hasActiveFilters ? 'blue' : 'gray'}
          >
            filters {hasActiveFilters && '•'}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconX size={14} />}
              onClick={clearFilters}
            >
              clear
            </Button>
          )}
        </Group>

        <Collapse in={filtersOpened}>
          <div className="space-y-3 p-3 bg-gray-50 rounded-md">
            <Group grow>
              <Select
                label="sort by"
                placeholder="relevance"
                value={filters.sortBy}
                onChange={(value) =>
                  handleFilterChange('sortBy', value as SortOption)
                }
                data={sortOptions}
                size="xs"
              />
              <Select
                label="order"
                placeholder="descending"
                value={filters.sortDirection}
                onChange={(value) =>
                  handleFilterChange('sortDirection', value as SortDirection)
                }
                data={[
                  { value: 'desc', label: 'Descending' },
                  { value: 'asc', label: 'Ascending' },
                ]}
                size="xs"
              />
            </Group>

            <Group grow>
              <Select
                label="set"
                placeholder="all sets"
                value={filters.setFilter}
                onChange={(value) => handleFilterChange('setFilter', value)}
                data={uniqueSets}
                searchable
                clearable
                size="xs"
              />
              <Select
                label="rarity"
                placeholder="all rarities"
                value={filters.rarityFilter}
                onChange={(value) => handleFilterChange('rarityFilter', value)}
                data={uniqueRarities}
                searchable
                clearable
                size="xs"
              />
            </Group>
          </div>
        </Collapse>

        <ScrollArea className="flex-1" type="auto">
          {paginatedResults.length > 0 ? (
            <SimpleGrid cols={3} spacing="sm" className="pb-4">
              {paginatedResults.map((card, index) => (
                <SearchResultCard
                  key={`${card.id}-${index}-${currentPage}`}
                  card={card}
                  onCardClick={onCardClick}
                  onCardSelect={onCardSelect}
                />
              ))}
            </SimpleGrid>
          ) : debouncedSearchTerm && !isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Text size="sm" c="dimmed">
                no cards found
              </Text>
            </div>
          ) : !debouncedSearchTerm ? (
            <div className="flex items-center justify-center h-32">
              <Text size="sm" c="dimmed">
                start typing to search for cards
              </Text>
            </div>
          ) : null}
        </ScrollArea>

        {/* Enhanced pagination with jump-to-page (matching BinderPagination) */}
        {totalPages > 1 && (
          <Stack gap="sm" mt="md">
            {/* Main pagination */}
            <Group justify="center" align="center">
              <Pagination
                color="#6796ec"
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
                size="md"
                withEdges
                siblings={0}
                boundaries={1}
                style={{ fontSize: '18px' }}
              />
            </Group>

            {/* Jump to page and info */}
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                showing {startCard}-{endCard} of {results.length} cards
              </Text>

              {totalPages > 5 && (
                <Group gap="xs">
                  <NumberInput
                    value={jumpToPage}
                    onChange={setJumpToPage}
                    placeholder="page"
                    hideControls
                    radius="xl"
                    min={1}
                    max={totalPages}
                    size="xs"
                    w={70}
                    styles={{ input: { textAlign: 'center' } }}
                  />
                  <Button
                    size="xs"
                    color="#6796ec"
                    radius="xl"
                    variant="light"
                    onClick={handleJumpToPage}
                    disabled={
                      !jumpToPage ||
                      Number(jumpToPage) < 1 ||
                      Number(jumpToPage) > totalPages
                    }
                  >
                    go
                  </Button>
                </Group>
              )}

              <Text size="sm" c="dimmed">
                page {currentPage} of {totalPages}
              </Text>
            </Group>
          </Stack>
        )}
      </div>
    </Drawer>
  );
}
