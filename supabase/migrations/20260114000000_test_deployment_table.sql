CREATE TABLE IF NOT EXISTS public.deployment_test (
    id integer PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    deployed_by text DEFAULT 'github_action'
);

COMMENT ON TABLE public.deployment_test IS 'Temporary table to verify CI/CD pipeline';