'use client';
import { SidebarShiftWrapper } from '@/components/ui/SidebarShiftWrapper';

export default function BinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarShiftWrapper>
      <main>{children}</main>
    </SidebarShiftWrapper>
  );
}
