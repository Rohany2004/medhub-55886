-- Create function to update timestamps (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for manually entered medicines
CREATE TABLE public.medicine_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT,
  medicine_name TEXT NOT NULL,
  use_case TEXT,
  daily_dosage TEXT,
  expiry_date DATE,
  price DECIMAL(10,2),
  manufacturer TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medicine_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own medicine entries" 
ON public.medicine_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medicine entries" 
ON public.medicine_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicine entries" 
ON public.medicine_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicine entries" 
ON public.medicine_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_medicine_entries_updated_at
BEFORE UPDATE ON public.medicine_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for medicine photos
INSERT INTO storage.buckets (id, name, public) VALUES ('medicine-photos', 'medicine-photos', true);

-- Create storage policies for medicine photos
CREATE POLICY "Medicine photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medicine-photos');

CREATE POLICY "Users can upload their own medicine photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medicine-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own medicine photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'medicine-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own medicine photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medicine-photos' AND auth.uid()::text = (storage.foldername(name))[1]);