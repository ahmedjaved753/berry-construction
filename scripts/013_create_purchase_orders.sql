-- Create Purchase Orders schema for tracking Xero POs
-- This migration creates tables for purchase orders and their line items

-- 1. PURCHASE ORDERS TABLE
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Xero specific fields
  xero_po_id text NOT NULL,
  xero_contact_id text,
  xero_tenant_id text,

  -- Core PO data
  po_number text,
  status text NOT NULL, -- DRAFT, SUBMITTED, AUTHORISED, BILLED, DELETED
  reference text,

  -- Contact information
  contact_name text,

  -- Financial data
  total decimal(15,2) NOT NULL DEFAULT 0,
  sub_total decimal(15,2),
  total_tax decimal(15,2),
  currency_code text DEFAULT 'USD',

  -- Dates
  date date,
  delivery_date date,

  -- Additional fields
  has_attachments boolean DEFAULT false,

  -- Department/Stage assignment (nullable - can be assigned later)
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES public.stages(id) ON DELETE SET NULL,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure unique Xero PO per user
  UNIQUE (user_id, xero_po_id)
);

-- 2. PURCHASE ORDER LINE ITEMS TABLE
CREATE TABLE public.purchase_order_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Purchase order relationship
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,

  -- Xero line item data
  xero_line_item_id text,

  -- Line item details
  description text NOT NULL,
  quantity decimal(15,4) DEFAULT 1,
  unit_amount decimal(15,2),
  line_amount decimal(15,2) NOT NULL,
  tax_amount decimal(15,2) DEFAULT 0,

  -- Product/Account data
  item_code text,
  account_code text,
  tax_type text,

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

-- Purchase order indexes
CREATE INDEX idx_purchase_orders_user_id ON public.purchase_orders(user_id);
CREATE INDEX idx_purchase_orders_xero_po_id ON public.purchase_orders(xero_po_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON public.purchase_orders(date);
CREATE INDEX idx_purchase_orders_delivery_date ON public.purchase_orders(delivery_date);
CREATE INDEX idx_purchase_orders_department_id ON public.purchase_orders(department_id);
CREATE INDEX idx_purchase_orders_stage_id ON public.purchase_orders(stage_id);
CREATE INDEX idx_purchase_orders_contact_name ON public.purchase_orders(contact_name);

-- Purchase order line item indexes
CREATE INDEX idx_po_line_items_user_id ON public.purchase_order_line_items(user_id);
CREATE INDEX idx_po_line_items_purchase_order_id ON public.purchase_order_line_items(purchase_order_id);
CREATE INDEX idx_po_line_items_department_id ON public.purchase_order_line_items(department_id);
CREATE INDEX idx_po_line_items_stage_id ON public.purchase_order_line_items(stage_id);

-- ENABLE ROW LEVEL SECURITY

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_line_items ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES

-- Purchase orders policies
CREATE POLICY "Users can view and manage their own purchase orders" ON public.purchase_orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Purchase order line items policies
CREATE POLICY "Users can view and manage their own PO line items" ON public.purchase_order_line_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CREATE UPDATE TRIGGER FOR UPDATED_AT TIMESTAMPS

-- Apply update triggers (reuse existing function)
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_po_line_items_updated_at BEFORE UPDATE ON public.purchase_order_line_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE HELPFUL VIEWS FOR REPORTING

-- View: Purchase order summary
CREATE OR REPLACE VIEW purchase_order_summary AS
SELECT
  user_id,
  status,
  COUNT(*) as po_count,
  SUM(total) as total_amount,
  AVG(total) as average_amount,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM public.purchase_orders
GROUP BY user_id, status;

-- View: Department PO performance
CREATE OR REPLACE VIEW department_po_performance AS
SELECT
  d.user_id,
  d.id as department_id,
  d.name as department_name,
  COUNT(DISTINCT po.id) as po_count,
  COUNT(li.id) as line_item_count,
  SUM(li.line_amount) as total_amount,
  AVG(li.line_amount) as average_line_amount
FROM public.departments d
LEFT JOIN public.purchase_order_line_items li ON d.id = li.department_id
LEFT JOIN public.purchase_orders po ON li.purchase_order_id = po.id
WHERE d.status = 'active'
GROUP BY d.user_id, d.id, d.name;

-- Grant permissions on views
GRANT SELECT ON purchase_order_summary TO authenticated;
GRANT SELECT ON department_po_performance TO authenticated;

-- Add RLS to views
ALTER VIEW purchase_order_summary OWNER TO postgres;
ALTER VIEW department_po_performance OWNER TO postgres;
