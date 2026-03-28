/*
  # MindGuard Money - Personal Finance Application Schema

  ## Overview
  Creates the database structure for a behavior-based financial control system
  that tracks income, expenses, savings, and spending limits while providing
  psychological alerts to prevent impulsive spending.

  ## New Tables

  ### 1. `wallet`
  Stores user's financial balances (one row per user)
  - `id` (uuid, primary key) - Unique wallet identifier
  - `user_id` (uuid, references auth.users) - Owner of the wallet
  - `main_balance` (numeric) - Available spending balance
  - `savings_balance` (numeric) - Protected savings balance
  - `created_at` (timestamptz) - Wallet creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `transactions`
  Tracks all income and expense transactions
  - `id` (uuid, primary key) - Unique transaction identifier
  - `user_id` (uuid, references auth.users) - Transaction owner
  - `amount` (numeric) - Transaction amount
  - `type` (text) - Transaction type: 'income' or 'expense'
  - `category` (text) - Category: food, travel, salary, etc.
  - `description` (text) - Optional transaction description
  - `date` (timestamptz) - Transaction date
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `settings`
  Stores user preferences and limits (one row per user)
  - `id` (uuid, primary key) - Unique settings identifier
  - `user_id` (uuid, references auth.users) - Settings owner
  - `spending_limit` (numeric) - Monthly/daily spending limit
  - `savings_goal` (numeric) - Target savings amount
  - `created_at` (timestamptz) - Settings creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Policies enforce strict data isolation per user
*/

-- Create wallet table
CREATE TABLE IF NOT EXISTS wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  main_balance numeric DEFAULT 0 NOT NULL,
  savings_balance numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  description text DEFAULT '',
  date timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  spending_limit numeric DEFAULT 0 NOT NULL,
  savings_goal numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ADD COLUMN category_limits JSONB;
-- Wallet policies
CREATE POLICY "Users can view own wallet"
  ON wallet FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
  ON wallet FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON wallet FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallet"
  ON wallet FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);