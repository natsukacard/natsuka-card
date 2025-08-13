'use client';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useContextMenu } from 'mantine-contextmenu';
import { type ReactNode } from 'react';

interface ContextMenuProps {
  children: ReactNode;
  onDelete: () => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  disabled?: boolean;
}

export function ContextMenu({
  children,
  onDelete,
  onInsertBefore,
  onInsertAfter,
  disabled = false,
}: ContextMenuProps) {
  const { showContextMenu } = useContextMenu();

  if (disabled) {
    return <>{children}</>;
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    showContextMenu([
      {
        key: 'insert-before',
        icon: <IconPlus size={14} />,
        title: 'insert empty slot before',
        onClick: onInsertBefore,
      },
      {
        key: 'insert-after',
        icon: <IconPlus size={14} />,
        title: 'insert empty slot after',
        onClick: onInsertAfter,
      },
      { key: 'divider' },
      {
        key: 'delete',
        icon: <IconTrash size={14} />,
        title: 'delete card',
        color: 'red',
        onClick: onDelete,
      },
    ])(event);
  };

  return <div onContextMenu={handleContextMenu}>{children}</div>;
}
