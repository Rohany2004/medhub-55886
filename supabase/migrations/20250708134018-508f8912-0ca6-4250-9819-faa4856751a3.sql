-- Add category field to medicine_entries table
ALTER TABLE public.medicine_entries 
ADD COLUMN category TEXT DEFAULT 'Other';

-- Add an index for better performance on category filtering
CREATE INDEX idx_medicine_entries_category ON public.medicine_entries(category);

-- Update existing entries to have a default category based on use_case
UPDATE public.medicine_entries 
SET category = CASE 
  WHEN use_case ILIKE '%pain%' OR use_case ILIKE '%headache%' OR use_case ILIKE '%fever%' THEN 'Pain Relief'
  WHEN use_case ILIKE '%antibiotic%' OR use_case ILIKE '%infection%' THEN 'Antibiotics'
  WHEN use_case ILIKE '%vitamin%' OR use_case ILIKE '%supplement%' THEN 'Vitamins & Supplements'
  WHEN use_case ILIKE '%heart%' OR use_case ILIKE '%blood pressure%' OR use_case ILIKE '%cardiac%' THEN 'Cardiovascular'
  WHEN use_case ILIKE '%diabetes%' OR use_case ILIKE '%sugar%' OR use_case ILIKE '%insulin%' THEN 'Diabetes'
  WHEN use_case ILIKE '%allergy%' OR use_case ILIKE '%antihistamine%' THEN 'Allergy & Respiratory'
  WHEN use_case ILIKE '%stomach%' OR use_case ILIKE '%digestive%' OR use_case ILIKE '%acid%' THEN 'Digestive Health'
  ELSE 'Other'
END
WHERE category IS NULL OR category = 'Other';