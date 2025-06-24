/*
  # Add focus sessions table for Focus Buddy feature

  1. New Tables
    - `focus_sessions`
      - `id` (uuid, primary key)
      - `host_id` (uuid, foreign key to profiles)
      - `viewer_id` (uuid, optional, foreign key to profiles)
      - `session_link_uuid` (uuid, for sharing)
      - `current_task` (text, optional)
      - `mood` (text, optional)
      - `timer_state` (jsonb, for storing timer details)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on focus_sessions table
    - Add policies for hosts to manage their sessions and viewers to read joined sessions
*/

CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_link_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  current_task text,
  mood text,
  timer_state jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for focus_sessions
CREATE POLICY "Hosts can manage own sessions"
  ON focus_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Viewers can read joined sessions"
  ON focus_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = viewer_id OR auth.uid() = host_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS focus_sessions_host_id_idx ON focus_sessions(host_id);
CREATE INDEX IF NOT EXISTS focus_sessions_viewer_id_idx ON focus_sessions(viewer_id);
CREATE INDEX IF NOT EXISTS focus_sessions_link_uuid_idx ON focus_sessions(session_link_uuid);
CREATE INDEX IF NOT EXISTS focus_sessions_active_idx ON focus_sessions(is_active) WHERE is_active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_focus_sessions_updated_at
  BEFORE UPDATE ON focus_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();