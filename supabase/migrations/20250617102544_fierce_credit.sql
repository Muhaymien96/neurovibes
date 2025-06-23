/*
  # Add brain dumps table for offline-first thought capture

  1. New Tables
    - `brain_dumps`
      - `id` (text, primary key) - client-generated UUID
      - `user_id` (uuid, foreign key)
      - `content` (text) - the raw brain dump content
      - `entry_type` (text) - 'voice' or 'text'
      - `timestamp` (timestamptz) - when the entry was created
      - `processed` (boolean) - whether AI has processed this entry
      - `ai_result` (jsonb) - the AI processing result
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `brain_dumps` table
    - Add policy for users to manage their own brain dumps
*/

CREATE TABLE IF NOT EXISTS brain_dumps (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('voice', 'text')),
  timestamp timestamptz NOT NULL,
  processed boolean DEFAULT false,
  ai_result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brain_dumps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own brain dumps"
  ON brain_dumps
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS brain_dumps_user_id_idx ON brain_dumps(user_id);
CREATE INDEX IF NOT EXISTS brain_dumps_timestamp_idx ON brain_dumps(timestamp DESC);
CREATE INDEX IF NOT EXISTS brain_dumps_processed_idx ON brain_dumps(processed);

-- Create trigger for updated_at
CREATE TRIGGER update_brain_dumps_updated_at
  BEFORE UPDATE ON brain_dumps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();