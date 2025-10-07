-- Create comprehensive Xero data schemas for construction business
-- This migration creates tables for invoices, departments, stages, and line items

-- 1. INVOICES TABLE (Both sales invoices and bills)
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Xero specific fields
  xero_invoice_id text NOT NULL,
  xero_contact_id text,
  
  -- Core invoice data
  type text NOT NULL CHECK (type IN ('ACCREC', 'ACCPAY')), -- ACCREC = sales, ACCPAY = bills
  status text NOT NULL,
  reference text,
  
  -- Contact information
  contact_name text,
  
  -- Financial data
  total decimal(15,2) NOT NULL DEFAULT 0,
  sub_total decimal(15,2),
  total_tax decimal(15,2),
  currency_code text DEFAULT 'USD',
  
  -- Dates
  invoice_date date,
  due_date date,
  
  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique Xero invoice per user
  UNIQUE (user_id, xero_invoice_id)
);

-- 2. DEPARTMENTS TABLE (Linked to Xero tracking categories)
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Xero tracking option data
  xero_tracking_option_id text NOT NULL,
  xero_tracking_category_id text, -- Parent category ID from Xero
  
  -- Department info
  name text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')) NOT NULL,
  
  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique tracking option per user
  UNIQUE (user_id, xero_tracking_option_id)
);

-- 3. STAGES TABLE (Also linked to Xero tracking categories)
CREATE TABLE public.stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Xero tracking option data  
  xero_tracking_option_id text NOT NULL,
  xero_tracking_category_id text, -- Parent category ID from Xero
  
  -- Stage info
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0, -- For ordering stages in UI
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')) NOT NULL,
  
  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique tracking option per user
  UNIQUE (user_id, xero_tracking_option_id)
);

-- 4. INVOICE LINE ITEMS TABLE (Links invoices to departments and stages)
CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Invoice relationship
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Xero line item data
  xero_line_item_id text, -- If Xero provides line item IDs
  
  -- Line item details
  description text NOT NULL,
  quantity decimal(15,4) DEFAULT 1,
  unit_amount decimal(15,2),
  line_amount decimal(15,2) NOT NULL,
  tax_amount decimal(15,2) DEFAULT 0,
  
  -- Tracking relationships (nullable - not all line items may have tracking)
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES public.stages(id) ON DELETE SET NULL,
  
  -- Additional Xero tracking data (raw JSON for flexibility)
  xero_tracking_data jsonb,
  
  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- CREATE INDEXES FOR PERFORMANCE

-- Invoice indexes
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_type ON public.invoices(type);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX idx_invoices_total ON public.invoices(total);

-- Department indexes
CREATE INDEX idx_departments_user_id ON public.departments(user_id);
CREATE INDEX idx_departments_status ON public.departments(status);
CREATE INDEX idx_departments_name ON public.departments(name);

-- Stage indexes
CREATE INDEX idx_stages_user_id ON public.stages(user_id);
CREATE INDEX idx_stages_status ON public.stages(status);
CREATE INDEX idx_stages_sort_order ON public.stages(sort_order);

-- Line item indexes
CREATE INDEX idx_line_items_user_id ON public.invoice_line_items(user_id);
CREATE INDEX idx_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_department_id ON public.invoice_line_items(department_id);
CREATE INDEX idx_line_items_stage_id ON public.invoice_line_items(stage_id);

-- ENABLE ROW LEVEL SECURITY

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES

-- Invoices policies
CREATE POLICY "Users can view and manage their own invoices" ON public.invoices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Departments policies  
CREATE POLICY "Users can view and manage their own departments" ON public.departments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Stages policies
CREATE POLICY "Users can view and manage their own stages" ON public.stages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Line items policies
CREATE POLICY "Users can view and manage their own invoice line items" ON public.invoice_line_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CREATE UPDATE TRIGGER FOR UPDATED_AT TIMESTAMPS

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON public.stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_line_items_updated_at BEFORE UPDATE ON public.invoice_line_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE HELPFUL VIEWS FOR REPORTING

-- View: Invoice summary with totals by type
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
  user_id,
  type,
  status,
  COUNT(*) as invoice_count,
  SUM(total) as total_amount,
  AVG(total) as average_amount,
  MIN(invoice_date) as earliest_date,
  MAX(invoice_date) as latest_date
FROM public.invoices
GROUP BY user_id, type, status;

-- View: Department performance (total amounts by department)
CREATE OR REPLACE VIEW department_performance AS
SELECT 
  d.user_id,
  d.id as department_id,
  d.name as department_name,
  COUNT(li.id) as line_item_count,
  SUM(li.line_amount) as total_amount,
  AVG(li.line_amount) as average_line_amount
FROM public.departments d
LEFT JOIN public.invoice_line_items li ON d.id = li.department_id
WHERE d.status = 'active'
GROUP BY d.user_id, d.id, d.name;

-- View: Stage performance (total amounts by stage)
CREATE OR REPLACE VIEW stage_performance AS
SELECT 
  s.user_id,
  s.id as stage_id,
  s.name as stage_name,
  s.sort_order,
  COUNT(li.id) as line_item_count,
  SUM(li.line_amount) as total_amount,
  AVG(li.line_amount) as average_line_amount
FROM public.stages s
LEFT JOIN public.invoice_line_items li ON s.id = li.stage_id
WHERE s.status = 'active'
GROUP BY s.user_id, s.id, s.name, s.sort_order
ORDER BY s.sort_order;

-- Grant permissions on views
GRANT SELECT ON invoice_summary TO authenticated;
GRANT SELECT ON department_performance TO authenticated;
GRANT SELECT ON stage_performance TO authenticated;

-- Add RLS to views
ALTER VIEW invoice_summary OWNER TO postgres;
ALTER VIEW department_performance OWNER TO postgres; 
ALTER VIEW stage_performance OWNER TO postgres;


