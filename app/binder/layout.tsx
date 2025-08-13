'use client';
import { NavBar } from '@/components/ui/NavBar';
import { useSidebarStore } from '@/stores/sidebarStore';

export default function BinderLayout({
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
      <NavBar />
      <main>{children}</main>
    </div>
  );
}
