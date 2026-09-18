CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS products (
 id text PRIMARY KEY, sku text NOT NULL UNIQUE, data jsonb NOT NULL,
 stock integer NOT NULL CHECK(stock >= 0), version integer NOT NULL DEFAULT 1,
 CHECK((data->>'price')::bigint >= 0)
);
CREATE TABLE IF NOT EXISTS media (id text PRIMARY KEY, bytes bytea NOT NULL);
CREATE TABLE IF NOT EXISTS settings (id integer PRIMARY KEY CHECK(id=1), data jsonb NOT NULL, version integer NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL,
 password_hash text NOT NULL, role text NOT NULL CHECK(role IN ('customer','admin')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS reset_tokens (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS verify_tokens (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS orders (
 id text PRIMARY KEY, owner_id uuid NOT NULL REFERENCES users(id), idempotency_key uuid NOT NULL,
 request_hash text NOT NULL, data jsonb NOT NULL,
 payment_status text NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','failed','expired','review','refunded')),
 payment_link text, notification_token text, link_expires_at timestamptz,
 payment_started boolean NOT NULL DEFAULT false, released boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(owner_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS orders_owner ON orders(owner_id, created_at DESC);
CREATE TABLE IF NOT EXISTS payment_events (event_key text PRIMARY KEY, order_id text NOT NULL REFERENCES orders(id), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS promotions (code text PRIMARY KEY, data jsonb NOT NULL, uses integer NOT NULL DEFAULT 0 CHECK(uses>=0));
CREATE TABLE IF NOT EXISTS messages (id uuid PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_log (id uuid PRIMARY KEY, actor text NOT NULL, action text NOT NULL, entity text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS outbox (id text PRIMARY KEY, recipient text NOT NULL, subject text NOT NULL, body text NOT NULL, attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz);
CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
INSERT INTO schema_migrations(version) VALUES(1) ON CONFLICT DO NOTHING;
