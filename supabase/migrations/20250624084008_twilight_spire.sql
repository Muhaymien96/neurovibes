/*
  # Add task complexity column

  1. New Column
    - `complexity` (integer) - Task complexity indicator on a 1-5 scale
      - Default value: 3 (medium complexity)
      - Nullable: true
      - Check constraint: value must be between 1 and 5

  2. Index
    - Add index on complexity column for filtering and sorting

  3. Security
    - No RLS changes needed (inherits from existing task policies)
*/

-- Add complexity column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'complexity'
  ) THEN
    ALTER TABLE tasks ADD COLUMN complexity integer DEFAULT 3;
  END IF;
END $$;

-- Add check constraint to ensure complexity is between 1 and 5
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'tasks_complexity_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_complexity_check
    CHECK (complexity IS NULL OR (complexity >= 1 AND complexity <= 5));
  END IF;
END $$;

-- Create index for complexity filtering and sorting
CREATE INDEX IF NOT EXISTS tasks_complexity_idx ON tasks(complexity) WHERE complexity IS NOT NULL;