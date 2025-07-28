-- Migration script to update love_language to love_languages array
-- Run this script in your Supabase SQL editor

-- First, add the new column if it doesn't exist
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS love_languages TEXT[] DEFAULT '{}';

-- Update existing records to migrate love_language to love_languages array
UPDATE public.partners 
SET love_languages = ARRAY[love_language] 
WHERE love_language IS NOT NULL 
  AND love_language != '' 
  AND (love_languages IS NULL OR array_length(love_languages, 1) IS NULL);

-- Drop the old column after migration is complete
-- ALTER TABLE public.partners DROP COLUMN IF EXISTS love_language;

-- Verify the migration
SELECT 
  id, 
  name, 
  love_languages,
  array_length(love_languages, 1) as love_languages_count
FROM public.partners 
WHERE love_languages IS NOT NULL 
  AND array_length(love_languages, 1) > 0
LIMIT 10; 