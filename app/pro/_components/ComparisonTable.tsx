'use client';

import {
  Badge,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck, IconMinus } from '@tabler/icons-react';

const ComparisonTable = () => {
  const features = [
    {
      category: 'Core Features',
      items: [
        { name: 'Number of Binders', free: '5', pro: 'Unlimited' },
        { name: 'Custom URL Link', free: false, pro: true },
        { name: 'Webhooks', free: true, pro: true },
        { name: 'Templates', free: true, pro: true },
      ],
    },
    {
      category: 'Support',
      items: [
        { name: 'Community Support', free: true, pro: true },
        { name: 'Priority Email Support', free: false, pro: true },
        { name: 'Dedicated Onboarding', free: false, pro: false },
      ],
    },
    {
      category: 'Advanced',
      items: [
        { name: 'Dedicated IP Address', free: false, pro: true },
        { name: 'Role-based Access Control', free: false, pro: true },
        { name: 'Audit Logs', free: false, pro: true },
      ],
    },
  ];

  const renderFeature = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <ThemeIcon color="green" size="sm" variant="light" radius="xl">
          <IconCheck size={16} />
        </ThemeIcon>
      ) : (
        <ThemeIcon color="gray" size="sm" variant="light" radius="xl">
          <IconMinus size={16} />
        </ThemeIcon>
      );
    }
    return (
      <Badge variant="light" color="blue" size="sm">
        {value}
      </Badge>
    );
  };

  const rows = features.flatMap((category) => [
    // Category header row
    <Table.Tr key={category.category} bg="gray.0">
      <Table.Td colSpan={3}>
        <Text fw={600} size="sm">
          {category.category}
        </Text>
      </Table.Td>
    </Table.Tr>,
    // Feature rows
    ...category.items.map((item) => (
      <Table.Tr key={item.name}>
        <Table.Td>
          <Text size="sm">{item.name}</Text>
        </Table.Td>
        <Table.Td ta="center">{renderFeature(item.free)}</Table.Td>
        <Table.Td ta="center">{renderFeature(item.pro)}</Table.Td>
      </Table.Tr>
    )),
  ]);

  return (
    <Stack gap="xl" mt="xl">
      <div style={{ textAlign: 'center' }}>
        <Title order={2} mb="md">
          Pick the Right Plan for You
        </Title>
        <Text size="lg" c="dimmed">
          Compare features across all plans
        </Text>
      </div>

      <Paper shadow="sm" radius="md" p="md">
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="50%">
                <Text fw={600}>Features</Text>
              </Table.Th>
              <Table.Th ta="center" w="25%">
                <Text fw={600}>Free</Text>
              </Table.Th>
              <Table.Th ta="center" w="25%">
                <Text fw={600}>Pro</Text>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
};

export default ComparisonTable;
