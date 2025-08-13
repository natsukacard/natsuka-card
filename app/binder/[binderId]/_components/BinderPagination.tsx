'use client';
import {
  Button,
  Group,
  NumberInput,
  Pagination,
  Stack,
  Text,
} from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface BinderPaginationProps {
  binderId: string;
  currentPage: number;
  totalPages: number;
  cardsPerPage: number;
  totalCards: number;
}

export function BinderPagination({
  binderId,
  currentPage,
  totalPages,
  cardsPerPage,
  totalCards,
}: BinderPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jumpToPage, setJumpToPage] = useState<number | string>('');

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/binder/${binderId}?${params.toString()}`);
  };

  const handleJumpToPage = () => {
    const pageNum = Number(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setJumpToPage('');
    }
  };

  const startCard = (currentPage - 1) * cardsPerPage + 1;
  const endCard = Math.min(currentPage * cardsPerPage, totalCards);

  return (
    <Stack gap="sm" mt="xl">
      {/* Main pagination */}
      <Group justify="center" mt="lg" align="center">
        <Pagination
          color="#8d84b0"
          value={currentPage}
          onChange={handlePageChange}
          total={totalPages}
          size="md"
          withEdges
          siblings={0}
          boundaries={1}
          style={{ fontSize: '18px' }}
        />
      </Group>

      {/* Jump to page */}
      <Group justify="space-between" mt="md" mb="md" align="center">
        <Text size="sm" c="dimmed">
          showing {startCard} of {totalCards} cards
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
              color="#8d84b0"
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
  );
}
