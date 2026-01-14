CREATE TABLE IF NOT EXISTS public.deployment_test (
  id int primary key,
  created_at timestamptz default now()
);