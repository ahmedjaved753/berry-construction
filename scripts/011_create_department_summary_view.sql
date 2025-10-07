-- Create Materialized View for Department Expense Summary
-- This provides fast, pre-calculated department financial data for /expenses page

-- Drop existing view if it exists (for re-running migration)
DROP MATERIALIZED VIEW IF EXISTS public.department_expense_summary;

-- Create the materialized view
CREATE MATERIALIZED VIEW public.department_expense_summary AS
SELECT
  d.id as department_id,
  d.user_id,
  d.name as department_name,
  d.status as department_status,

  -- Income calculations (ACCREC = Sales Invoices)
  COALESCE(SUM(CASE WHEN i.type = 'ACCREC' THEN li.line_amount ELSE 0 END), 0) as income_received,
  COALESCE(COUNT(DISTINCT CASE WHEN i.type = 'ACCREC' THEN i.id END), 0) as income_invoices,

  -- Expense calculations (ACCPAY = Bills/Purchases)
  COALESCE(SUM(CASE WHEN i.type = 'ACCPAY' THEN li.line_amount ELSE 0 END), 0) as expenses_spent,
  COALESCE(COUNT(DISTINCT CASE WHEN i.type = 'ACCPAY' THEN i.id END), 0) as expense_invoices,

  -- Total invoices (both types)
  COUNT(DISTINCT i.id) as total_invoices,

  -- Net profit (income - expenses)
  COALESCE(SUM(CASE WHEN i.type = 'ACCREC' THEN li.line_amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN i.type = 'ACCPAY' THEN li.line_amount ELSE 0 END), 0) as net_profit,

  -- Latest activity date
  MAX(i.invoice_date) as latest_activity,

  -- Metadata for tracking freshness
  now() as last_refreshed

FROM public.departments d
LEFT JOIN public.invoice_line_items li
  ON d.id = li.department_id
  AND d.user_id = li.user_id
LEFT JOIN public.invoices i
  ON li.invoice_id = i.id
  AND i.status IN ('PAID', 'AUTHORISED')  -- 🔑 Only include PAID/AUTHORISED invoices
GROUP BY d.id, d.user_id, d.name, d.status;

-- Create index for fast user_id lookups
CREATE INDEX idx_dept_summary_user_id ON public.department_expense_summary(user_id);

-- Create index for department_id lookups
CREATE INDEX idx_dept_summary_dept_id ON public.department_expense_summary(department_id);

-- Grant permissions
GRANT SELECT ON public.department_expense_summary TO authenticated;

-- Add helpful comment
COMMENT ON MATERIALIZED VIEW public.department_expense_summary IS
'Pre-calculated department financial summary. Refresh after Xero sync using: REFRESH MATERIALIZED VIEW department_expense_summary;';

-- Create RPC function to refresh the view (callable from batch sync scripts)
CREATE OR REPLACE FUNCTION public.refresh_department_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.department_expense_summary;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_department_summary() TO authenticated;

COMMENT ON FUNCTION public.refresh_department_summary() IS
'Refreshes the department_expense_summary materialized view. Call after syncing Xero data.';

-- Initial refresh to populate data
REFRESH MATERIALIZED VIEW public.department_expense_summary;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Materialized view created successfully!';
  RAISE NOTICE '📊 Initial data loaded from existing invoices and line items';
  RAISE NOTICE '🔄 View will auto-refresh after each Xero sync';
  RAISE NOTICE '📞 Call refresh_department_summary() RPC to manually refresh';
END $$;
