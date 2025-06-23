/*
  # MindMesh Feature Enhancements

  1. Enhanced Task Management
    - Add parent_task_id for sub-tasks and nested tasks
    - Add recurrence_pattern and recurrence_end_date for recurring tasks
    - Add task_order for drag-and-drop reordering
    - Add tags array for better categorization

  2. Enhanced Integrations
    - Add sync_rules column to user_integrations for customizable sync behavior

  3. Indexes and Constraints
    - Add indexes for better performance
    - Add constraints for data integrity
*/

-- Add new columns to tasks table for enhanced functionality
DO $$
BEGIN
  -- Add parent_task_id for sub-tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'parent_task_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;

  -- Add recurrence_pattern for recurring tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurrence_pattern'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_pattern text;
  END IF;

  -- Add recurrence_end_date for recurring tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurrence_end_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_end_date timestamptz;
  END IF;

  -- Add task_order for drag-and-drop reordering
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'task_order'
  ) THEN
    ALTER TABLE tasks ADD COLUMN task_order integer DEFAULT 0;
  END IF;

  -- Add tags array for better categorization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'tags'
  ) THEN
    ALTER TABLE tasks ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Add sync_rules column to user_integrations for customizable sync behavior
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_integrations' AND column_name = 'sync_rules'
  ) THEN
    ALTER TABLE user_integrations ADD COLUMN sync_rules jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add constraints for recurrence_pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'tasks_recurrence_pattern_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_recurrence_pattern_check
    CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_parent_task_id_idx ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS tasks_recurrence_pattern_idx ON tasks(recurrence_pattern) WHERE recurrence_pattern IS NOT NULL;
CREATE INDEX IF NOT EXISTS tasks_order_idx ON tasks(user_id, task_order);
CREATE INDEX IF NOT EXISTS tasks_tags_idx ON tasks USING gin(tags);
CREATE INDEX IF NOT EXISTS user_integrations_sync_rules_idx ON user_integrations USING gin(sync_rules);