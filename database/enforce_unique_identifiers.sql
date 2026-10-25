-- ============================================================================
-- College ERP: Enforce Unique Student Registration Numbers and Faculty Employee IDs
-- ============================================================================

-- 1. Ensure columns are NOT NULL
ALTER TABLE IF EXISTS public.students 
  ALTER COLUMN reg_no SET NOT NULL;

ALTER TABLE IF EXISTS public.faculty 
  ALTER COLUMN emp_id SET NOT NULL;

-- 2. Add or ensure primary UNIQUE constraints on canonical columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_reg_no_key'
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_reg_no_key UNIQUE (reg_no);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'faculty_emp_id_key'
  ) THEN
    ALTER TABLE public.faculty ADD CONSTRAINT faculty_emp_id_key UNIQUE (emp_id);
  END IF;
END $$;

-- 3. Add functional unique indexes to enforce case-insensitive & trimmed uniqueness
-- This prevents concurrent registration of identical identifiers with mixed casing or leading/trailing spaces.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_students_reg_no_normalized 
  ON public.students (UPPER(TRIM(reg_no)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_faculty_emp_id_normalized 
  ON public.faculty (UPPER(TRIM(emp_id)));

-- 4. Audit query to verify uniqueness and detect any existing duplicate records
-- Both queries should return 0 rows
SELECT UPPER(TRIM(reg_no)) AS normalized_reg_no, COUNT(*) AS duplicate_count, array_agg(id) AS student_ids
FROM public.students
GROUP BY UPPER(TRIM(reg_no))
HAVING COUNT(*) > 1;

SELECT UPPER(TRIM(emp_id)) AS normalized_emp_id, COUNT(*) AS duplicate_count, array_agg(id) AS faculty_ids
FROM public.faculty
GROUP BY UPPER(TRIM(emp_id))
HAVING COUNT(*) > 1;
