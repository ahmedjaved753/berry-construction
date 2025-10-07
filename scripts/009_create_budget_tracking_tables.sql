-- Migration: Create Budget Tracking Tables
-- Created: 2024
-- Description: Add budget_summary_department and budget_summary_stage tables for project budget tracking

-- 1. BUDGET SUMMARY BY DEPARTMENT TABLE
CREATE TABLE public.budget_summary_department (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  
  -- Budget tracking fields
  budgeted_amount numeric DEFAULT 0 NOT NULL,
  actual_cost numeric DEFAULT 0 NOT NULL,
  remaining numeric GENERATED ALWAYS AS (budgeted_amount - actual_cost) STORED,
  
  -- Metadata
  last_updated timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique budget entry per user/department
  UNIQUE (user_id, department_id)
);

-- 2. BUDGET SUMMARY BY DEPARTMENT AND STAGE TABLE  
CREATE TABLE public.budget_summary_stage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  stage_id uuid REFERENCES public.stages(id) ON DELETE CASCADE NOT NULL,
  
  -- Budget tracking fields
  budgeted_amount numeric DEFAULT 0 NOT NULL,
  actual_cost numeric DEFAULT 0 NOT NULL,
  remaining numeric GENERATED ALWAYS AS (budgeted_amount - actual_cost) STORED,
  
  -- Metadata
  last_updated timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique budget entry per user/department/stage combination
  UNIQUE (user_id, department_id, stage_id)
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.budget_summary_department ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_summary_stage ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES
-- Budget Summary Department Policies
CREATE POLICY "Users can view their own budget_summary_department records." 
ON public.budget_summary_department
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget_summary_department records." 
ON public.budget_summary_department
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget_summary_department records." 
ON public.budget_summary_department
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget_summary_department records." 
ON public.budget_summary_department
FOR DELETE 
USING (auth.uid() = user_id);

-- Budget Summary Stage Policies
CREATE POLICY "Users can view their own budget_summary_stage records." 
ON public.budget_summary_stage
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget_summary_stage records." 
ON public.budget_summary_stage
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget_summary_stage records." 
ON public.budget_summary_stage
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget_summary_stage records." 
ON public.budget_summary_stage
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. CREATE INDEXES FOR PERFORMANCE
-- Budget Summary Department Indexes
CREATE INDEX idx_budget_summary_department_user_id ON public.budget_summary_department(user_id);
CREATE INDEX idx_budget_summary_department_department_id ON public.budget_summary_department(department_id);
CREATE INDEX idx_budget_summary_department_user_dept ON public.budget_summary_department(user_id, department_id);
CREATE INDEX idx_budget_summary_department_last_updated ON public.budget_summary_department(last_updated DESC);

-- Budget Summary Stage Indexes
CREATE INDEX idx_budget_summary_stage_user_id ON public.budget_summary_stage(user_id);
CREATE INDEX idx_budget_summary_stage_department_id ON public.budget_summary_stage(department_id);
CREATE INDEX idx_budget_summary_stage_stage_id ON public.budget_summary_stage(stage_id);
CREATE INDEX idx_budget_summary_stage_user_dept_stage ON public.budget_summary_stage(user_id, department_id, stage_id);
CREATE INDEX idx_budget_summary_stage_last_updated ON public.budget_summary_stage(last_updated DESC);

-- 6. CREATE FUNCTIONS TO AUTO-UPDATE last_updated TIMESTAMPS
CREATE OR REPLACE FUNCTION public.update_budget_summary_department_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_budget_summary_stage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CREATE TRIGGERS TO AUTO-UPDATE last_updated ON RECORD CHANGES
CREATE TRIGGER trigger_update_budget_summary_department_updated_at
  BEFORE UPDATE ON public.budget_summary_department
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_summary_department_updated_at();

CREATE TRIGGER trigger_update_budget_summary_stage_updated_at
  BEFORE UPDATE ON public.budget_summary_stage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_summary_stage_updated_at();

-- 8. ADD HELPFUL COMMENTS
COMMENT ON TABLE public.budget_summary_department IS 'Budget tracking at the department level - tracks budgeted vs actual costs per department';
COMMENT ON TABLE public.budget_summary_stage IS 'Budget tracking at the department + stage level - tracks budgeted vs actual costs per department/stage combination';

COMMENT ON COLUMN public.budget_summary_department.remaining IS 'Auto-calculated field: budgeted_amount - actual_cost';
COMMENT ON COLUMN public.budget_summary_stage.remaining IS 'Auto-calculated field: budgeted_amount - actual_cost';

COMMENT ON COLUMN public.budget_summary_department.budgeted_amount IS 'The planned/budgeted amount for this department';
COMMENT ON COLUMN public.budget_summary_department.actual_cost IS 'The actual amount spent for this department';

COMMENT ON COLUMN public.budget_summary_stage.budgeted_amount IS 'The planned/budgeted amount for this department+stage combination';
COMMENT ON COLUMN public.budget_summary_stage.actual_cost IS 'The actual amount spent for this department+stage combination';

-- Migration completed successfully
-- New tables: budget_summary_department, budget_summary_stage
-- Features: RLS enabled, auto-calculated remaining field, timestamps with triggers, performance indexes


