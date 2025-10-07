-- Create table to track backfill progress
CREATE TABLE IF NOT EXISTS public.line_items_sync_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Progress tracking
  last_processed_invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  last_processed_index integer DEFAULT 0,
  total_invoices integer DEFAULT 0,
  invoices_processed integer DEFAULT 0,
  line_items_synced integer DEFAULT 0,
  
  -- Statistics
  with_department_count integer DEFAULT 0,
  with_stage_count integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  
  -- Status
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  
  -- Timestamps
  started_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  
  -- Ensure one progress record per user
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.line_items_sync_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own sync progress" 
  ON public.line_items_sync_progress
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_sync_progress_user_id ON public.line_items_sync_progress(user_id);
CREATE INDEX idx_sync_progress_status ON public.line_items_sync_progress(status);

-- Update trigger
CREATE TRIGGER update_sync_progress_updated_at 
  BEFORE UPDATE ON public.line_items_sync_progress
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.line_items_sync_progress IS 'Tracks progress of line items backfill to enable resume capability';
