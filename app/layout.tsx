import { MantineProvider } from '@/components/providers/MantineProvider';
import { Providers } from '@/components/providers/Providers';
import '@mantine/core/styles.css';
import { ContextMenuProvider } from 'mantine-contextmenu';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lexend_Deca, Outfit } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

const lexend = Lexend_Deca({
  variable: '--font-lexend',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Natsuka Card',
  description: 'Pokemon card collection manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} ${geistMono.variable} antialiased`}>
        <Providers>
          <MantineProvider>
            <ContextMenuProvider>{children}</ContextMenuProvider>
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}
