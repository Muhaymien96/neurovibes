/*
  # Add integration tables for Google Calendar and Notion sync

  1. New Tables
    - `user_integrations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `integration_type` (enum: 'google_calendar', 'notion')
      - `access_token` (encrypted text)
      - `refresh_token` (encrypted text)
      - `expires_at` (timestamp)
      - `integration_data` (jsonb for storing additional config)
      - `is_active` (boolean)
      - `last_sync_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `sync_mappings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `mindmesh_task_id` (uuid, foreign key to tasks)
      - `external_id` (text, external task/event ID)
      - `integration_type` (enum)
      - `sync_direction` (enum: 'import', 'export', 'bidirectional')
      - `last_synced_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own integrations
*/

-- Create enum types
CREATE TYPE integration_type AS ENUM ('google_calendar', 'notion');
CREATE TYPE sync_direction AS ENUM ('import', 'export', 'bidirectional');

-- Create user_integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  integration_type integration_type NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  integration_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sync_mappings table
CREATE TABLE IF NOT EXISTS sync_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mindmesh_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  integration_type integration_type NOT NULL,
  sync_direction sync_direction DEFAULT 'bidirectional',
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_integrations
CREATE POLICY "Users can manage own integrations"
  ON user_integrations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for sync_mappings
CREATE POLICY "Users can manage own sync mappings"
  ON sync_mappings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_integrations_user_id_idx ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS user_integrations_type_idx ON user_integrations(integration_type);
CREATE INDEX IF NOT EXISTS sync_mappings_user_id_idx ON sync_mappings(user_id);
CREATE INDEX IF NOT EXISTS sync_mappings_external_id_idx ON sync_mappings(external_id);
CREATE INDEX IF NOT EXISTS sync_mappings_task_id_idx ON sync_mappings(mindmesh_task_id);

-- Create unique constraint to prevent duplicate integrations
CREATE UNIQUE INDEX IF NOT EXISTS user_integrations_unique_type 
  ON user_integrations(user_id, integration_type) 
  WHERE is_active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();