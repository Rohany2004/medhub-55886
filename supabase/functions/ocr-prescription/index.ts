import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const body = await req.json();
    const schema = z.object({
      imageUrl: z.string().url().max(2048).refine((u) => u.startsWith('https://'), { message: 'imageUrl must be https' })
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { imageUrl } = parsed.data;

    // Auth check: require valid bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user from token
    const authClient = createClient(supabaseUrl, supabaseAnon);
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // Service role client for DB writes
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Download image from storage
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Convert to base64 without causing stack overflow
    const uint8Array = new Uint8Array(imageBuffer);
    const chunks = [];
    const chunkSize = 8192; // Process in chunks to avoid stack overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      chunks.push(String.fromCharCode(...chunk));
    }
    
    const imageBase64 = btoa(chunks.join(''));

    const prompt = `You are a medical prescription OCR system. Analyze this prescription image and extract the following information in a structured JSON format:

{
  "extractedText": "Full OCR text from the prescription",
  "doctorName": "Doctor's name if found",
  "patientName": "Patient's name if found", 
  "prescriptionDate": "Date of prescription if found",
  "diagnosis": "Diagnosis or condition if mentioned",
  "medicines": [
    {
      "name": "Medicine name",
      "dosage": "Dosage amount",
      "frequency": "How often to take",
      "duration": "Duration of treatment",
      "instructions": "Special instructions"
    }
  ]
}

Extract all visible text first, then identify and structure the medical information. Be accurate and only include information that is clearly visible in the image.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON from the response
    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      analysisResult = {
        extractedText: content,
        doctorName: null,
        patientName: null,
        prescriptionDate: null,
        diagnosis: null,
        medicines: []
      };
    }

    // Store prescription in database
    const { data: prescriptionData, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        user_id: userData.user.id,
        image_url: imageUrl,
        ocr_text: analysisResult.extractedText,
        doctor_name: analysisResult.doctorName,
        patient_name: analysisResult.patientName,
        prescription_date: analysisResult.prescriptionDate,
        diagnosis: analysisResult.diagnosis,
        status: 'completed'
      })
      .select()
      .single();

    if (prescriptionError) {
      console.error('Error storing prescription:', prescriptionError);
      // Continue even if storage fails
    }

    // Store prescription medicines if any
    if (analysisResult.medicines && analysisResult.medicines.length > 0 && prescriptionData) {
      const medicineEntries = analysisResult.medicines.map((medicine: any) => ({
        prescription_id: prescriptionData.id,
        medicine_name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        duration: medicine.duration,
        instructions: medicine.instructions
      }));

      const { error: medicineError } = await supabase
        .from('prescription_medicines')
        .insert(medicineEntries);

      if (medicineError) {
        console.error('Error storing prescription medicines:', medicineError);
        // Continue even if storage fails
      }
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ocr-prescription function:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: msg,
      extractedText: "Failed to process prescription image",
      doctorName: null,
      patientName: null,
      prescriptionDate: null,
      diagnosis: null,
      medicines: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});