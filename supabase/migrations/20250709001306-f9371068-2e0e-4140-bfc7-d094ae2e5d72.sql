-- Create reminders table for medicine dosage and expiry alerts
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medicine_id UUID REFERENCES public.medicine_entries(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('dosage', 'expiry', 'refill')),
  title TEXT NOT NULL,
  message TEXT,
  reminder_time TIME,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  days_of_week INTEGER[], -- for weekly reminders: 0=Sunday, 1=Monday, etc.
  custom_schedule JSONB, -- for complex scheduling
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  next_trigger_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_groups table for social features
CREATE TABLE public.family_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'base64'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_group_id, user_id)
);

-- Create shared_medicines table for medicine sharing
CREATE TABLE public.shared_medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID NOT NULL REFERENCES public.medicine_entries(id) ON DELETE CASCADE,
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create usage_logs table for analytics
CREATE TABLE public.usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medicine_id UUID REFERENCES public.medicine_entries(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('take_dose', 'skip_dose', 'refill', 'view', 'edit')),
  quantity_taken NUMERIC,
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reminders
CREATE POLICY "Users can view their own reminders" 
ON public.reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" 
ON public.reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.reminders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.reminders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for family_groups
CREATE POLICY "Users can view family groups they belong to" 
ON public.family_groups 
FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_group_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create family groups" 
ON public.family_groups 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Family group owners can update their groups" 
ON public.family_groups 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Family group owners can delete their groups" 
ON public.family_groups 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create RLS policies for family_members
CREATE POLICY "Users can view family members in their groups" 
ON public.family_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.family_groups 
    WHERE id = family_group_id AND 
    (owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.family_group_id = id AND fm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can join family groups" 
ON public.family_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family admins can manage members" 
ON public.family_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.family_groups fg
    JOIN public.family_members fm ON fg.id = fm.family_group_id
    WHERE fg.id = family_group_id AND 
    fm.user_id = auth.uid() AND 
    fm.role IN ('owner', 'admin')
  ) OR user_id = auth.uid()
);

-- Create RLS policies for shared_medicines
CREATE POLICY "Users can view shared medicines in their family groups" 
ON public.shared_medicines 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_group_id = shared_medicines.family_group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can share their own medicines" 
ON public.shared_medicines 
FOR INSERT 
WITH CHECK (
  auth.uid() = shared_by AND
  EXISTS (
    SELECT 1 FROM public.medicine_entries 
    WHERE id = medicine_id AND user_id = auth.uid()
  )
);

-- Create RLS policies for usage_logs
CREATE POLICY "Users can view their own usage logs" 
ON public.usage_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage logs" 
ON public.usage_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_groups_updated_at
  BEFORE UPDATE ON public.family_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate next reminder time
CREATE OR REPLACE FUNCTION public.calculate_next_reminder_time(
  reminder_id UUID,
  frequency TEXT,
  reminder_time TIME,
  days_of_week INTEGER[],
  custom_schedule JSONB
) RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  next_time TIMESTAMP WITH TIME ZONE;
  current_date DATE := CURRENT_DATE;
  current_day INTEGER := EXTRACT(DOW FROM CURRENT_DATE);
  target_day INTEGER;
BEGIN
  CASE frequency
    WHEN 'daily' THEN
      next_time := (current_date + INTERVAL '1 day' + reminder_time::INTERVAL);
    WHEN 'weekly' THEN
      -- Find next day of week in the array
      target_day := NULL;
      FOR i IN 1..array_length(days_of_week, 1) LOOP
        IF days_of_week[i] > current_day THEN
          target_day := days_of_week[i];
          EXIT;
        END IF;
      END LOOP;
      
      -- If no day found this week, use first day of next week
      IF target_day IS NULL AND array_length(days_of_week, 1) > 0 THEN
        target_day := days_of_week[1] + 7;
      END IF;
      
      IF target_day IS NOT NULL THEN
        next_time := (current_date + (target_day - current_day) * INTERVAL '1 day' + reminder_time::INTERVAL);
      ELSE
        next_time := (current_date + INTERVAL '1 week' + reminder_time::INTERVAL);
      END IF;
    WHEN 'monthly' THEN
      next_time := (current_date + INTERVAL '1 month' + reminder_time::INTERVAL);
    ELSE
      -- Default to daily if frequency not recognized
      next_time := (current_date + INTERVAL '1 day' + reminder_time::INTERVAL);
  END CASE;
  
  RETURN next_time;
END;
$$;