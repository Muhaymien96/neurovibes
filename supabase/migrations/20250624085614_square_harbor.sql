/*
  # Add reminders table for enhanced notification system

  1. New Tables
    - `reminders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text, optional)
      - `remind_at` (timestamptz)
      - `snooze_duration_minutes` (integer, optional)
      - `original_reminder_id` (uuid, optional, for linking snoozed instances)
      - `is_dismissed` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on reminders table
    - Add policies for authenticated users to manage their own reminders
*/

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  remind_at timestamptz NOT NULL,
  snooze_duration_minutes integer,
  original_reminder_id uuid REFERENCES reminders(id) ON DELETE CASCADE,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for reminders
CREATE POLICY "Users can manage own reminders"
  ON reminders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON reminders(user_id);
CREATE INDEX IF NOT EXISTS reminders_remind_at_idx ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS reminders_original_id_idx ON reminders(original_reminder_id);

-- Create trigger for updated_at
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();