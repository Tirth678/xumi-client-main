-- Add client email configuration table
-- This allows each client/business to configure their own Gmail SMTP settings

CREATE TABLE IF NOT EXISTS client_email_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL UNIQUE, -- Could be organization ID, user ID, or tenant ID
  client_name TEXT NOT NULL,
  
  -- Gmail SMTP credentials (encrypted in production)
  smtp_user TEXT NOT NULL, -- Gmail address
  smtp_password TEXT NOT NULL, -- App password (should be encrypted)
  
  -- Email configuration
  email_from_name TEXT NOT NULL DEFAULT 'RoboCraft',
  email_from_address TEXT NOT NULL,
  email_reply_to TEXT,
  
  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  daily_limit INTEGER DEFAULT 500, -- Gmail free tier limit
  emails_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_email_sent_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS client_email_settings_client_id_idx ON client_email_settings (client_id);
CREATE INDEX IF NOT EXISTS client_email_settings_active_idx ON client_email_settings (is_active);

-- Add client_id reference to preorders table
ALTER TABLE preorders 
  ADD COLUMN IF NOT EXISTS client_id TEXT;

-- Index for client preorders
CREATE INDEX IF NOT EXISTS preorders_client_id_idx ON preorders (client_id);

-- Function to reset daily email counter
CREATE OR REPLACE FUNCTION reset_email_counter_if_needed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_reset_date < CURRENT_DATE THEN
    NEW.emails_sent_today := 0;
    NEW.last_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-reset counter daily
CREATE TRIGGER reset_email_counter_trigger
BEFORE UPDATE ON client_email_settings
FOR EACH ROW
EXECUTE FUNCTION reset_email_counter_if_needed();

COMMENT ON TABLE client_email_settings IS 'Stores Gmail SMTP credentials for each client/business using the platform';
COMMENT ON COLUMN client_email_settings.smtp_password IS 'Gmail App Password - should be encrypted at rest in production';
COMMENT ON COLUMN client_email_settings.daily_limit IS 'Gmail daily sending limit (500 for free, 2000 for Workspace)';
