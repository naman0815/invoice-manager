-- ============================================================
-- Invoice Manager — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SETTINGS (single row per user/business)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
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

-- Insert default empty row
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
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

-- Index for search
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers (LOWER(name));
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers (phone);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'pcs',
  last_price NUMERIC DEFAULT 0,
  hsn_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_name_idx ON inventory (LOWER(name));

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoices_date_idx ON invoices (invoice_date DESC);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices (status);
CREATE INDEX IF NOT EXISTS invoices_type_idx ON invoices (invoice_type);
CREATE INDEX IF NOT EXISTS invoices_number_idx ON invoices (invoice_number);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
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

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable if you add authentication later. For now, keep open.
-- ============================================================
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SAMPLE DATA (optional — remove if not needed)
-- ============================================================
-- INSERT INTO inventory (name, description, unit, last_price) VALUES
--   ('Syngonium Kokedama', 'Indoor plant - Kokedama style', 'pcs', 800),
--   ('Parlor Palm Kokedama', 'Indoor palm - Kokedama style', 'pcs', 800),
--   ('Braided Pachira Kokedama', 'Money tree - Kokedama style', 'pcs', 1300),
--   ('Transportation', 'Delivery and transportation charges', 'lot', 0),
--   ('Labour & Supervision', 'Labour, materials and supervision', 'lot', 0);
