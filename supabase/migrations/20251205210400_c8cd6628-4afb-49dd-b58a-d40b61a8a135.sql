-- Add bibliography and citation_format columns to thesis_projects table
ALTER TABLE public.thesis_projects 
ADD COLUMN IF NOT EXISTS bibliography jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS citation_format text DEFAULT 'apa';