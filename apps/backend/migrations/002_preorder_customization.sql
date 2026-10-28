-- Additive migration: preserve all historical orders and their product names.
ALTER TABLE public.preorders
  ADD COLUMN IF NOT EXISTS edition TEXT NOT NULL DEFAULT 'Default',
  ADD COLUMN IF NOT EXISTS customization TEXT;
