'use client';
import { useSidebarStore } from '@/stores/sidebarStore';

export function SidebarShiftWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchOpened = useSidebarStore((state) => state.searchOpened);

  return (
    <div
      style={{
        marginRight: searchOpened ? '600px' : '0',
        transition: 'margin-right 200ms ease',
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  );
}
