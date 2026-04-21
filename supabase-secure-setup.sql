-- ============================================================
-- Invoice Manager — Secure Schema Update
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. DROP EXISTING TABLES (CAUTION: DATA LOSS)
-- If you have data, you should migrate it. For a fresh setup:
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS settings;

-- 2. CREATE TABLES WITH user_id
CREATE TABLE settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_owner TEXT,
  business_name TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  pan TEXT,
  gstin TEXT,
  gpay TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  bank_type TEXT,
  invoice_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  shipping_name TEXT,
  shipping_phone TEXT,
  pan_number TEXT,
  gstin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'pcs',
  last_price NUMERIC DEFAULT 0,
  hsn_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('B2B', 'B2C')),
  invoice_date DATE DEFAULT CURRENT_DATE,
  payment_due DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_snapshot JSONB NOT NULL DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);

-- 3. ENABLE RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES
CREATE POLICY "Users can only access their own settings" ON settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own customers" ON customers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own inventory" ON inventory
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own invoices" ON invoices
  FOR ALL USING (auth.uid() = user_id);

-- 5. TRIGGERS FOR updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS customers_user_name_idx ON customers (user_id, LOWER(name));
CREATE INDEX IF NOT EXISTS inventory_user_name_idx ON inventory (user_id, LOWER(name));
CREATE INDEX IF NOT EXISTS invoices_user_date_idx ON invoices (user_id, invoice_date DESC);
