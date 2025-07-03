-- Mortgage Calculations and Payment Tracking Migration
-- This migration creates tables for storing mortgage calculations, down payments, and installment schedules

-- Create egyptian_banks table for bank information
CREATE TABLE IF NOT EXISTS egyptian_banks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_code TEXT UNIQUE NOT NULL, -- 'nbe', 'cib', 'qnb', etc.
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL, -- e.g., 18.5%
  max_loan_amount DECIMAL(15,2) NOT NULL, -- e.g., 15000000 EGP
  max_term_years INTEGER NOT NULL, -- e.g., 30 years
  min_down_payment_percent DECIMAL(5,2) NOT NULL, -- e.g., 20%
  processing_fee_percent DECIMAL(5,2) NOT NULL, -- e.g., 1.5%
  features TEXT[] DEFAULT '{}', -- Bank-specific features
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create mortgage_calculations table for storing user calculations
CREATE TABLE IF NOT EXISTS mortgage_calculations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL, -- Optional property reference
  
  -- Basic calculation data
  property_price DECIMAL(15,2) NOT NULL,
  down_payment_amount DECIMAL(15,2) NOT NULL,
  down_payment_percent DECIMAL(5,2) NOT NULL,
  loan_amount DECIMAL(15,2) NOT NULL,
  
  -- Bank and loan terms
  bank_id UUID REFERENCES egyptian_banks(id) ON DELETE SET NULL,
  bank_name TEXT NOT NULL, -- Store bank name for historical reference
  interest_rate DECIMAL(5,2) NOT NULL,
  term_years INTEGER NOT NULL,
  processing_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Calculated results
  monthly_payment DECIMAL(10,2) NOT NULL,
  total_interest DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  
  -- Additional context
  monthly_income DECIMAL(10,2), -- For affordability calculations
  debt_to_income_ratio DECIMAL(5,2), -- Calculated ratio
  calculation_type TEXT DEFAULT 'standard' CHECK (calculation_type IN ('standard', 'affordability')),
  
  -- Metadata
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create payment_schedules table for detailed installment breakdowns
CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mortgage_calculation_id UUID REFERENCES mortgage_calculations(id) ON DELETE CASCADE,
  
  -- Payment details
  payment_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  payment_date DATE, -- Actual or projected payment date
  payment_amount DECIMAL(10,2) NOT NULL,
  principal_amount DECIMAL(10,2) NOT NULL,
  interest_amount DECIMAL(10,2) NOT NULL,
  remaining_balance DECIMAL(15,2) NOT NULL,
  
  -- Payment status (for tracking actual payments)
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paid', 'late', 'missed')),
  paid_date DATE,
  paid_amount DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  UNIQUE(mortgage_calculation_id, payment_number)
);

-- Create down_payment_tracking table for tracking down payment progress
CREATE TABLE IF NOT EXISTS down_payment_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mortgage_calculation_id UUID REFERENCES mortgage_calculations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Down payment details
  total_required DECIMAL(15,2) NOT NULL,
  amount_saved DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  
  -- Savings tracking
  monthly_savings_goal DECIMAL(10,2),
  savings_frequency TEXT DEFAULT 'monthly' CHECK (savings_frequency IN ('weekly', 'bi-weekly', 'monthly', 'quarterly')),
  
  -- Progress tracking
  progress_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_required > 0 THEN (amount_saved / total_required * 100)
      ELSE 0 
    END
  ) STORED,
  
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create down_payment_savings table for individual savings entries
CREATE TABLE IF NOT EXISTS down_payment_savings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  down_payment_tracking_id UUID REFERENCES down_payment_tracking(id) ON DELETE CASCADE,
  
  -- Savings entry details
  amount DECIMAL(10,2) NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT,
  source TEXT, -- e.g., 'salary', 'bonus', 'investment', 'gift'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create affordability_assessments table for storing affordability calculations
CREATE TABLE IF NOT EXISTS affordability_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Income information
  monthly_income DECIMAL(10,2) NOT NULL,
  other_monthly_income DECIMAL(10,2) DEFAULT 0,
  total_monthly_income DECIMAL(10,2) GENERATED ALWAYS AS (monthly_income + other_monthly_income) STORED,
  
  -- Existing debts and expenses
  monthly_debt_payments DECIMAL(10,2) DEFAULT 0,
  monthly_expenses DECIMAL(10,2) DEFAULT 0,
  
  -- Calculated affordability
  max_monthly_payment DECIMAL(10,2) NOT NULL, -- Based on 33% debt-to-income ratio
  max_loan_amount DECIMAL(15,2) NOT NULL,
  max_property_price DECIMAL(15,2) NOT NULL,
  
  -- Assessment parameters
  debt_to_income_ratio DECIMAL(5,2) DEFAULT 33.0, -- Configurable ratio
  assumed_interest_rate DECIMAL(5,2) NOT NULL,
  assumed_term_years INTEGER NOT NULL,
  assumed_down_payment_percent DECIMAL(5,2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mortgage_calculations_user_id ON mortgage_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_mortgage_calculations_property_id ON mortgage_calculations(property_id);
CREATE INDEX IF NOT EXISTS idx_mortgage_calculations_bank_id ON mortgage_calculations(bank_id);
CREATE INDEX IF NOT EXISTS idx_mortgage_calculations_created_at ON mortgage_calculations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_mortgage_calc_id ON payment_schedules(mortgage_calculation_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_payment_date ON payment_schedules(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);

CREATE INDEX IF NOT EXISTS idx_down_payment_tracking_user_id ON down_payment_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_down_payment_tracking_mortgage_calc_id ON down_payment_tracking(mortgage_calculation_id);
CREATE INDEX IF NOT EXISTS idx_down_payment_tracking_target_date ON down_payment_tracking(target_date);

CREATE INDEX IF NOT EXISTS idx_down_payment_savings_tracking_id ON down_payment_savings(down_payment_tracking_id);
CREATE INDEX IF NOT EXISTS idx_down_payment_savings_entry_date ON down_payment_savings(entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_affordability_assessments_user_id ON affordability_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_affordability_assessments_created_at ON affordability_assessments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE egyptian_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortgage_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE down_payment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE down_payment_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affordability_assessments ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Egyptian banks - public read access
CREATE POLICY "Public read access to egyptian_banks"
  ON egyptian_banks FOR SELECT
  TO public
  USING (is_active = true);

-- Admin can manage banks
CREATE POLICY "Admins can manage egyptian_banks"
  ON egyptian_banks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- Mortgage calculations - users can manage their own
CREATE POLICY "Users can manage their mortgage_calculations"
  ON mortgage_calculations FOR ALL
  USING (user_id = auth.uid());

-- Payment schedules - users can access their own schedules
CREATE POLICY "Users can access their payment_schedules"
  ON payment_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mortgage_calculations mc
      WHERE mc.id = payment_schedules.mortgage_calculation_id
      AND mc.user_id = auth.uid()
    )
  );

-- Down payment tracking - users can manage their own
CREATE POLICY "Users can manage their down_payment_tracking"
  ON down_payment_tracking FOR ALL
  USING (user_id = auth.uid());

-- Down payment savings - users can manage their own
CREATE POLICY "Users can manage their down_payment_savings"
  ON down_payment_savings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM down_payment_tracking dpt
      WHERE dpt.id = down_payment_savings.down_payment_tracking_id
      AND dpt.user_id = auth.uid()
    )
  );

-- Affordability assessments - users can manage their own
CREATE POLICY "Users can manage their affordability_assessments"
  ON affordability_assessments FOR ALL
  USING (user_id = auth.uid());

-- Insert default Egyptian banks data
INSERT INTO egyptian_banks (bank_code, name, name_ar, interest_rate, max_loan_amount, max_term_years, min_down_payment_percent, processing_fee_percent, features) VALUES
('nbe', 'National Bank of Egypt', 'البنك الأهلي المصري', 18.5, 15000000, 30, 20, 1.5, ARRAY['أول بنك في مصر', 'شروط ميسرة', 'خدمة عملاء ممتازة']),
('cib', 'Commercial International Bank', 'البنك التجاري الدولي', 17.75, 20000000, 25, 15, 1.25, ARRAY['أسعار فائدة تنافسية', 'إجراءات سريعة', 'تمويل يصل إلى 85%']),
('qnb', 'QNB Al Ahli Bank', 'بنك قطر الوطني الأهلي', 18.25, 12000000, 30, 20, 1.0, ARRAY['رسوم إدارية منخفضة', 'مرونة في السداد', 'خدمات رقمية متطورة']),
('aaib', 'Arab African International Bank', 'البنك العربي الأفريقي', 19.0, 10000000, 25, 25, 1.75, ARRAY['خبرة في التمويل العقاري', 'استشارة مجانية', 'تقييم سريع للعقار']),
('banque_misr', 'Banque Misr', 'بنك مصر', 18.75, 8000000, 30, 20, 1.5, ARRAY['بنك حكومي موثوق', 'شروط مرنة', 'فروع في جميع المحافظات'])
ON CONFLICT (bank_code) DO NOTHING;

-- Create function to update down payment progress
CREATE OR REPLACE FUNCTION update_down_payment_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the total amount saved in down_payment_tracking
  UPDATE down_payment_tracking 
  SET 
    amount_saved = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM down_payment_savings 
      WHERE down_payment_tracking_id = NEW.down_payment_tracking_id
    ),
    updated_at = NOW()
  WHERE id = NEW.down_payment_tracking_id;
  
  -- Check if down payment is completed
  UPDATE down_payment_tracking 
  SET 
    is_completed = (amount_saved >= total_required),
    completed_at = CASE 
      WHEN amount_saved >= total_required AND NOT is_completed THEN NOW()
      WHEN amount_saved < total_required AND is_completed THEN NULL
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE id = NEW.down_payment_tracking_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for down payment progress updates
CREATE OR REPLACE TRIGGER trigger_update_down_payment_progress
  AFTER INSERT OR UPDATE OR DELETE ON down_payment_savings
  FOR EACH ROW
  EXECUTE FUNCTION update_down_payment_progress(); 