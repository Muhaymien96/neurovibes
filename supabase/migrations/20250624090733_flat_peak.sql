/*
  # Add neurodivergent type to profiles

  1. New Column
    - `neurodivergent_type` (enum: 'none', 'adhd', 'autism', 'anxiety', 'multiple')
      - Allows users to specify their neurodivergent profile
      - Defaults to 'none' for existing users
      - Used to personalize AI coaching and UI experience

  2. Security
    - Maintains existing RLS policies
    - Users can only update their own neurodivergent type
*/

-- Create enum type for neurodivergent profiles
CREATE TYPE neurodivergent_type AS ENUM ('none', 'adhd', 'autism', 'anxiety', 'multiple');

-- Add neurodivergent_type column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'neurodivergent_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN neurodivergent_type neurodivergent_type DEFAULT 'none';
  END IF;
END $$;

-- Create index for filtering and analytics
CREATE INDEX IF NOT EXISTS profiles_neurodivergent_type_idx ON profiles(neurodivergent_type);

-- Add helpful comment
COMMENT ON COLUMN profiles.neurodivergent_type IS 'User''s neurodivergent profile for personalized AI coaching and UI adaptation';