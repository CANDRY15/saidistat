-- Create table for storing thesis projects
CREATE TABLE public.thesis_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  domain TEXT DEFAULT 'Médecine',
  population TEXT,
  period TEXT,
  location TEXT,
  study_type JSONB,
  study_type_approved BOOLEAN DEFAULT false,
  current_step INTEGER DEFAULT 1,
  generated_sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.thesis_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own thesis projects"
ON public.thesis_projects
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own thesis projects"
ON public.thesis_projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thesis projects"
ON public.thesis_projects
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thesis projects"
ON public.thesis_projects
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_thesis_projects_updated_at
BEFORE UPDATE ON public.thesis_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();