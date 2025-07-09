-- Create Indian medicines database structure first
CREATE TABLE public.indian_medicines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    generic_name TEXT,
    manufacturer TEXT,
    composition TEXT,
    therapeutic_class TEXT,
    schedule TEXT CHECK (schedule IN ('OTC', 'H', 'H1', 'X')),
    typical_uses TEXT[],
    contraindications TEXT[],
    side_effects TEXT[],
    storage_conditions TEXT,
    pregnancy_category TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medicine brands and alternative names
CREATE TABLE public.medicine_brands (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indian_medicine_id UUID NOT NULL REFERENCES public.indian_medicines(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    manufacturer TEXT,
    pack_size TEXT,
    mrp DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medicine compositions breakdown
CREATE TABLE public.medicine_compositions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indian_medicine_id UUID NOT NULL REFERENCES public.indian_medicines(id) ON DELETE CASCADE,
    active_ingredient TEXT NOT NULL,
    strength TEXT,
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medicine categories
CREATE TABLE public.medicine_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES public.medicine_categories(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medicine barcodes
CREATE TABLE public.medicine_barcodes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indian_medicine_id UUID NOT NULL REFERENCES public.indian_medicines(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL UNIQUE,
    barcode_type TEXT DEFAULT 'EAN13',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_indian_medicines_name ON public.indian_medicines(name);
CREATE INDEX idx_indian_medicines_generic_name ON public.indian_medicines(generic_name);
CREATE INDEX idx_medicine_brands_medicine_id ON public.medicine_brands(indian_medicine_id);
CREATE INDEX idx_medicine_compositions_medicine_id ON public.medicine_compositions(indian_medicine_id);
CREATE INDEX idx_medicine_barcodes_barcode ON public.medicine_barcodes(barcode);

-- Enable RLS
ALTER TABLE public.indian_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_barcodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read access for all)
CREATE POLICY "Anyone can view indian medicines" ON public.indian_medicines FOR SELECT USING (true);
CREATE POLICY "Anyone can view medicine brands" ON public.medicine_brands FOR SELECT USING (true);
CREATE POLICY "Anyone can view medicine compositions" ON public.medicine_compositions FOR SELECT USING (true);
CREATE POLICY "Anyone can view medicine categories" ON public.medicine_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view medicine barcodes" ON public.medicine_barcodes FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_indian_medicines_updated_at BEFORE UPDATE ON public.indian_medicines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample categories
INSERT INTO public.medicine_categories (name, description) VALUES
('Analgesics', 'Pain relief medications'),
('Antibiotics', 'Anti-bacterial medications'),
('Antacids', 'Acid neutralizing medications'),
('Antihistamines', 'Allergy medications'),
('Antispasmodics', 'Muscle relaxants'),
('Vitamins & Supplements', 'Nutritional supplements'),
('Ayurvedic', 'Traditional Indian medicines'),
('Homeopathic', 'Homeopathic preparations');

-- Insert sample Indian medicines
INSERT INTO public.indian_medicines (name, generic_name, manufacturer, composition, therapeutic_class, schedule, typical_uses, contraindications, side_effects, storage_conditions) VALUES
('Crocin', 'Paracetamol', 'GSK Consumer Healthcare', 'Paracetamol 500mg', 'Analgesic, Antipyretic', 'OTC', ARRAY['Fever', 'Headache', 'Body pain'], ARRAY['Liver disease', 'Alcohol dependency'], ARRAY['Nausea', 'Skin rash'], 'Store below 30°C'),
('Disprin', 'Aspirin', 'Reckitt Benckiser', 'Aspirin 325mg', 'Analgesic, Antiplatelet', 'OTC', ARRAY['Pain relief', 'Fever', 'Heart attack prevention'], ARRAY['Bleeding disorders', 'Peptic ulcer'], ARRAY['Stomach irritation', 'Bleeding'], 'Store in cool, dry place'),
('Digene', 'Aluminium Hydroxide + Magnesium Hydroxide', 'Abbott', 'Aluminium Hydroxide 250mg + Magnesium Hydroxide 250mg', 'Antacid', 'OTC', ARRAY['Acidity', 'Heartburn', 'Indigestion'], ARRAY['Kidney disease'], ARRAY['Constipation', 'Diarrhea'], 'Store below 30°C'),
('Chyawanprash', 'Herbal formulation', 'Dabur', 'Amla, Ashwagandha, Brahmi and other herbs', 'Ayurvedic tonic', 'OTC', ARRAY['Immunity booster', 'General health'], ARRAY['Diabetes (sugar-free versions available)'], ARRAY['None reported'], 'Store in cool, dry place'),
('Cetirizine', 'Cetirizine', 'Various', 'Cetirizine 10mg', 'Antihistamine', 'OTC', ARRAY['Allergic rhinitis', 'Urticaria', 'Skin allergies'], ARRAY['Severe kidney disease'], ARRAY['Drowsiness', 'Dizziness'], 'Store below 30°C');

-- Insert sample brands
INSERT INTO public.medicine_brands (indian_medicine_id, brand_name, manufacturer, pack_size, mrp) VALUES
((SELECT id FROM public.indian_medicines WHERE name = 'Crocin'), 'Crocin 500', 'GSK', '15 tablets', 25.00),
((SELECT id FROM public.indian_medicines WHERE name = 'Disprin'), 'Disprin Regular', 'Reckitt Benckiser', '10 tablets', 15.00),
((SELECT id FROM public.indian_medicines WHERE name = 'Digene'), 'Digene Gel', 'Abbott', '200ml', 89.00),
((SELECT id FROM public.indian_medicines WHERE name = 'Chyawanprash'), 'Dabur Chyawanprash', 'Dabur', '500g', 285.00),
((SELECT id FROM public.indian_medicines WHERE name = 'Cetirizine'), 'Cetrizine-10', 'Various', '10 tablets', 12.00);