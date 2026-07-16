CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text,
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_secret;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_verified_at;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
UPDATE users
SET
  trial_started_at = COALESCE(trial_started_at, created_at),
  trial_ends_at = COALESCE(trial_ends_at, created_at + interval '14 days')
WHERE trial_started_at IS NULL
   OR trial_ends_at IS NULL;
ALTER TABLE users ALTER COLUMN trial_started_at SET DEFAULT now();
ALTER TABLE users ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '14 days');
ALTER TABLE users ALTER COLUMN trial_started_at SET NOT NULL;
ALTER TABLE users ALTER COLUMN trial_ends_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_role_status_idx ON users (role, status);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
  code_hash text,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_challenges_user_id_idx ON auth_challenges (user_id);
CREATE INDEX IF NOT EXISTS auth_challenges_purpose_idx ON auth_challenges (purpose);
CREATE INDEX IF NOT EXISTS auth_challenges_expires_at_idx ON auth_challenges (expires_at);

DELETE FROM auth_challenges WHERE purpose = 'two_factor_login';

DO $$
BEGIN
  ALTER TABLE auth_challenges DROP CONSTRAINT IF EXISTS auth_challenges_purpose_check;
  ALTER TABLE auth_challenges
    ADD CONSTRAINT auth_challenges_purpose_check
    CHECK (purpose IN ('email_verification', 'password_reset'));
END $$;

CREATE TABLE IF NOT EXISTS kyc_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'individual' CHECK (account_type IN ('individual', 'company')),
  phone text NOT NULL,
  job_title text NOT NULL,
  business_name text NOT NULL,
  business_type text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  website text,
  primary_goal text NOT NULL,
  bio text,
  profile_slug text,
  avatar_url text,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS profile_slug text;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE kyc_profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'individual';
ALTER TABLE kyc_profiles DROP CONSTRAINT IF EXISTS kyc_profiles_account_type_check;
ALTER TABLE kyc_profiles
  ADD CONSTRAINT kyc_profiles_account_type_check
  CHECK (account_type IN ('individual', 'company'));

CREATE INDEX IF NOT EXISTS kyc_profiles_user_id_idx ON kyc_profiles (user_id);
CREATE INDEX IF NOT EXISTS kyc_profiles_account_type_idx ON kyc_profiles (account_type);

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  title text,
  company text,
  slug text NOT NULL,
  bio text,
  email text,
  phone text,
  website text,
  avatar_url text,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  views integer NOT NULL DEFAULT 0,
  taps integer NOT NULL DEFAULT 0,
  qr_scans integer NOT NULL DEFAULT 0,
  contact_downloads integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cards ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey;
ALTER TABLE cards ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS contact_downloads integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS cards_slug_idx ON cards (slug);
CREATE INDEX IF NOT EXISTS cards_user_id_idx ON cards (user_id);
CREATE INDEX IF NOT EXISTS cards_user_created_idx ON cards (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cards_active_slug_idx ON cards (slug) WHERE active = true;

CREATE TABLE IF NOT EXISTS card_engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('profile_view', 'qr_scan', 'nfc_tap', 'contact_download', 'social_click')),
  referrer text,
  user_agent text,
  ip_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE card_engagement_events ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
DO $$
BEGIN
  ALTER TABLE card_engagement_events DROP CONSTRAINT IF EXISTS card_engagement_events_event_type_check;
  ALTER TABLE card_engagement_events
    ADD CONSTRAINT card_engagement_events_event_type_check
    CHECK (event_type IN ('profile_view', 'qr_scan', 'nfc_tap', 'contact_download', 'social_click'));
END $$;

CREATE INDEX IF NOT EXISTS card_engagement_events_card_id_idx ON card_engagement_events (card_id);
CREATE INDEX IF NOT EXISTS card_engagement_events_card_created_idx ON card_engagement_events (card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS card_engagement_events_user_created_idx ON card_engagement_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS card_engagement_events_type_created_idx ON card_engagement_events (event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  job_title text,
  message text,
  source text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title text;

CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads (user_id);
CREATE INDEX IF NOT EXISTS leads_user_created_idx ON leads (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_card_id_idx ON leads (card_id);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_email text,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  appointment_date date,
  appointment_time text,
  appointment_message text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visitor_name text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visitor_email text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visitor_phone text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_date date;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_time text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_message text;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
UPDATE appointments SET status = 'pending' WHERE status = 'scheduled';
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'user_id'
  ) THEN
    UPDATE appointments SET assigned_user_id = COALESCE(assigned_user_id, user_id);
    ALTER TABLE appointments DROP COLUMN user_id;
  END IF;
END $$;

UPDATE appointments
SET
  visitor_name = COALESCE(visitor_name, guest_name),
  visitor_email = COALESCE(visitor_email, guest_email),
  appointment_date = COALESCE(appointment_date, starts_at::date),
  appointment_time = COALESCE(appointment_time, to_char(starts_at, 'HH24:MI')),
  appointment_message = COALESCE(appointment_message, notes)
WHERE visitor_name IS NULL
   OR visitor_email IS NULL
   OR appointment_date IS NULL
   OR appointment_time IS NULL
   OR appointment_message IS NULL;

DROP INDEX IF EXISTS appointments_user_id_idx;
CREATE INDEX IF NOT EXISTS appointments_assigned_user_id_idx ON appointments (assigned_user_id);
CREATE INDEX IF NOT EXISTS appointments_assigned_starts_idx ON appointments (assigned_user_id, starts_at);
CREATE INDEX IF NOT EXISTS appointments_card_id_idx ON appointments (card_id);
CREATE INDEX IF NOT EXISTS appointments_lead_id_idx ON appointments (lead_id);
CREATE INDEX IF NOT EXISTS appointments_starts_at_idx ON appointments (starts_at);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments (status);
CREATE INDEX IF NOT EXISTS appointments_appointment_date_idx ON appointments (appointment_date);
CREATE UNIQUE INDEX IF NOT EXISTS appointments_no_duplicate_active_booking_idx
ON appointments (assigned_user_id, card_id, visitor_email, starts_at)
WHERE status IN ('pending', 'approved');

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'jostap_nfc', 'custom_nfc', 'basic_renewal', 'premium_renewal')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('free', 'one_time', 'yearly')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'past_due', 'cancelled')),
  provider text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_created_idx ON subscriptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_active_idx
ON subscriptions (user_id)
WHERE status IN ('pending', 'active', 'past_due');

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  provider text,
  provider_payment_id text,
  order_id text,
  order_plan text,
  order_product_name text,
  order_account jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments (user_id);
CREATE INDEX IF NOT EXISTS payments_user_created_idx ON payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_subscription_id_idx ON payments (subscription_id);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_plan text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_product_name text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_account jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_email_sent_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS payments_order_id_key ON payments (order_id) WHERE order_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_number text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'void', 'uncollectible')),
  provider_invoice_id text,
  hosted_invoice_url text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices (user_id);
CREATE INDEX IF NOT EXISTS invoices_user_issued_idx ON invoices (user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS invoices_subscription_id_idx ON invoices (subscription_id);

CREATE TABLE IF NOT EXISTS card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color_primary text NOT NULL DEFAULT '#2563EB',
  color_secondary text NOT NULL DEFAULT '#1E3A8A',
  is_premium boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  plan text NOT NULL DEFAULT 'premium_renewal' CHECK (plan IN ('free', 'jostap_nfc', 'custom_nfc', 'basic_renewal', 'premium_renewal')),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  subject text NOT NULL,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS static_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  monthly_cents integer NOT NULL DEFAULT 0,
  yearly_cents integer NOT NULL DEFAULT 0,
  card_limit integer,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  subtitle text,
  description text NOT NULL DEFAULT '',
  badge text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  checkout_path text NOT NULL DEFAULT '/checkout?plan=jostap_nfc&billing=one_time',
  artwork_key text NOT NULL DEFAULT 'lagos_vibes',
  front_image_url text,
  back_image_url text,
  inventory_status text NOT NULL DEFAULT 'available' CHECK (inventory_status IN ('available', 'limited', 'sold_out', 'draft')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_products_active_sort_idx ON shop_products (is_active, sort_order, created_at DESC);

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  source text,
  source_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS source_id text;
CREATE INDEX IF NOT EXISTS admin_notifications_source_idx ON admin_notifications (source, source_id);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'users', 'admins')),
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS announcements_status_idx ON announcements (status);
CREATE INDEX IF NOT EXISTS announcements_published_at_idx ON announcements (published_at);
CREATE INDEX IF NOT EXISTS announcements_admin_user_id_idx ON announcements (admin_user_id);
CREATE INDEX IF NOT EXISTS announcements_target_user_id_idx ON announcements (target_user_id);
CREATE INDEX IF NOT EXISTS announcements_user_inbox_idx
ON announcements (target_user_id, status, published_at DESC);

CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS announcement_reads_user_id_idx ON announcement_reads (user_id);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  guest_name text,
  guest_email text,
  subject text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_email text;

CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets (user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_user_created_idx ON support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_admin_queue_idx ON support_tickets (status, priority, updated_at DESC);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('user', 'admin', 'system')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_id_idx ON support_ticket_messages (ticket_id);
CREATE INDEX IF NOT EXISTS support_ticket_messages_sender_user_id_idx ON support_ticket_messages (sender_user_id);
CREATE INDEX IF NOT EXISTS support_ticket_messages_created_at_idx ON support_ticket_messages (created_at);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_user_id_idx ON admin_audit_logs (admin_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON admin_audit_logs (created_at);

INSERT INTO card_templates (name, description, color_primary, color_secondary, is_premium)
VALUES
  ('Navy Pro', 'Clean professional digital card template.', '#2563EB', '#1E3A8A', false),
  ('Emerald', 'Growth-focused green visual theme.', '#059669', '#065F46', false),
  ('Violet Premium', 'Premium vivid profile theme.', '#7C3AED', '#4C1D95', true)
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;
  ALTER TABLE premium_features DROP CONSTRAINT IF EXISTS premium_features_plan_check;
  UPDATE subscriptions
  SET plan = CASE
    WHEN plan = 'starter' THEN 'free'
    WHEN plan = 'professional' THEN 'jostap_nfc'
    WHEN plan = 'business' THEN 'custom_nfc'
    ELSE plan
  END;
  UPDATE subscriptions
  SET billing_cycle = CASE
    WHEN billing_cycle IN ('monthly', 'one_time') THEN 'one_time'
    WHEN billing_cycle = 'yearly' THEN 'yearly'
    ELSE 'one_time'
  END;
  UPDATE premium_features
  SET plan = CASE
    WHEN plan = 'starter' THEN 'free'
    WHEN plan = 'professional' THEN 'premium_renewal'
    WHEN plan = 'business' THEN 'custom_nfc'
    ELSE plan
  END;
  ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'jostap_nfc', 'custom_nfc', 'basic_renewal', 'premium_renewal'));
  ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_billing_cycle_check CHECK (billing_cycle IN ('free', 'one_time', 'yearly'));
  ALTER TABLE premium_features ADD CONSTRAINT premium_features_plan_check CHECK (plan IN ('free', 'jostap_nfc', 'custom_nfc', 'basic_renewal', 'premium_renewal'));
END $$;

INSERT INTO premium_features (name, description, plan)
VALUES
  ('Basic analytics', 'Core analytics dashboard for free and NFC card users.', 'free'),
  ('Advanced analytics', 'Detailed card performance analytics.', 'premium_renewal'),
  ('Appointment booking', 'Booking links and appointment activity.', 'premium_renewal'),
  ('Lead capture', 'Capture visitor details from public profiles.', 'premium_renewal'),
  ('Visitor insights', 'See visitor behavior and engagement insights.', 'premium_renewal'),
  ('Downloadable QR code', 'Download QR codes for print and offline sharing.', 'premium_renewal'),
  ('Catalog section', 'Showcase products, services, and offers on public profiles.', 'premium_renewal'),
  ('Testimonials', 'Publish customer testimonials on premium profiles.', 'premium_renewal'),
  ('Custom branding', 'Custom branded card and profile experience.', 'custom_nfc')
ON CONFLICT (name) DO NOTHING;

INSERT INTO email_templates (key, subject, body)
VALUES
  ('welcome', 'Welcome to JOSTAP', 'Welcome {{name}}, your digital card dashboard is ready.'),
  ('kyc_complete', 'Your profile is ready', 'Thanks {{name}}, your account setup is complete.'),
  ('lead_received', 'New lead captured', 'You received a new lead from {{card_name}}.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO static_pages (slug, title, content)
VALUES
  ('privacy', 'Privacy Policy', 'Privacy page content.'),
  ('terms', 'Terms of Service', 'Terms page content.'),
  ('pricing', 'Pricing', 'Pricing page content.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO faqs (question, answer, category, sort_order)
VALUES
  ('How do NFC cards work?', 'Tap the NFC card on a compatible phone to open the linked digital profile.', 'Cards', 1),
  ('Can I use a QR code?', 'Yes. Every card includes a public URL and QR code.', 'Cards', 2),
  ('Can I change my plan?', 'Yes. Plans can be managed from billing.', 'Billing', 3)
ON CONFLICT DO NOTHING;

INSERT INTO pricing_plans (slug, name, monthly_cents, yearly_cents, card_limit, features, is_active)
VALUES
  ('free', 'Free', 0, 0, 1, '["1 Digital Business Card", "Public Profile Page", "JOSTAP Branded QR Code", "Contact Sharing", "Save Contact (vCard)", "Social Media Links", "Basic Analytics"]'::jsonb, true),
  ('jostap_nfc', 'JOSTAP Card', 2000000, 0, 1, '["Physical NFC card", "Digital business profile", "Downloadable QR code", "Contact sharing", "Save contact (vCard)", "Social media links", "Contact save tracking", "Appointment booking", "Advanced analytics", "Premium features", "1 year premium access included"]'::jsonb, true),
  ('custom_nfc', 'Custom Card', 2500000, 0, 1, '["Physical NFC card", "Digital business profile", "Downloadable QR code", "Contact sharing", "Save contact (vCard)", "Social media links", "Contact save tracking", "Appointment booking", "Advanced analytics", "Premium features", "1 year premium access included"]'::jsonb, true),
  ('basic_renewal', 'Team Access Renewal', 0, 1000000, 1, '["Team yearly subscription", "Team card profile access", "Premium team features"]'::jsonb, true),
  ('premium_renewal', 'Premium Access Repayment', 0, 1500000, 1, '["Advanced Analytics", "Lead Capture", "Appointment Booking", "Visitor Insights", "Downloadable QR Code", "Catalog Section", "Testimonials", "Premium Features"]'::jsonb, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_cents = EXCLUDED.monthly_cents,
  yearly_cents = EXCLUDED.yearly_cents,
  card_limit = EXCLUDED.card_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO shop_products (
  slug,
  name,
  subtitle,
  description,
  badge,
  price_cents,
  currency,
  checkout_path,
  artwork_key,
  inventory_status,
  sort_order,
  is_active
)
VALUES (
  'lagos-vibes-nfc-card',
  'Lagos Vibes NFC Card',
  'Tap-to-share NFC business card',
  'A ready-to-order NFC card with a Lagos-inspired front, QR-enabled back, and digital profile connection.',
  'Available now',
  2000000,
  'NGN',
  '/checkout?plan=jostap_nfc&billing=one_time',
  'lagos_vibes',
  'available',
  10,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  badge = EXCLUDED.badge,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  checkout_path = EXCLUDED.checkout_path,
  artwork_key = EXCLUDED.artwork_key,
  inventory_status = EXCLUDED.inventory_status,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO role_permissions (role, description, permissions)
VALUES
  ('admin', 'Full super admin access.', '["users:manage", "cards:manage", "billing:manage", "content:manage", "reports:export", "roles:manage", "appointments:manage", "support:manage", "announcements:manage", "notifications:manage"]'::jsonb),
  ('user', 'Standard dashboard access.', '["cards:own", "billing:own", "profile:own"]'::jsonb)
ON CONFLICT (role) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = now();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_kyc_profiles_updated_at ON kyc_profiles;
CREATE TRIGGER set_kyc_profiles_updated_at
BEFORE UPDATE ON kyc_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_cards_updated_at ON cards;
CREATE TRIGGER set_cards_updated_at
BEFORE UPDATE ON cards
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_leads_updated_at ON leads;
CREATE TRIGGER set_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_appointments_updated_at ON appointments;
CREATE TRIGGER set_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_card_templates_updated_at ON card_templates;
CREATE TRIGGER set_card_templates_updated_at
BEFORE UPDATE ON card_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_premium_features_updated_at ON premium_features;
CREATE TRIGGER set_premium_features_updated_at
BEFORE UPDATE ON premium_features
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_email_templates_updated_at ON email_templates;
CREATE TRIGGER set_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_static_pages_updated_at ON static_pages;
CREATE TRIGGER set_static_pages_updated_at
BEFORE UPDATE ON static_pages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_faqs_updated_at ON faqs;
CREATE TRIGGER set_faqs_updated_at
BEFORE UPDATE ON faqs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_pricing_plans_updated_at ON pricing_plans;
CREATE TRIGGER set_pricing_plans_updated_at
BEFORE UPDATE ON pricing_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_shop_products_updated_at ON shop_products;
CREATE TRIGGER set_shop_products_updated_at
BEFORE UPDATE ON shop_products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER set_role_permissions_updated_at
BEFORE UPDATE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_announcements_updated_at ON announcements;
CREATE TRIGGER set_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER set_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_own_select ON users;
CREATE POLICY users_own_select ON users
FOR SELECT TO authenticated
USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS sessions_own_select ON sessions;
CREATE POLICY sessions_own_select ON sessions
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS sessions_own_delete ON sessions;
CREATE POLICY sessions_own_delete ON sessions
FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS auth_challenges_own_select ON auth_challenges;
CREATE POLICY auth_challenges_own_select ON auth_challenges
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS kyc_profiles_own_all ON kyc_profiles;
CREATE POLICY kyc_profiles_own_all ON kyc_profiles
FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS cards_own_all ON cards;
CREATE POLICY cards_own_all ON cards
FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS card_engagement_events_own_select ON card_engagement_events;
CREATE POLICY card_engagement_events_own_select ON card_engagement_events
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS leads_own_all ON leads;
CREATE POLICY leads_own_all ON leads
FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS appointments_own_all ON appointments;
CREATE POLICY appointments_own_all ON appointments
FOR ALL TO authenticated
USING ((select auth.uid()) = assigned_user_id)
WITH CHECK ((select auth.uid()) = assigned_user_id);

DROP POLICY IF EXISTS subscriptions_own_select ON subscriptions;
CREATE POLICY subscriptions_own_select ON subscriptions
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS payments_own_select ON payments;
CREATE POLICY payments_own_select ON payments
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS invoices_own_select ON invoices;
CREATE POLICY invoices_own_select ON invoices
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS announcements_visible_to_user ON announcements;
CREATE POLICY announcements_visible_to_user ON announcements
FOR SELECT TO authenticated
USING (
  status = 'published'
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    target_user_id = (select auth.uid())
    OR (target_user_id IS NULL AND audience IN ('all', 'users'))
  )
);

DROP POLICY IF EXISTS announcement_reads_own_all ON announcement_reads;
CREATE POLICY announcement_reads_own_all ON announcement_reads
FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS support_tickets_own_all ON support_tickets;
CREATE POLICY support_tickets_own_all ON support_tickets
FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS support_ticket_messages_own_select ON support_ticket_messages;
CREATE POLICY support_ticket_messages_own_select ON support_ticket_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM support_tickets
    WHERE support_tickets.id = support_ticket_messages.ticket_id
      AND support_tickets.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS support_ticket_messages_own_insert ON support_ticket_messages;
CREATE POLICY support_ticket_messages_own_insert ON support_ticket_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_user_id = (select auth.uid())
  AND sender_role = 'user'
  AND EXISTS (
    SELECT 1
    FROM support_tickets
    WHERE support_tickets.id = support_ticket_messages.ticket_id
      AND support_tickets.user_id = (select auth.uid())
  )
);

DO $$
DECLARE
  policy_table text;
BEGIN
  FOREACH policy_table IN ARRAY ARRAY[
    'users',
    'sessions',
    'auth_challenges',
    'kyc_profiles',
    'cards',
    'card_engagement_events',
    'leads',
    'appointments',
    'subscriptions',
    'payments',
    'invoices',
    'card_templates',
    'premium_features',
    'email_templates',
    'static_pages',
    'faqs',
    'pricing_plans',
    'shop_products',
    'role_permissions',
    'admin_notifications',
    'announcements',
    'announcement_reads',
    'support_tickets',
    'support_ticket_messages',
    'admin_audit_logs'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = policy_table
        AND policyname = 'server_role_full_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY server_role_full_access ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        policy_table
      );
    END IF;
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO service_role;
