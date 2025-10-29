-- Migration: Create User Favorite Departments Table
-- Created: 2025-01-26
-- Description: Add user_favorite_departments table for users to pin/favorite departments on the home screen

-- 1. USER FAVORITE DEPARTMENTS TABLE
CREATE TABLE public.user_favorite_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure unique favorite entry per user/department
  UNIQUE (user_id, department_id)
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_favorite_departments ENABLE ROW LEVEL SECURITY;

-- 3. CREATE RLS POLICIES
-- Users can view their own favorites
CREATE POLICY "Users can view their own favorite departments"
ON public.user_favorite_departments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorite departments"
ON public.user_favorite_departments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorite departments"
ON public.user_favorite_departments
FOR DELETE
USING (auth.uid() = user_id);

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_user_favorite_departments_user_id
  ON public.user_favorite_departments(user_id);
CREATE INDEX idx_user_favorite_departments_department_id
  ON public.user_favorite_departments(department_id);
CREATE INDEX idx_user_favorite_departments_user_dept
  ON public.user_favorite_departments(user_id, department_id);

-- 5. ADD HELPFUL COMMENTS
COMMENT ON TABLE public.user_favorite_departments IS 'Stores user favorite/pinned departments for personalized home screen display';
COMMENT ON COLUMN public.user_favorite_departments.user_id IS 'The user who favorited this department';
COMMENT ON COLUMN public.user_favorite_departments.department_id IS 'The department that was favorited';

-- Migration completed successfully
-- New table: user_favorite_departments
-- Features: RLS enabled, unique constraint, performance indexes
