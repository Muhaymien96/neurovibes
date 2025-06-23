/*
  # Remove Notion Integration Support

  1. Updates
    - Remove 'notion' from integration_type enum
    - Clean up any existing notion integrations
    - Update sync_mappings to only support google_calendar

  2. Security
    - Maintain existing RLS policies
*/

-- Remove any existing notion integrations
DELETE FROM sync_mappings WHERE integration_type = 'notion';
DELETE FROM user_integrations WHERE integration_type = 'notion';

-- Create new enum without notion
CREATE TYPE integration_type_new AS ENUM ('google_calendar');

-- Update tables to use new enum
ALTER TABLE user_integrations 
  ALTER COLUMN integration_type TYPE integration_type_new 
  USING integration_type::text::integration_type_new;

ALTER TABLE sync_mappings 
  ALTER COLUMN integration_type TYPE integration_type_new 
  USING integration_type::text::integration_type_new;

-- Drop old enum and rename new one
DROP TYPE integration_type;
ALTER TYPE integration_type_new RENAME TO integration_type;