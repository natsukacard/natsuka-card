'use client';
import { createTheme, MantineProvider as Provider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import React from 'react';

const theme = createTheme({
  fontFamily: 'var(--font-outfit), sans-serif',
});

export function MantineProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider theme={theme}>
      <Notifications position="bottom-center" className="mb-24" />
      {children}
    </Provider>
  );
}
