'use client';
import { MAX_PAGES } from '@/lib/binders/queries.client';
import {
  ActionIcon,
  Button,
  Group,
  Menu,
  NumberInput,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface BinderPaginationProps {
  binderId: string;
  currentPage: number;
  totalPages: number;
  cardsPerPage: number;
  totalCards: number;
  isOwner?: boolean;
  onAddPage?: () => void;
  onInsertPage?: (page: number, position: 'before' | 'after') => void;
  isPageLimitReached?: boolean;
}

function PageButton({
  page,
  isActive,
  onClick,
  isOwner,
  onInsertBefore,
  onInsertAfter,
  isPageLimitReached = false,
}: {
  page: number;
  isActive: boolean;
  onClick: () => void;
  isOwner: boolean;
  onInsertBefore?: () => void;
  onInsertAfter?: () => void;
  isPageLimitReached?: boolean;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <Menu
      shadow="md"
      width={160}
      position="top"
      withArrow
      opened={opened}
      onChange={setOpened}
    >
      <Menu.Target>
        <UnstyledButton
          onClick={onClick}
          onContextMenu={(e) => {
            if (isOwner && onInsertBefore && onInsertAfter && !isPageLimitReached) {
              e.preventDefault();
              setOpened(true);
            }
          }}
          style={{
            minWidth: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            fontSize: 14,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? '#fff' : '#666',
            background: isActive ? '#6796ec' : 'transparent',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'rgba(103, 150, 236, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {page}
        </UnstyledButton>
      </Menu.Target>
      {isOwner && onInsertBefore && onInsertAfter && !isPageLimitReached && (
        <Menu.Dropdown>
          <Menu.Item onClick={onInsertBefore}>Insert page before</Menu.Item>
          <Menu.Item onClick={onInsertAfter}>Insert page after</Menu.Item>
        </Menu.Dropdown>
      )}
    </Menu>
  );
}

export function BinderPagination({
  binderId,
  currentPage,
  totalPages,
  cardsPerPage,
  totalCards,
  isOwner = false,
  onAddPage,
  onInsertPage,
  isPageLimitReached = false,
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

  const getVisiblePages = (): (number | 'dots')[] => {
    const pages: (number | 'dots')[] = [];
    const siblings = 1;
    const boundaries = 1;

    const addPage = (page: number) => {
      if (page >= 1 && page <= totalPages && !pages.includes(page)) {
        pages.push(page);
      }
    };

    for (let i = 1; i <= Math.min(boundaries, totalPages); i++) {
      addPage(i);
    }

    const rangeStart = Math.max(currentPage - siblings, 1);
    const rangeEnd = Math.min(currentPage + siblings, totalPages);

    if (rangeStart > boundaries + 1) {
      pages.push('dots');
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (rangeEnd < totalPages - boundaries) {
      pages.push('dots');
    }

    for (let i = Math.max(totalPages - boundaries + 1, 1); i <= totalPages; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const startCard = (currentPage - 1) * cardsPerPage + 1;

  return (
    <Stack gap="sm" mt="xl">
      <Group justify="center" mt="lg" align="center" gap={4}>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          <IconChevronsLeft size={18} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <IconChevronLeft size={18} />
        </ActionIcon>

        {visiblePages.map((page, index) =>
          page === 'dots' ? (
            <Text key={`dots-${index}`} size="sm" c="dimmed" px={4}>
              ...
            </Text>
          ) : (
            <PageButton
              key={page}
              page={page}
              isActive={page === currentPage}
              onClick={() => handlePageChange(page)}
              isOwner={isOwner}
              onInsertBefore={
                onInsertPage ? () => onInsertPage(page, 'before') : undefined
              }
              onInsertAfter={
                onInsertPage ? () => onInsertPage(page, 'after') : undefined
              }
              isPageLimitReached={isPageLimitReached}
            />
          )
        )}

        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <IconChevronRight size={18} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <IconChevronsRight size={18} />
        </ActionIcon>

        {isOwner && onAddPage && (
          <Tooltip label={isPageLimitReached ? `Page limit reached (${MAX_PAGES} max)` : "Add page at end"}>
            <ActionIcon
              variant="light"
              color="#6796ec"
              size="md"
              onClick={onAddPage}
              radius="sm"
              ml={4}
              disabled={isPageLimitReached}
            >
              <IconPlus size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

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
          page {currentPage} of {totalPages} {isPageLimitReached && `(max ${MAX_PAGES})`}
        </Text>
      </Group>
    </Stack>
  );
}
