import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { imageUrl, userId } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download image from storage
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

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
        user_id: userId,
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
    return new Response(JSON.stringify({ 
      error: error.message,
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