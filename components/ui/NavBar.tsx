'use client';
import { signOut } from '@/lib/auth/actions';
import { useUser } from '@/lib/auth/queries';
import { useSidebarStore } from '@/stores/sidebarStore';
import { IconMoon, IconSun } from '@tabler/icons-react';

import {
  ActionIcon,
  Anchor,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  Skeleton,
  Stack,
  useComputedColorScheme,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function NavBar() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const searchOpened = useSidebarStore((state) => state.searchOpened);
  const { mutate: handleSignOut } = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      router.push('/login');
    },
  });
  const [opened, { toggle, close }] = useDisclosure(false);

  // Dark mode toggle
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  // Dynamic colors
  const theme = useMantineTheme();
  const bgColor =
    computedColorScheme === 'dark' ? theme.colors.dark[7] : theme.white;
  const textColor =
    computedColorScheme === 'dark'
      ? theme.colors.dark[0]
      : theme.colors.gray[8];

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className="sticky top-0 z-50 bg-white"
      style={{
        backgroundColor: bgColor,
        marginRight: searchOpened ? '600px' : '0',
        transition: 'margin-right 200ms ease',
      }}
    >
      <Container size="md">
        <nav className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold"
            style={{ color: textColor }}
          >
            natsuka
          </Link>

          {/* Desktop */}
          <Group gap="md" visibleFrom="sm">
            {isLoading ? (
              <Skeleton height={30} width={120} radius="md" />
            ) : user ? (
              <>
                <Anchor
                  component={Link}
                  href="/profile"
                  fz="md"
                  fw={500}
                  underline="never"
                  c={textColor}
                >
                  profile
                </Anchor>
                <Button
                  variant="default"
                  size="sm"
                  radius="xl"
                  onClick={() => handleSignOut()}
                >
                  logout
                </Button>
              </>
            ) : (
              <>
                <Anchor
                  c={textColor}
                  component={Link}
                  href="/login"
                  fz="md"
                  fw={500}
                >
                  login
                </Anchor>
                <Button
                  component={Link}
                  href="/signup"
                  size="xs"
                  radius="xl"
                  color="#6796ec"
                >
                  sign up
                </Button>
              </>
            )}
            {/* Dark mode toggle */}
            <ActionIcon
              onClick={toggleColorScheme}
              variant="transparent"
              size="lg"
              color={textColor}
              aria-label="Toggle color scheme"
            >
              {computedColorScheme === 'dark' ? (
                <IconSun stroke={1.5} />
              ) : (
                <IconMoon stroke={1.5} />
              )}
            </ActionIcon>
          </Group>

          {/* Mobile hamburger */}
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            aria-label="Toggle navigation"
            size="sm"
          />
        </nav>
      </Container>

      {/* Mobile drawer (no style changes beyond layout) */}
      <Drawer
        opened={opened}
        onClose={close}
        hiddenFrom="sm"
        size="70%"
        padding="md"
        title="menu"
        withinPortal
      >
        <Stack gap="md" mt="sm">
          {isLoading ? (
            <Skeleton height={30} width="60%" radius="md" />
          ) : user ? (
            <>
              <Anchor
                component={Link}
                href="/profile"
                fz="sm"
                fw={500}
                onClick={close}
              >
                profile
              </Anchor>
              <Button
                variant="default"
                size="xs"
                onClick={() => {
                  handleSignOut();
                  close();
                }}
              >
                logout
              </Button>
            </>
          ) : (
            <>
              <Anchor
                component={Link}
                href="/login"
                fz="sm"
                fw={500}
                onClick={close}
                c={textColor}
              >
                login
              </Anchor>
              <Button
                component={Link}
                href="/signup"
                size="xs"
                radius="xl"
                color="#9f97bd"
                onClick={close}
              >
                sign up
              </Button>
            </>
          )}
        </Stack>
      </Drawer>
    </header>
  );
}
