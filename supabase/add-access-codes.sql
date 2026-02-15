-- Table: access_codes
-- Maps 6-digit codes to Supabase auth user emails (for code-only login).
-- Only the API (using service role) should read this table.

CREATE TABLE IF NOT EXISTS public.access_codes (
    code TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS: no public access; API uses service role to look up code -> email
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: only service role can read (bypasses RLS)
-- So no CREATE POLICY needed for public access.

COMMENT ON TABLE public.access_codes IS 'Code-only login: 6-digit code -> auth user email. Run create-access-codes.js to seed 5 accounts.';
