'use client';
import {
  Button,
  Container,
  Notification,
  Paper,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const contactSchema = z.object({
  name: z.string().min(1, { message: 'Please enter your name' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z
    .string()
    .min(5, { message: 'Subject must be at least 5 characters long' }),
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters long' }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const sendContactMessage = async (values: ContactFormValues) => {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to send message');
  }

  return response.json();
};

export default function ContactPage() {
  const form = useForm<ContactFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    validate: {
      name: (value) => {
        const result = z.string().min(1).safeParse(value);
        return result.success ? null : 'Please enter your name';
      },
      email: (value) => {
        const result = z.string().email().safeParse(value);
        return result.success ? null : 'Please enter a valid email address';
      },
      subject: (value) => {
        const result = z.string().min(5).safeParse(value);
        return result.success
          ? null
          : 'Subject must be at least 5 characters long';
      },
      message: (value) => {
        const result = z.string().min(10).safeParse(value);
        return result.success
          ? null
          : 'Message must be at least 10 characters long';
      },
    },
  });

  const mutation = useMutation({
    mutationFn: sendContactMessage,
    onSuccess: () => {
      form.reset();
    },
    onError: (error) => {
      // Handle validation errors from the server
      if (error.message.includes('Invalid form data')) {
        console.error('Validation error:', error);
      }
    },
  });

  return (
    <Container size="xs" my={40}>
      <Title style={{ fontWeight: 500 }} ta="center" order={2}>
        contact us
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
        if you have any questions, concerns or feedback please let us know!
      </Text>

      <Paper>
        {mutation.isSuccess && (
          <Notification
            icon={<IconCheck size="1.2rem" />}
            color="teal"
            title="success!"
            mt="md"
            mb="md"
            withCloseButton={false}
            style={{ boxShadow: 'none' }}
          >
            thanks for your message! we will get back to you as soon as
            possible.
          </Notification>
        )}

        {mutation.isError && (
          <Notification
            icon={<IconX size="1.2rem" />}
            color="red"
            title="oops!"
            mt="md"
            mb="md"
            withCloseButton={false}
            style={{ boxShadow: 'none' }}
          >
            an error occurred:{' '}
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'please try again.'}
          </Notification>
        )}
        <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
          <TextInput
            label="name"
            required
            key={form.key('name')}
            {...form.getInputProps('name')}
          />
          <TextInput
            label="email"
            required
            mt="md"
            key={form.key('email')}
            {...form.getInputProps('email')}
          />
          <TextInput
            label="subject"
            required
            mt="md"
            key={form.key('subject')}
            {...form.getInputProps('subject')}
          />
          <Textarea
            label="message"
            required
            mt="md"
            minRows={4}
            key={form.key('message')}
            {...form.getInputProps('message')}
          />

          <Button
            type="submit"
            color="#8d84b0"
            fullWidth
            mt="xl"
            loading={mutation.isPending}
            radius="xl"
          >
            {mutation.isPending ? 'sending...' : 'send message'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
