CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Preserve the first development schema instead of dropping customer data.
-- The API only ever created this exact legacy shape (integer id + total_price).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'preorders'
      AND column_name = 'total_price'
  ) THEN
    IF to_regclass('public.preorders_legacy_20261026') IS NULL THEN
      ALTER TABLE public.preorders RENAME TO preorders_legacy_20261026;
    ELSE
      RAISE EXCEPTION 'Legacy preorder backup already exists; review both tables before migrating';
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS preorders (
  id TEXT PRIMARY KEY DEFAULT ('XM-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10))),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'payment_pending', 'paid', 'expired', 'cancelled')),
  payment_url TEXT,
  booking_expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS preorders_user_created_idx ON preorders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS preorders_status_created_idx ON preorders (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS preorders_one_active_per_user_idx
  ON preorders (user_id)
  WHERE status NOT IN ('expired', 'cancelled');
