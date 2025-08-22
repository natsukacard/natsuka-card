'use client';
import { ActionIcon, Anchor, Container, Group, Text } from '@mantine/core';
import {
  FaDiscord,
  FaFacebook,
  FaInstagram,
  FaXTwitter,
} from 'react-icons/fa6';
import classes from './Footer.module.css';

const links = [
  { link: '/contact', label: 'contact us' },
  { link: '/legal/privacy', label: 'privacy policy' },
  { link: '/legal/terms', label: 'terms of service' },
];

export function Footer() {
  const items = links.map((link) => (
    <Anchor c="white" key={link.label} href={link.link} lh={1} size="sm">
      {link.label}
    </Anchor>
  ));

  return (
    <div className={classes.footer}>
      <Container size="md">
        <div className={classes.inner}>
          <Group>
            <Text c="white" size="sm">
              © {new Date().getFullYear()} natsuka. all rights reserved.
            </Text>
          </Group>

          <Group className={classes.links}>{items}</Group>
          <Group gap={8} justify="flex-end" wrap="nowrap">
            <ActionIcon size="lg" variant="subtle">
              <FaDiscord size={20} color="white" />
            </ActionIcon>
            <ActionIcon size="lg" variant="subtle">
              <FaXTwitter size={20} color="white" />
            </ActionIcon>
            <ActionIcon size="lg" variant="subtle">
              <FaFacebook size={20} color="white" />
            </ActionIcon>
            <ActionIcon size="lg" variant="subtle">
              <FaInstagram size={20} color="white" />
            </ActionIcon>
          </Group>
        </div>

        <div className="my-2">
          <Text c="white" size="xs" ta="center" className="lowercase">
            All Trading Card Game (TCG) collections, card images, and associated
            intellectual property referenced on this platform are owned by their
            respective companies. We do not claim ownership of any third-party
            content or trademarks.
          </Text>
        </div>
      </Container>
    </div>
  );
}
