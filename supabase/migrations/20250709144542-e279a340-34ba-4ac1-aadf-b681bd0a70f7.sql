-- Medicine Reviews and Rating System
CREATE TABLE public.medicine_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    medicine_id UUID REFERENCES public.indian_medicines(id),
    medicine_entry_id UUID REFERENCES public.medicine_entries(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    side_effects TEXT[],
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    ease_of_use_rating INTEGER CHECK (ease_of_use_rating >= 1 AND ease_of_use_rating <= 5),
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prescriptions for OCR
CREATE TABLE public.prescriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    ocr_text TEXT,
    doctor_name TEXT,
    prescription_date DATE,
    patient_name TEXT,
    diagnosis TEXT,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prescription Medicines (extracted from OCR)
CREATE TABLE public.prescription_medicines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    instructions TEXT,
    indian_medicine_id UUID REFERENCES public.indian_medicines(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Symptoms database
CREATE TABLE public.symptoms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,
    severity_level TEXT CHECK (severity_level IN ('mild', 'moderate', 'severe')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Symptom to Medicine mapping
CREATE TABLE public.symptom_medicine_mapping (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    symptom_id UUID NOT NULL REFERENCES public.symptoms(id),
    indian_medicine_id UUID NOT NULL REFERENCES public.indian_medicines(id),
    effectiveness_score DECIMAL(3,2) CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pharmacies
CREATE TABLE public.pharmacies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medicine Prices at different pharmacies
CREATE TABLE public.medicine_prices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indian_medicine_id UUID NOT NULL REFERENCES public.indian_medicines(id),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id),
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    pack_size TEXT,
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'out_of_stock', 'limited')),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Q&A Section
CREATE TABLE public.questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_answered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Answers to questions
CREATE TABLE public.answers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    user_id UUID,
    content TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT false,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User interactions (votes, helpful marks)
CREATE TABLE public.user_interactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('review', 'question', 'answer')),
    target_id UUID NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('upvote', 'downvote', 'helpful', 'unhelpful')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, target_type, target_id, interaction_type)
);

-- Indexes for better performance
CREATE INDEX idx_medicine_reviews_medicine_id ON public.medicine_reviews(medicine_id);
CREATE INDEX idx_medicine_reviews_user_id ON public.medicine_reviews(user_id);
CREATE INDEX idx_prescriptions_user_id ON public.prescriptions(user_id);
CREATE INDEX idx_prescription_medicines_prescription_id ON public.prescription_medicines(prescription_id);
CREATE INDEX idx_symptom_medicine_mapping_symptom_id ON public.symptom_medicine_mapping(symptom_id);
CREATE INDEX idx_medicine_prices_medicine_id ON public.medicine_prices(indian_medicine_id);
CREATE INDEX idx_medicine_prices_pharmacy_id ON public.medicine_prices(pharmacy_id);
CREATE INDEX idx_questions_user_id ON public.questions(user_id);
CREATE INDEX idx_answers_question_id ON public.answers(question_id);
CREATE INDEX idx_user_interactions_user_target ON public.user_interactions(user_id, target_type, target_id);

-- Enable RLS on all tables
ALTER TABLE public.medicine_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_medicine_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medicine_reviews
CREATE POLICY "Users can view all reviews" ON public.medicine_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.medicine_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.medicine_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.medicine_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prescriptions
CREATE POLICY "Users can view their own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prescriptions" ON public.prescriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prescriptions" ON public.prescriptions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prescription_medicines
CREATE POLICY "Users can view prescription medicines for their prescriptions" ON public.prescription_medicines FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.prescriptions WHERE prescriptions.id = prescription_medicines.prescription_id AND prescriptions.user_id = auth.uid()));

-- RLS Policies for symptoms (public read access)
CREATE POLICY "Anyone can view symptoms" ON public.symptoms FOR SELECT USING (true);

-- RLS Policies for symptom_medicine_mapping (public read access)
CREATE POLICY "Anyone can view symptom medicine mappings" ON public.symptom_medicine_mapping FOR SELECT USING (true);

-- RLS Policies for pharmacies (public read access)
CREATE POLICY "Anyone can view pharmacies" ON public.pharmacies FOR SELECT USING (true);

-- RLS Policies for medicine_prices (public read access)
CREATE POLICY "Anyone can view medicine prices" ON public.medicine_prices FOR SELECT USING (true);

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Users can create questions" ON public.questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own questions" ON public.questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own questions" ON public.questions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for answers
CREATE POLICY "Anyone can view answers" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Users can create answers" ON public.answers FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own answers" ON public.answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own answers" ON public.answers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_interactions
CREATE POLICY "Users can view their own interactions" ON public.user_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own interactions" ON public.user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interactions" ON public.user_interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON public.user_interactions FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_medicine_reviews_updated_at BEFORE UPDATE ON public.medicine_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for symptoms
INSERT INTO public.symptoms (name, description, category, severity_level) VALUES
('Headache', 'Pain in the head or upper neck', 'Neurological', 'mild'),
('Fever', 'Elevated body temperature', 'General', 'moderate'),
('Cough', 'Repetitive coughing', 'Respiratory', 'mild'),
('Nausea', 'Feeling of sickness with urge to vomit', 'Gastrointestinal', 'mild'),
('Stomach Pain', 'Abdominal discomfort or pain', 'Gastrointestinal', 'moderate'),
('Cold', 'Common cold symptoms', 'Respiratory', 'mild'),
('Sore Throat', 'Pain or irritation in throat', 'Respiratory', 'mild'),
('Diarrhea', 'Loose or watery bowel movements', 'Gastrointestinal', 'moderate'),
('Constipation', 'Difficulty in bowel movements', 'Gastrointestinal', 'mild'),
('Allergic Reaction', 'Immune system response to allergens', 'Immune', 'moderate');

-- Insert sample pharmacies
INSERT INTO public.pharmacies (name, location, address, phone, verified) VALUES
('Apollo Pharmacy', 'Mumbai', '123 Main Street, Mumbai, Maharashtra', '+91-22-12345678', true),
('MedPlus', 'Delhi', '456 Central Avenue, Delhi', '+91-11-87654321', true),
('Wellness Forever', 'Bangalore', '789 Tech Park Road, Bangalore, Karnataka', '+91-80-11223344', true),
('Netmeds', 'Online', 'Online Pharmacy Service', '+91-40-99887766', true),
('1mg', 'Online', 'Online Medicine Delivery', '+91-124-5566778', true);